import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@kairo/db';
import { TenantContext } from './tenant-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly tenantContext: TenantContext) {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * The client services should run tenant-scoped queries on. Inside an HTTP
   * request that passed TenantGuard, this is the RLS transaction opened by
   * TenantRlsInterceptor (GUC set → Postgres strictly scopes every query to the
   * org). Outside that context — background jobs, org provisioning, auth — it's
   * the plain client, where the `tenant_isolation` policies are permissive
   * (GUC unset), so those deliberately cross-tenant paths keep working.
   */
  get tenant(): Prisma.TransactionClient {
    return this.tenantContext.get()?.tx ?? this;
  }

  /**
   * Run `fn` inside a transaction with the Postgres RLS tenant context set, so
   * the `tenant_isolation` policies (see migration `tenant_rls`) strictly scope
   * every query to `organizationId` at the database level — defense in depth on
   * top of TenantGuard. `set_config(..., true)` is LOCAL to the transaction, so
   * the value never leaks across pooled connections. The generous timeout
   * absorbs cold starts on serverless Postgres (Neon) without tripping.
   */
  runWithTenant<T>(
    organizationId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(
      async (tx) => {
        // Parameterized via set_config to avoid any interpolation into SQL.
        await tx.$executeRaw`SELECT set_config('app.current_org_id', ${organizationId}, true)`;
        return fn(tx);
      },
      { timeout: 15_000, maxWait: 5_000 },
    );
  }
}

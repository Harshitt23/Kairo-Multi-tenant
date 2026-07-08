import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '@pm/db';

/**
 * Per-request tenant state, carried out-of-band via AsyncLocalStorage so it
 * doesn't have to be threaded through every service signature.
 *
 * `tx` is the interactive transaction opened by TenantRlsInterceptor with the
 * Postgres RLS GUC (`app.current_org_id`) already set. Services reach it through
 * `PrismaService.tenant`, so every query in the request runs on that connection
 * and is strictly scoped to `organizationId` by the `tenant_isolation` policies.
 */
export interface TenantStore {
  organizationId: string;
  tx: Prisma.TransactionClient;
}

@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run<T>(store: TenantStore, fn: () => T): T {
    return this.als.run(store, fn);
  }

  get(): TenantStore | undefined {
    return this.als.getStore();
  }
}

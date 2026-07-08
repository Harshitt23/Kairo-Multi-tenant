import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, lastValueFrom, type Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant-context';
import type { AuthenticatedRequest } from '../types/request';

/**
 * Turns Postgres row-level security from documented-but-dormant into actively
 * enforced. Runs after the guard chain (so TenantGuard has resolved
 * `req.organizationId`) and wraps the whole handler in an RLS transaction: the
 * session GUC is set from the authenticated membership's org, and every query
 * the handler issues via `PrismaService.tenant` is filtered to that org by the
 * database. A service that forgot its `organizationId` WHERE clause — or a SQL
 * injection foothold — still cannot read or write across tenants.
 *
 * Requests without an org context (login, org creation, invite acceptance,
 * the per-user notifications endpoints) are passed through untouched; there the
 * policies stay permissive, which is what those cross-tenant paths need.
 */
@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const organizationId = req.organizationId;
    if (!organizationId) return next.handle();

    return from(
      this.prisma.runWithTenant(organizationId, (tx) =>
        this.tenantContext.run({ organizationId, tx }, () => lastValueFrom(next.handle())),
      ),
    );
  }
}

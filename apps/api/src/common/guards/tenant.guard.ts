import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../types/request';

/**
 * The seniority centerpiece: tenant isolation enforced at the request boundary.
 *
 * Resolves the org from the route (`:orgSlug`) or `x-org-slug` header, verifies
 * the authenticated user is a member of THAT org, and stamps `organizationId` +
 * `role` onto the request. Downstream services scope every query by
 * `req.organizationId` — isolation lives in one place, not sprinkled across
 * call sites. Combine with Postgres row-level security for defence in depth.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!req.user) {
      // Should never happen behind JwtAuthGuard, but fail closed.
      throw new ForbiddenException('Unauthenticated');
    }

    const orgSlug =
      (req.params?.orgSlug as string | undefined) ??
      (req.headers['x-org-slug'] as string | undefined);

    if (!orgSlug) {
      throw new BadRequestException('Missing org context (orgSlug param or x-org-slug header)');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: req.user.sub, organization: { slug: orgSlug } },
      select: { id: true, role: true, organizationId: true },
    });

    if (!membership) {
      // 403 not 404 — don't leak whether the org exists.
      throw new ForbiddenException('Not a member of this organization');
    }

    req.organizationId = membership.organizationId;
    req.membershipId = membership.id;
    req.role = membership.role;
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { can, atLeast, type Permission, type Role } from '@pm/types';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators';
import type { AuthenticatedRequest } from '../types/request';

/**
 * Authorizes based on the org role TenantGuard resolved. Reads @RequirePermission
 * and @Roles metadata and checks it against the shared RBAC matrix in @pm/types,
 * so the API and the UI enforce the exact same rules. Runs AFTER TenantGuard.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No RBAC metadata -> membership alone (enforced by TenantGuard) is enough.
    if ((!permissions || permissions.length === 0) && (!roles || roles.length === 0)) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.role;
    if (!role) {
      throw new ForbiddenException('No role in request context — TenantGuard must run first');
    }

    if (roles?.length && !roles.some((r) => atLeast(role, r))) {
      throw new ForbiddenException(`Requires role: ${roles.join(' or ')}`);
    }

    if (permissions?.length) {
      const missing = permissions.filter((p) => !can(role, p));
      if (missing.length > 0) {
        throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`);
      }
    }

    return true;
  }
}

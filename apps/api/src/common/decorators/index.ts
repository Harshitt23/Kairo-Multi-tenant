import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  CustomDecorator,
} from '@nestjs/common';
import type { Permission, Role } from '@pm/types';
import type { AuthenticatedRequest, AuthUser } from '../types/request';

// --- metadata keys -------------------------------------------------------
export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'requiredPermissions';
export const ROLES_KEY = 'requiredRoles';

/** Skip JwtAuthGuard for this route (login, register, webhooks…). */
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Require the caller's org role to hold every listed permission. */
export const RequirePermission = (...permissions: Permission[]): CustomDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Require the caller's org role to be one of `roles` (coarse check). */
export const Roles = (...roles: Role[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);

// --- param decorators ----------------------------------------------------
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);

/** The tenant id resolved by TenantGuard for this request. */
export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().organizationId;
  },
);

export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Role | undefined => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().role;
  },
);

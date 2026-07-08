import type { Request } from 'express';
import type { Role } from '@pm/types';

/** Decoded JWT access-token payload. */
export interface AuthUser {
  sub: string; // user id
  email: string;
}

/**
 * Properties attached to the request as it passes through the guard chain:
 * JwtAuthGuard sets `user`; TenantGuard sets `organizationId`/`role`.
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  organizationId?: string;
  membershipId?: string;
  role?: Role;
}

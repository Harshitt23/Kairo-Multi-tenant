// ============================================================================
// RBAC — single source of truth shared by API guards and the web UI.
//
// Roles are ordered (OWNER > ADMIN > MEMBER > GUEST). Permissions are explicit
// rather than derived from rank so we can grant a narrow capability to a lower
// role without widening everything above it.
// ============================================================================

export const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  GUEST: 0,
};

export type Permission =
  // org
  | 'org:update'
  | 'org:delete'
  | 'org:manage_billing'
  // members
  | 'member:invite'
  | 'member:remove'
  | 'member:update_role'
  // projects
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  // issues
  | 'issue:create'
  | 'issue:update'
  | 'issue:delete'
  | 'issue:assign'
  // collaboration
  | 'comment:create'
  | 'attachment:upload'
  // audit
  | 'audit:read';

const MEMBER_PERMS: Permission[] = [
  'project:create',
  'project:update',
  'issue:create',
  'issue:update',
  'issue:delete',
  'issue:assign',
  'comment:create',
  'attachment:upload',
];

const ADMIN_PERMS: Permission[] = [
  ...MEMBER_PERMS,
  'org:update',
  'member:invite',
  'member:remove',
  'member:update_role',
  'project:delete',
  'audit:read',
];

const OWNER_PERMS: Permission[] = [...ADMIN_PERMS, 'org:delete', 'org:manage_billing'];

const GUEST_PERMS: Permission[] = ['comment:create'];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(OWNER_PERMS),
  ADMIN: new Set(ADMIN_PERMS),
  MEMBER: new Set(MEMBER_PERMS),
  GUEST: new Set(GUEST_PERMS),
};

/** Does `role` carry `permission`? */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Is `role` at least as privileged as `min`? Useful for coarse checks. */
export function atLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

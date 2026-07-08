import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { Permission, Role } from '@pm/types';
import { RbacGuard } from './rbac.guard';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators';

function makeContext(role: Role | undefined): ExecutionContext {
  const req = { role };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeReflector(perms?: Permission[], roles?: Role[]): Reflector {
  return {
    getAllAndOverride: (key: string) => {
      if (key === PERMISSIONS_KEY) return perms;
      if (key === ROLES_KEY) return roles;
      return undefined;
    },
  } as unknown as Reflector;
}

describe('RbacGuard', () => {
  it('allows when no metadata is present (membership suffices)', () => {
    const guard = new RbacGuard(makeReflector());
    expect(guard.canActivate(makeContext('GUEST'))).toBe(true);
  });

  it('allows a MEMBER to create issues', () => {
    const guard = new RbacGuard(makeReflector(['issue:create']));
    expect(guard.canActivate(makeContext('MEMBER'))).toBe(true);
  });

  it('denies a GUEST creating issues', () => {
    const guard = new RbacGuard(makeReflector(['issue:create']));
    expect(() => guard.canActivate(makeContext('GUEST'))).toThrow(ForbiddenException);
  });

  it('denies a MEMBER managing billing (owner-only permission)', () => {
    const guard = new RbacGuard(makeReflector(['org:manage_billing']));
    expect(() => guard.canActivate(makeContext('MEMBER'))).toThrow(ForbiddenException);
  });

  it('enforces minimum-role checks', () => {
    const guard = new RbacGuard(makeReflector(undefined, ['ADMIN']));
    expect(guard.canActivate(makeContext('OWNER'))).toBe(true);
    expect(() => guard.canActivate(makeContext('MEMBER'))).toThrow(ForbiddenException);
  });

  it('throws when role context is missing', () => {
    const guard = new RbacGuard(makeReflector(['issue:create']));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});

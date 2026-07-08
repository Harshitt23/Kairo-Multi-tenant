import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput } from '@pm/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService, type IssuedTokens } from './token.service';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async register(
    input: RegisterInput,
    device: { userAgent?: string; ip?: string },
  ): Promise<{ tokens: IssuedTokens; userId: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });

    // Optionally bootstrap an org with the new user as OWNER.
    if (input.orgName) {
      await this.createOrgForUser(user.id, input.orgName);
    }

    const tokens = await this.tokens.issueForUser({ sub: user.id, email: user.email }, device);
    return { tokens, userId: user.id };
  }

  async login(
    input: LoginInput,
    device: { userAgent?: string; ip?: string },
  ): Promise<{ tokens: IssuedTokens; userId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Constant-ish work whether or not the user exists, to blunt enumeration.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(input.password, hash);
    if (!user || !user.passwordHash || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokens.issueForUser({ sub: user.id, email: user.email }, device);
    return { tokens, userId: user.id };
  }

  async refresh(token: string, device: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
    return this.tokens.rotate(token, device);
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.tokens.revoke(token);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, slug: true, name: true } },
          },
        },
      },
    });
    return user;
  }

  private async createOrgForUser(userId: string, name: string): Promise<void> {
    // Ensure a unique slug.
    const base = slugify(name) || 'org';
    let slug = base;
    for (let i = 1; await this.prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const org = await this.prisma.organization.create({
      data: {
        name,
        slug,
        memberships: { create: { userId, role: 'OWNER' } },
        subscription: { create: { plan: 'FREE', status: 'ACTIVE', seats: 1 } },
      },
    });

    await this.audit.record({
      organizationId: org.id,
      actorId: userId,
      action: 'org.created',
      entityType: 'Organization',
      entityId: org.id,
      metadata: { slug, name },
    });
  }
}

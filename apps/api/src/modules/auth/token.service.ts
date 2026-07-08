import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Env } from '../../config/env';
import type { AuthUser } from '../../common/types/request';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

/**
 * Issues access JWTs and rotating refresh tokens.
 *
 * Refresh tokens are opaque random strings; only their SHA-256 hash is stored.
 * Each token belongs to a "family" — rotating a token revokes the old one and
 * issues a new one in the same family. If a revoked token is presented again
 * (reuse), the whole family is revoked: the signal of a stolen token.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccess(user: AuthUser): string {
    return this.jwt.sign(
      { sub: user.sub, email: user.email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );
  }

  /** Issue a fresh access + refresh pair, starting a new refresh family. */
  async issueForUser(user: AuthUser, device: DeviceInfo = {}): Promise<IssuedTokens> {
    return this.createRefresh(user, nanoid(), device);
  }

  /** Rotate: validate the presented refresh token and mint a new pair. */
  async rotate(presentedToken: string, device: DeviceInfo = {}): Promise<IssuedTokens> {
    const tokenHash = this.hash(presentedToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse of an already-rotated/revoked token => compromise. Nuke the family.
    if (existing.revokedAt || existing.expiresAt < new Date()) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: existing.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired or reused');
    }

    // Revoke the consumed token and issue a successor in the same family.
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.createRefresh(
      { sub: existing.user.id, email: existing.user.email },
      existing.familyId,
      device,
    );
  }

  /** Revoke the family a token belongs to (logout / "sign out everywhere"). */
  async revoke(presentedToken: string): Promise<void> {
    const tokenHash = this.hash(presentedToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!existing) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefresh(
    user: AuthUser,
    familyId: string,
    device: DeviceInfo,
  ): Promise<IssuedTokens> {
    const raw = randomBytes(48).toString('base64url');
    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.sub,
        tokenHash: this.hash(raw),
        familyId,
        expiresAt,
        userAgent: device.userAgent,
        ip: device.ip,
      },
    });

    return {
      accessToken: this.signAccess(user),
      refreshToken: raw,
      refreshExpiresAt: expiresAt,
    };
  }
}

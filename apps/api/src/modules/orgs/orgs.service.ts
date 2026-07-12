import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateOrgInput, Role, SearchQuery } from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { Env } from '../../config/env';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class OrgsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, input: CreateOrgInput) {
    const clash = await this.prisma.organization.findUnique({ where: { slug: input.slug } });
    if (clash) throw new BadRequestException('Slug already taken');

    const org = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
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
    });

    return org;
  }

  listForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      select: {
        id: true,
        slug: true,
        name: true,
        memberships: { where: { userId }, select: { role: true } },
        _count: { select: { projects: true, memberships: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getBySlug(organizationId: string) {
    return this.prisma.tenant.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: {
        subscription: true,
        _count: { select: { projects: true, memberships: true } },
      },
    });
  }

  /**
   * Workspace-wide search: issues (by title/description) and projects (by
   * name/key) across every project in the tenant. Powers the command palette
   * and the /search page. Always tenant-scoped via `prisma.tenant`.
   */
  async search(organizationId: string, { q, limit }: SearchQuery) {
    const [issues, projects] = await Promise.all([
      this.prisma.tenant.issue.findMany({
        where: {
          organizationId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { key: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.tenant.project.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, key: true, name: true, description: true },
        orderBy: { createdAt: 'asc' },
        take: 5,
      }),
    ]);

    return {
      issues: issues.map((i) => ({
        id: i.id,
        number: i.number,
        title: i.title,
        status: i.status,
        priority: i.priority,
        projectKey: i.project.key,
      })),
      projects,
    };
  }

  /**
   * "My Work": every issue assigned to `userId` across all projects in the
   * tenant, with the project key (for deep-links), due date and labels so the
   * client can bucket them by SLA. Ordered soonest-due first.
   */
  async myWork(organizationId: string, userId: string) {
    const issues = await this.prisma.tenant.issue.findMany({
      where: { organizationId, assigneeId: userId },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
        project: { select: { key: true, name: true } },
        labels: { select: { label: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { updatedAt: 'desc' }],
    });

    return issues.map(({ project, ...i }) => ({
      ...i,
      projectKey: project.key,
      projectName: project.name,
    }));
  }

  listMembers(organizationId: string) {
    return this.prisma.tenant.membership.findMany({
      where: { organizationId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Invite a member by email. If the user already exists they're added to the
   * org immediately; otherwise we persist a tokened Invite row (storing only a
   * hash of the token) and email a one-time accept link. The raw token lives
   * only in the email — same single-use-secret pattern as refresh tokens.
   */
  async addMember(
    organizationId: string,
    actorId: string,
    email: string,
    role: Exclude<Role, 'OWNER'>,
  ) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.tenant.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const membership = await this.prisma.tenant.membership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId } },
        update: { role },
        create: { userId: user.id, organizationId, role },
        select: { id: true, role: true, user: { select: { id: true, email: true, name: true } } },
      });

      await this.audit.record({
        organizationId,
        actorId,
        action: 'member.added',
        entityType: 'Membership',
        entityId: membership.id,
        metadata: { email: normalizedEmail, role },
      });

      // An existing user is added straight away, so they can get an in-app
      // notification (unknown emails only exist as a tokened invite until they
      // register, so there's no user to notify in that branch).
      const org = await this.prisma.tenant.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { name: true },
      });
      await this.notifications.enqueue({
        organizationId,
        recipientId: user.id,
        actorId,
        type: 'INVITED',
        payload: { orgName: org.name, role, title: org.name },
      });

      return { status: 'added' as const, membership };
    }

    // Unknown email -> create/refresh an invite and email a signed link.
    const token = randomBytes(32).toString('base64url');
    const invite = await this.prisma.tenant.invite.upsert({
      where: { organizationId_email: { organizationId, email: normalizedEmail } },
      update: {
        role,
        tokenHash: this.hashToken(token),
        invitedById: actorId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        acceptedAt: null,
      },
      create: {
        organizationId,
        email: normalizedEmail,
        role,
        tokenHash: this.hashToken(token),
        invitedById: actorId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    const org = await this.prisma.tenant.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true },
    });
    const link = `${this.config.get('WEB_ORIGIN', { infer: true })}/invites/accept?token=${token}`;
    await this.mail.send({
      to: normalizedEmail,
      subject: `You've been invited to ${org.name}`,
      text: `You've been invited to join ${org.name} on Kairo as ${role}.\n\nAccept your invite:\n${link}\n\nThis link expires in 7 days.`,
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'member.invited',
      entityType: 'Invite',
      entityId: invite.id,
      metadata: { email: normalizedEmail, role },
    });

    return { status: 'invited' as const, invite };
  }

  listInvites(organizationId: string) {
    return this.prisma.tenant.invite.findMany({
      where: { organizationId, acceptedAt: null },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept an invite. The authenticated user's email must match the invite, so
   * a leaked token can't be redeemed by a different account. Creates the
   * membership and burns the invite atomically.
   */
  async acceptInvite(userId: string, userEmail: string, token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash: this.hashToken(token) },
      select: {
        id: true,
        organizationId: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        invitedById: true,
      },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite is invalid or has expired');
    }
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('This invite was issued to a different email');
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const m = await tx.membership.upsert({
        where: { userId_organizationId: { userId, organizationId: invite.organizationId } },
        update: { role: invite.role },
        create: { userId, organizationId: invite.organizationId, role: invite.role },
        select: {
          id: true,
          role: true,
          organizationId: true,
          organization: { select: { slug: true, name: true } },
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return m;
    });

    await this.audit.record({
      organizationId: invite.organizationId,
      actorId: userId,
      action: 'invite.accepted',
      entityType: 'Membership',
      entityId: membership.id,
      metadata: { inviteId: invite.id },
    });

    // Close the loop for whoever sent the invite.
    if (invite.invitedById) {
      await this.notifications.enqueue({
        organizationId: invite.organizationId,
        recipientId: invite.invitedById,
        actorId: userId,
        type: 'INVITE_ACCEPTED',
        payload: {
          orgName: membership.organization.name,
          memberEmail: userEmail,
          title: membership.organization.name,
        },
      });
    }

    return membership;
  }

  async updateMemberRole(
    organizationId: string,
    actorId: string,
    targetUserId: string,
    role: Exclude<Role, 'OWNER'>,
  ) {
    const membership = await this.prisma.tenant.membership.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the role of an owner');
    }

    const updated = await this.prisma.tenant.membership.update({
      where: { id: membership.id },
      data: { role },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'member.role_updated',
      entityType: 'Membership',
      entityId: membership.id,
      metadata: { from: membership.role, to: role },
    });

    return updated;
  }

  async removeMember(organizationId: string, actorId: string, targetUserId: string) {
    const membership = await this.prisma.tenant.membership.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove an owner');
    }

    await this.prisma.tenant.membership.delete({ where: { id: membership.id } });
    await this.audit.record({
      organizationId,
      actorId,
      action: 'member.removed',
      entityType: 'Membership',
      entityId: membership.id,
      metadata: { userId: targetUserId },
    });
  }
}

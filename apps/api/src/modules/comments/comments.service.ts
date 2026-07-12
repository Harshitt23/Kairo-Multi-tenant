import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@kairo/db';
import type { CreateCommentInput } from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.CommentSelect;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /** Load an issue scoped to the tenant, or 404. */
  private async resolveIssue(organizationId: string, issueId: string) {
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: {
        id: true,
        projectId: true,
        number: true,
        title: true,
        reporterId: true,
        assigneeId: true,
      },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async list(organizationId: string, issueId: string) {
    await this.resolveIssue(organizationId, issueId);
    return this.prisma.tenant.comment.findMany({
      where: { issueId },
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    organizationId: string,
    actorId: string,
    issueId: string,
    input: CreateCommentInput,
  ) {
    const issue = await this.resolveIssue(organizationId, issueId);

    // Keep only @mentions that resolve to real members of this tenant, so a
    // stale/spoofed id can't create a mention row or fire a notification.
    const requested = [...new Set(input.mentionIds ?? [])];
    const mentioned = requested.length
      ? (
          await this.prisma.tenant.membership.findMany({
            where: { organizationId, userId: { in: requested } },
            select: { userId: true },
          })
        ).map((m) => m.userId)
      : [];

    const comment = await this.prisma.tenant.comment.create({
      data: {
        issueId,
        authorId: actorId,
        body: input.body,
        ...(mentioned.length
          ? { mentions: { create: mentioned.map((userId) => ({ userId })) } }
          : {}),
      },
      select: commentSelect,
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'comment.created',
      entityType: 'Comment',
      entityId: comment.id,
      metadata: { issueId, number: issue.number },
    });

    this.realtime.emitToProject(organizationId, issue.projectId, 'comment:created', {
      issueId,
      comment: { ...comment, createdAt: comment.createdAt.toISOString() },
    });

    // Mentioned users get the more specific MENTIONED notification…
    const mentionedSet = new Set(mentioned);
    for (const recipientId of mentionedSet) {
      await this.notifications.enqueue({
        organizationId,
        recipientId,
        actorId,
        type: 'MENTIONED',
        payload: { issueId, number: issue.number, title: issue.title },
      });
    }

    // …and the watchers (reporter + assignee) get COMMENT_CREATED, unless they
    // were already mentioned. The enqueue helper drops the actor themselves.
    const watchers = new Set(
      [issue.reporterId, issue.assigneeId].filter((id): id is string => Boolean(id)),
    );
    for (const recipientId of watchers) {
      if (mentionedSet.has(recipientId)) continue;
      await this.notifications.enqueue({
        organizationId,
        recipientId,
        actorId,
        type: 'COMMENT_CREATED',
        payload: { issueId, number: issue.number, title: issue.title },
      });
    }

    return comment;
  }
}

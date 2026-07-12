import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@kairo/db';
import {
  rankBetween,
  firstRank,
  type CreateIssueInput,
  type IssueFilter,
  type MoveIssueInput,
  type UpdateIssueInput,
} from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

const issueSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  rank: true,
  assigneeId: true,
  reporterId: true,
  dueDate: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IssueSelect;

// Board/list rows also carry their labels so cards can render category chips.
const issueListSelect = {
  ...issueSelect,
  labels: { select: { label: { select: { id: true, name: true, color: true } } } },
} satisfies Prisma.IssueSelect;

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /** Resolve a project by key inside the tenant, or 404. Returns id + org. */
  private async resolveProject(organizationId: string, projectKey: string) {
    const project = await this.prisma.tenant.project.findUnique({
      where: { organizationId_key: { organizationId, key: projectKey } },
      select: { id: true, organizationId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /** Board / list view. Always tenant-scoped; supports search + filters. */
  async list(organizationId: string, projectKey: string, filter: IssueFilter) {
    const project = await this.resolveProject(organizationId, projectKey);

    const where: Prisma.IssueWhereInput = {
      organizationId,
      projectId: project.id,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.assigneeId ? { assigneeId: filter.assigneeId } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q, mode: 'insensitive' } },
              { description: { contains: filter.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.tenant.issue.findMany({
      where,
      select: issueListSelect,
      // Board ordering: group by column, ascending rank within the column.
      orderBy: [{ status: 'asc' }, { rank: 'asc' }],
      take: filter.limit,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
  }

  async getByNumber(organizationId: string, projectKey: string, number: number) {
    const project = await this.resolveProject(organizationId, projectKey);
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { organizationId, projectId: project.id, number },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        },
        attachments: true,
      },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async create(
    organizationId: string,
    actorId: string,
    projectKey: string,
    input: CreateIssueInput,
  ) {
    const project = await this.resolveProject(organizationId, projectKey);

    // The whole request already runs in the RLS transaction opened by
    // TenantRlsInterceptor, so `prisma.tenant` is that transaction: the counter
    // bump and the insert are atomic without opening a nested transaction.
    const db = this.prisma.tenant;

    // Per-project monotonic issue number.
    const updated = await db.project.update({
      where: { id: project.id },
      data: { issueCounter: { increment: 1 } },
      select: { issueCounter: true },
    });

    // Append to the bottom of its status column.
    const last = await db.issue.findFirst({
      where: { projectId: project.id, status: input.status },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });
    const rank = last ? rankBetween(last.rank, null) : firstRank();

    const issue = await db.issue.create({
      data: {
        organizationId,
        projectId: project.id,
        number: updated.issueCounter,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        rank,
        reporterId: actorId,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        ...(input.labelIds?.length
          ? { labels: { create: input.labelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      select: issueSelect,
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.created',
      entityType: 'Issue',
      entityId: issue.id,
      metadata: { number: issue.number, title: issue.title },
    });

    this.realtime.emitToProject(organizationId, project.id, 'issue:created', {
      ...issue,
      updatedAt: issue.updatedAt.toISOString(),
    });

    if (issue.assigneeId) {
      await this.notifications.enqueue({
        organizationId,
        recipientId: issue.assigneeId,
        actorId,
        type: 'ISSUE_ASSIGNED',
        payload: { issueId: issue.id, number: issue.number, title: issue.title },
      });
    }

    return issue;
  }

  async update(
    organizationId: string,
    actorId: string,
    issueId: string,
    input: UpdateIssueInput,
  ) {
    const before = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: issueSelect,
    });
    if (!before) throw new NotFoundException('Issue not found');

    const data: Prisma.IssueUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.status !== undefined) data.status = input.status;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ?? null;
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId
        ? { connect: { id: input.assigneeId } }
        : { disconnect: true };
    }
    // Replace the full label set when labelIds is provided (empty clears them).
    if (input.labelIds !== undefined) {
      data.labels = {
        deleteMany: {},
        create: input.labelIds.map((labelId) => ({ labelId })),
      };
    }

    const issue = await this.prisma.tenant.issue.update({
      where: { id: issueId },
      data,
      select: issueSelect,
    });

    // Record a rich diff so the per-issue activity timeline can read like
    // "changed status Todo → Done" / "reassigned" rather than a bare field list.
    const changed: string[] = [];
    const meta: Record<string, unknown> = {};
    if (input.title !== undefined && input.title !== before.title) changed.push('title');
    if (
      input.description !== undefined &&
      (input.description ?? '') !== (before.description ?? '')
    ) {
      changed.push('description');
    }
    if (input.status !== undefined && input.status !== before.status) {
      changed.push('status');
      meta.status = { from: before.status, to: input.status };
    }
    if (input.priority !== undefined && input.priority !== before.priority) {
      changed.push('priority');
      meta.priority = { from: before.priority, to: input.priority };
    }
    if (input.assigneeId !== undefined && (input.assigneeId ?? null) !== before.assigneeId) {
      changed.push('assignee');
      meta.assignee = { from: before.assigneeId, to: input.assigneeId ?? null };
    }
    if (input.dueDate !== undefined) changed.push('dueDate');
    if (input.labelIds !== undefined) changed.push('labels');

    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.updated',
      entityType: 'Issue',
      entityId: issue.id,
      metadata: { changed, ...meta },
    });

    this.realtime.emitToProject(organizationId, issue.projectId, 'issue:updated', {
      ...issue,
      updatedAt: issue.updatedAt.toISOString(),
    });

    // Notify the new assignee on (re)assignment.
    if (input.assigneeId && input.assigneeId !== before.assigneeId) {
      await this.notifications.enqueue({
        organizationId,
        recipientId: input.assigneeId,
        actorId,
        type: 'ISSUE_ASSIGNED',
        payload: { issueId: issue.id, number: issue.number, title: issue.title },
      });
    }

    // Notify the people watching the issue (reporter + current assignee) when it
    // moves between columns — the status change is the event, not who did it, so
    // enqueue skips the actor themselves.
    if (input.status !== undefined && input.status !== before.status) {
      const watchers = new Set(
        [before.reporterId, issue.assigneeId].filter((id): id is string => Boolean(id)),
      );
      for (const recipientId of watchers) {
        await this.notifications.enqueue({
          organizationId,
          recipientId,
          actorId,
          type: 'ISSUE_STATUS_CHANGED',
          payload: {
            issueId: issue.id,
            number: issue.number,
            title: issue.title,
            from: before.status,
            to: issue.status,
          },
        });
      }
    }

    return issue;
  }

  /** Drag/drop: re-rank within / across status columns without renumbering. */
  async move(
    organizationId: string,
    actorId: string,
    issueId: string,
    input: MoveIssueInput,
  ) {
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: { id: true, projectId: true, status: true, rank: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    // Neighbour ranks must come from the SAME project + target column.
    const [above, below] = await Promise.all([
      input.aboveId
        ? this.prisma.tenant.issue.findFirst({
            where: { id: input.aboveId, projectId: issue.projectId, status: input.status },
            select: { rank: true },
          })
        : Promise.resolve(null),
      input.belowId
        ? this.prisma.tenant.issue.findFirst({
            where: { id: input.belowId, projectId: issue.projectId, status: input.status },
            select: { rank: true },
          })
        : Promise.resolve(null),
    ]);

    let rank: string;
    try {
      rank = rankBetween(above?.rank ?? null, below?.rank ?? null);
    } catch {
      throw new BadRequestException('Invalid drop position (neighbour ranks inconsistent)');
    }

    const updated = await this.prisma.tenant.issue.update({
      where: { id: issue.id },
      data: { status: input.status, rank },
      select: { id: true, status: true, rank: true, projectId: true },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.moved',
      entityType: 'Issue',
      entityId: issue.id,
      metadata: { from: issue.status, to: input.status },
    });

    this.realtime.emitToProject(organizationId, updated.projectId, 'issue:moved', {
      id: updated.id,
      status: updated.status,
      rank: updated.rank,
    });

    return updated;
  }

  async remove(organizationId: string, actorId: string, issueId: string) {
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: { id: true, projectId: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    await this.prisma.tenant.issue.delete({ where: { id: issue.id } });
    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.deleted',
      entityType: 'Issue',
      entityId: issue.id,
    });
    this.realtime.emitToProject(organizationId, issue.projectId, 'issue:deleted', {
      id: issue.id,
    });
  }
}

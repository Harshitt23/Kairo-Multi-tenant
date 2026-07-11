import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED_STATUSES = ['DONE', 'CANCELED'] as const;

// Shape of the metadata we write on issue audit rows (see issues.service).
interface AuditMeta {
  changed?: string[];
  from?: string;
  to?: string;
  status?: { from: string; to: string };
  priority?: { from: string; to: string };
  assignee?: { from: string | null; to: string | null };
  number?: number;
  title?: string;
}

function transitionsToDone(action: string, metadata: unknown): boolean {
  const m = (metadata as AuditMeta | null) ?? {};
  if (action === 'issue.moved') return m.to === 'DONE';
  if (action === 'issue.updated') return m.status?.to === 'DONE';
  return false;
}

export interface DashboardStats {
  openIssues: number;
  overdueIssues: number;
  closedThisWeek: number;
  closedPriorWeek: number;
  avgCycleTimeDays: number | null;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  label: string;
  issueNumber: number | null;
  issueTitle: string | null;
  projectKey: string | null;
  at: string;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface DashboardCalendarEvent {
  date: string; // YYYY-MM-DD
  issueId: string;
  issueNumber: number;
  title: string;
  projectKey: string;
  priority: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(organizationId: string): Promise<DashboardStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

    const [openIssues, overdueIssues, doneTransitions] = await Promise.all([
      this.prisma.tenant.issue.count({
        where: { organizationId, status: { notIn: [...CLOSED_STATUSES] } },
      }),
      this.prisma.tenant.issue.count({
        where: {
          organizationId,
          status: { notIn: [...CLOSED_STATUSES] },
          dueDate: { lt: now },
        },
      }),
      this.prisma.tenant.auditLog.findMany({
        where: {
          organizationId,
          entityType: 'Issue',
          action: { in: ['issue.updated', 'issue.moved'] },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { entityId: true, action: true, metadata: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const closes = doneTransitions.filter((a) => transitionsToDone(a.action, a.metadata));
    const closedThisWeek = closes.filter((a) => a.createdAt >= weekAgo).length;
    const closedPriorWeek = closes.filter(
      (a) => a.createdAt >= twoWeeksAgo && a.createdAt < weekAgo,
    ).length;

    // Cycle time: for each close event, time since the issue was created.
    let avgCycleTimeDays: number | null = null;
    if (closes.length > 0) {
      const issueIds = [...new Set(closes.map((c) => c.entityId))];
      const issues = await this.prisma.tenant.issue.findMany({
        where: { id: { in: issueIds } },
        select: { id: true, createdAt: true },
      });
      const createdById = new Map(issues.map((i) => [i.id, i.createdAt]));
      const spans = closes
        .map((c) => {
          const createdAt = createdById.get(c.entityId);
          return createdAt ? (c.createdAt.getTime() - createdAt.getTime()) / DAY_MS : null;
        })
        .filter((n): n is number => n !== null);
      if (spans.length > 0) {
        avgCycleTimeDays = spans.reduce((a, b) => a + b, 0) / spans.length;
      }
    }

    return { openIssues, overdueIssues, closedThisWeek, closedPriorWeek, avgCycleTimeDays };
  }

  async getActivity(organizationId: string, limit = 20): Promise<DashboardActivityItem[]> {
    const audits = await this.prisma.tenant.auditLog.findMany({
      where: { organizationId, entityType: 'Issue' },
      select: {
        id: true,
        action: true,
        metadata: true,
        entityId: true,
        createdAt: true,
        actor: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const issueIds = [...new Set(audits.map((a) => a.entityId))];
    const issues = issueIds.length
      ? await this.prisma.tenant.issue.findMany({
          where: { id: { in: issueIds } },
          select: { id: true, number: true, title: true, project: { select: { key: true } } },
        })
      : [];
    const issueById = new Map(issues.map((i) => [i.id, i]));

    return audits.map((a) => {
      const m = (a.metadata as unknown as AuditMeta | null) ?? {};
      const issue = issueById.get(a.entityId);
      const label = labelFor(a.action, m);
      return {
        id: a.id,
        action: a.action,
        label,
        issueNumber: issue?.number ?? m.number ?? null,
        issueTitle: issue?.title ?? m.title ?? null,
        projectKey: issue?.project.key ?? null,
        at: a.createdAt.toISOString(),
        actor: a.actor,
      };
    });
  }

  async getCalendarEvents(organizationId: string, month: string): Promise<DashboardCalendarEvent[]> {
    // month is "YYYY-MM"
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));

    const issues = await this.prisma.tenant.issue.findMany({
      where: {
        organizationId,
        dueDate: { gte: start, lt: end },
        status: { notIn: [...CLOSED_STATUSES] },
      },
      select: {
        id: true,
        number: true,
        title: true,
        priority: true,
        dueDate: true,
        project: { select: { key: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return issues
      .filter((i) => i.dueDate)
      .map((i) => ({
        date: i.dueDate!.toISOString().slice(0, 10),
        issueId: i.id,
        issueNumber: i.number,
        title: i.title,
        projectKey: i.project.key,
        priority: i.priority,
      }));
  }
}

function labelFor(action: string, m: AuditMeta): string {
  switch (action) {
    case 'issue.created':
      return 'created';
    case 'issue.deleted':
      return 'deleted';
    case 'issue.moved':
      return m.to === 'DONE' ? 'completed' : 'moved';
    case 'issue.updated':
      if (m.status) return m.status.to === 'DONE' ? 'completed' : 'moved';
      if (m.priority) return 'changed priority on';
      if (m.assignee) return 'reassigned';
      return 'updated';
    default:
      return 'updated';
  }
}

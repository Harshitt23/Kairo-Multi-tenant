import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

type Actor = { id: string; name: string; avatarUrl: string | null } | null;

type Base = { id: string; at: string; actor: Actor };

export type ActivityItem =
  | (Base & { type: 'created' })
  | (Base & { type: 'comment'; body: string })
  | (Base & { type: 'status'; from: string | null; to: string | null })
  | (Base & { type: 'priority'; from: string; to: string })
  | (Base & { type: 'assignee'; from: string | null; to: string | null })
  | (Base & { type: 'updated'; fields: string[] });

// Shape of the metadata we write on issue audit rows (see issues.service).
interface AuditMeta {
  changed?: string[];
  from?: string;
  to?: string;
  status?: { from: string; to: string };
  priority?: { from: string; to: string };
  assignee?: { from: string | null; to: string | null };
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Unified, chronological history for one issue: audit events + comments. */
  async list(organizationId: string, issueId: string): Promise<ActivityItem[]> {
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: { id: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const [audits, comments] = await Promise.all([
      this.prisma.tenant.auditLog.findMany({
        where: { organizationId, entityType: 'Issue', entityId: issueId },
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.tenant.comment.findMany({
        where: { issueId },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Resolve user ids referenced by assignee changes into display names.
    const userIds = new Set<string>();
    for (const a of audits) {
      const m = (a.metadata as unknown as AuditMeta | null) ?? {};
      if (m.assignee?.from) userIds.add(m.assignee.from);
      if (m.assignee?.to) userIds.add(m.assignee.to);
    }
    const users = userIds.size
      ? await this.prisma.tenant.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    const nameOf = (id: string | null | undefined) =>
      id ? nameById.get(id) ?? 'someone' : null;

    const items: ActivityItem[] = [];

    for (const a of audits) {
      const base = { at: a.createdAt.toISOString(), actor: a.actor ?? null };
      const m = (a.metadata as unknown as AuditMeta | null) ?? {};

      if (a.action === 'issue.created') {
        items.push({ id: a.id, type: 'created', ...base });
      } else if (a.action === 'issue.moved') {
        items.push({ id: a.id, type: 'status', from: m.from ?? null, to: m.to ?? null, ...base });
      } else if (a.action === 'issue.updated') {
        if (m.status) {
          items.push({ id: `${a.id}:status`, type: 'status', from: m.status.from, to: m.status.to, ...base });
        }
        if (m.priority) {
          items.push({ id: `${a.id}:priority`, type: 'priority', from: m.priority.from, to: m.priority.to, ...base });
        }
        if (m.assignee) {
          items.push({
            id: `${a.id}:assignee`,
            type: 'assignee',
            from: nameOf(m.assignee.from),
            to: nameOf(m.assignee.to),
            ...base,
          });
        }
        const others = (m.changed ?? []).filter(
          (f) => !['status', 'priority', 'assignee'].includes(f),
        );
        if (others.length) {
          items.push({ id: `${a.id}:fields`, type: 'updated', fields: others, ...base });
        }
      }
    }

    for (const c of comments) {
      items.push({
        id: c.id,
        type: 'comment',
        body: c.body,
        at: c.createdAt.toISOString(),
        actor: c.author,
      });
    }

    items.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
    return items;
  }
}

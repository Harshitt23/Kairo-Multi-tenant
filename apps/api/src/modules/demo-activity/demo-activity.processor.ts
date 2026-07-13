import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { IssueStatus, IssuePriority } from '@kairo/db';
import { rankBetween, firstRank } from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { DEMO_ACTIVITY_QUEUE } from './demo-activity.constants';

// Generic, industry-agnostic filler so it reads fine across every seeded org
// (agency, pharma, automotive, consulting, ...) without special-casing each.
const ISSUE_TITLES = [
  'Investigate performance regression',
  'Update API documentation',
  'Review pull request backlog',
  'Sync with client on requirements',
  'Fix flaky test in CI pipeline',
  'Prepare weekly status report',
  'Refactor legacy module',
  'Address customer support ticket',
  'Plan next sprint backlog',
  'Conduct code review session',
  'Update dependency versions',
  'Improve error handling',
  'Optimize slow database query',
  'Draft technical design doc',
  'Follow up with vendor',
  'Prepare demo for stakeholders',
  'Resolve production incident',
  'Update onboarding checklist',
  'Coordinate cross-team handoff',
  'Review security audit findings',
  'Triage backlog from last retro',
  'Write postmortem for last outage',
];

const COMMENT_BODIES = [
  'Looks good, approving.',
  'Can we get an update on this by EOD?',
  'Blocked on the vendor response, will follow up.',
  "Moved this up in priority per today's standup.",
  'Nice work, this closes out the sprint goal.',
  'Reassigning to unblock — let me know if you need context.',
  'Added notes from the client call above.',
  'This needs one more review pass before merging.',
  'Confirmed with the team, proceeding as planned.',
  'Pushed this to next week, dependency not ready yet.',
];

const NEXT_STATUS: Partial<Record<IssueStatus, IssueStatus>> = {
  [IssueStatus.BACKLOG]: IssueStatus.TODO,
  [IssueStatus.TODO]: IssueStatus.IN_PROGRESS,
  [IssueStatus.IN_PROGRESS]: IssueStatus.IN_REVIEW,
  [IssueStatus.IN_REVIEW]: IssueStatus.DONE,
};

const PRIORITIES = [IssuePriority.LOW, IssuePriority.MEDIUM, IssuePriority.HIGH, IssuePriority.URGENT];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Keeps the dashboard calendar populated as ticks create new issues, mirroring
// the spread seed.ts gives its own issues.
function randomDueDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1 + Math.floor(Math.random() * 14));
  return d;
}

/**
 * Keeps every seeded org looking "alive": each tick visits every org and, with
 * some probability, creates a new issue, advances an existing one to the next
 * status, and/or drops a comment.
 *
 * Writes go straight through Prisma (not IssuesService/CommentsService) and
 * call AuditService directly, so the per-issue activity timeline still reads
 * correctly. IssuesService/CommentsService route mutations through
 * `PrismaService.tenant`, which is meant to resolve to the plain client outside
 * an HTTP request — but a background worker has no request-scoped Nest
 * container, and going through that indirection from here produced client
 * objects missing model delegates. Writing directly to `this.prisma.<model>`
 * (as this processor's own org/project/member reads already do) sidesteps that
 * indirection entirely.
 */
@Processor(DEMO_ACTIVITY_QUEUE)
export class DemoActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(DemoActivityProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const orgs = await this.prisma.organization.findMany({ select: { id: true } });
    for (const org of orgs) {
      try {
        await this.tickOrg(org.id);
      } catch (err) {
        this.logger.warn(`Demo tick failed for org ${org.id}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`Demo activity tick complete for ${orgs.length} org(s)`);
  }

  private async tickOrg(organizationId: string): Promise<void> {
    const [projects, members] = await Promise.all([
      this.prisma.project.findMany({ where: { organizationId }, select: { id: true } }),
      this.prisma.membership.findMany({ where: { organizationId }, select: { userId: true } }),
    ]);
    if (!projects.length || !members.length) return;

    const project = pick(projects);
    const actorId = pick(members).userId;

    if (Math.random() < 0.5) {
      await this.createIssue(organizationId, actorId, project.id, members);
    } else {
      await this.advanceIssue(organizationId, actorId, project.id);
    }

    if (Math.random() < 0.3) {
      await this.addComment(organizationId, actorId, project.id);
    }
  }

  private async createIssue(
    organizationId: string,
    actorId: string,
    projectId: string,
    members: { userId: string }[],
  ): Promise<void> {
    const assigneeId = Math.random() < 0.7 ? pick(members).userId : null;

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { issueCounter: { increment: 1 } },
      select: { issueCounter: true },
    });

    const last = await this.prisma.issue.findFirst({
      where: { projectId, status: IssueStatus.BACKLOG },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });
    const rank = last ? rankBetween(last.rank, null) : firstRank();

    const issue = await this.prisma.issue.create({
      data: {
        organizationId,
        projectId,
        number: updated.issueCounter,
        title: pick(ISSUE_TITLES),
        status: IssueStatus.BACKLOG,
        priority: pick(PRIORITIES),
        rank,
        reporterId: actorId,
        assigneeId,
        dueDate: Math.random() < 0.6 ? randomDueDate() : null,
      },
      select: { id: true, number: true, title: true },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.created',
      entityType: 'Issue',
      entityId: issue.id,
      metadata: { number: issue.number, title: issue.title },
    });
  }

  private async advanceIssue(organizationId: string, actorId: string, projectId: string): Promise<void> {
    const candidates = await this.prisma.issue.findMany({
      where: { organizationId, projectId, status: { in: Object.keys(NEXT_STATUS) as IssueStatus[] } },
      select: { id: true, status: true },
      take: 25,
    });
    if (!candidates.length) return;
    const issue = pick(candidates);
    const next = NEXT_STATUS[issue.status];
    if (!next) return;

    await this.prisma.issue.update({
      where: { id: issue.id },
      data: { status: next },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'issue.updated',
      entityType: 'Issue',
      entityId: issue.id,
      metadata: { changed: ['status'], status: { from: issue.status, to: next } },
    });
  }

  private async addComment(organizationId: string, actorId: string, projectId: string): Promise<void> {
    const candidates = await this.prisma.issue.findMany({
      where: { organizationId, projectId },
      select: { id: true, number: true },
      take: 25,
    });
    if (!candidates.length) return;
    const issue = pick(candidates);

    const comment = await this.prisma.comment.create({
      data: { issueId: issue.id, authorId: actorId, body: pick(COMMENT_BODIES) },
      select: { id: true },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'comment.created',
      entityType: 'Comment',
      entityId: comment.id,
      metadata: { issueId: issue.id, number: issue.number },
    });
  }
}

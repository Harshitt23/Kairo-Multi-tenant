import { PrismaClient, IssueStatus, IssuePriority, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Minimal LexoRank-style midpoint generator for initial ordering. The API uses
// the shared @pm/types rank helper; the seed only needs spaced-out values.
function rankAt(i: number): string {
  // base-36 zero-padded keeps lexicographic order matching numeric order.
  return (i * 1000).toString(36).padStart(6, '0');
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const [owner, alice, bob] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'owner@acme.test' },
      update: {},
      create: { email: 'owner@acme.test', name: 'Olivia Owner', passwordHash },
    }),
    prisma.user.upsert({
      where: { email: 'alice@acme.test' },
      update: {},
      create: { email: 'alice@acme.test', name: 'Alice Admin', passwordHash },
    }),
    prisma.user.upsert({
      where: { email: 'bob@acme.test' },
      update: {},
      create: { email: 'bob@acme.test', name: 'Bob Member', passwordHash },
    }),
  ]);

  const org = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      slug: 'acme',
      name: 'Acme Inc.',
      subscription: { create: { plan: 'FREE', status: 'ACTIVE', seats: 5 } },
      memberships: {
        create: [
          { userId: owner.id, role: Role.OWNER },
          { userId: alice.id, role: Role.ADMIN },
          { userId: bob.id, role: Role.MEMBER },
        ],
      },
      teams: { create: [{ name: 'Engineering', key: 'ENG' }] },
    },
    include: { teams: true },
  });

  const project = await prisma.project.upsert({
    where: { organizationId_key: { organizationId: org.id, key: 'PM' } },
    update: {},
    create: {
      organizationId: org.id,
      teamId: org.teams[0]?.id,
      key: 'PM',
      name: 'Platform',
      description: 'The core product board.',
    },
  });

  const statuses: IssueStatus[] = [
    IssueStatus.BACKLOG,
    IssueStatus.TODO,
    IssueStatus.IN_PROGRESS,
    IssueStatus.IN_REVIEW,
    IssueStatus.DONE,
  ];

  // Reset counter so re-seeding is idempotent-ish for demo numbers.
  const seedIssues = [
    { title: 'Set up multi-tenant data model', status: IssueStatus.DONE, priority: IssuePriority.HIGH, assigneeId: alice.id },
    { title: 'Implement TenantGuard + RbacGuard', status: IssueStatus.IN_PROGRESS, priority: IssuePriority.URGENT, assigneeId: alice.id },
    { title: 'Kanban drag-and-drop with optimistic UI', status: IssueStatus.TODO, priority: IssuePriority.HIGH, assigneeId: bob.id },
    { title: 'WebSocket presence + live board sync', status: IssueStatus.TODO, priority: IssuePriority.MEDIUM, assigneeId: bob.id },
    { title: 'Stripe billing + webhook reconciliation', status: IssueStatus.BACKLOG, priority: IssuePriority.MEDIUM, assigneeId: null },
    { title: 'Notification fan-out via BullMQ', status: IssueStatus.BACKLOG, priority: IssuePriority.LOW, assigneeId: null },
    { title: 'Audit log for every mutation', status: IssueStatus.IN_REVIEW, priority: IssuePriority.MEDIUM, assigneeId: owner.id },
  ];

  const perStatusIndex: Record<string, number> = {};
  for (let i = 0; i < seedIssues.length; i++) {
    const s = seedIssues[i];
    const idx = (perStatusIndex[s.status] = (perStatusIndex[s.status] ?? 0) + 1);
    await prisma.issue.upsert({
      where: { projectId_number: { projectId: project.id, number: i + 1 } },
      update: {},
      create: {
        organizationId: org.id,
        projectId: project.id,
        number: i + 1,
        title: s.title,
        status: s.status,
        priority: s.priority,
        rank: rankAt(idx),
        reporterId: owner.id,
        assigneeId: s.assigneeId,
      },
    });
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { issueCounter: seedIssues.length },
  });

  // Touch unused enum import so lint stays clean if statuses array is trimmed.
  void statuses;

  console.log('Seed complete:');
  console.log('  org:      acme  (slug)');
  console.log('  login:    owner@acme.test / alice@acme.test / bob@acme.test');
  console.log('  password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

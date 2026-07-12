import { PrismaClient, IssueStatus, IssuePriority, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Minimal LexoRank-style midpoint generator for initial ordering. The API uses
// the shared @kairo/types rank helper; the seed only needs spaced-out values.
function rankAt(i: number): string {
  // base-36 zero-padded keeps lexicographic order matching numeric order.
  return (i * 1000).toString(36).padStart(6, '0');
}

// --- People -----------------------------------------------------------------
// Harshit is a member of every org, so logging in as him shows the full
// multi-tenant workspace switcher. Everyone shares the demo password.
const PEOPLE = {
  harshit: { email: 'harshit@rolls-royce.com', name: 'Harshit Sharma' },
  shagun: { email: 'shagun@rolls-royce.com', name: 'Shagun' },
  shaikh: { email: 'shaikh@adura.com', name: 'Shaikh Imran' },
  vivek: { email: 'vivek@sanofi.com', name: 'Vivek Kumar' },
  rupali: { email: 'rupali@cisco.com', name: 'Rupali Veddi' },
  sahil: { email: 'sahil@cisco.com', name: 'Sahil' },
} as const;

type PersonKey = keyof typeof PEOPLE;

type IssueSpec = {
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: PersonKey | null;
};

type OrgSpec = {
  slug: string;
  name: string;
  members: { user: PersonKey; role: Role }[];
  team: { name: string; key: string };
  project: { key: string; name: string; description: string; issues: IssueSpec[] };
};

const { BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE } = IssueStatus;
const { LOW, MEDIUM, HIGH, URGENT } = IssuePriority;

const ORGS: OrgSpec[] = [
  {
    slug: 'rolls-royce',
    name: 'Rolls-Royce',
    members: [
      { user: 'harshit', role: Role.OWNER },
      { user: 'shagun', role: Role.ADMIN },
      { user: 'shaikh', role: Role.MEMBER },
    ],
    team: { name: 'Propulsion', key: 'PROP' },
    project: {
      key: 'ENG',
      name: 'Engine Platform',
      description: 'Next-gen UltraFan programme delivery board.',
      issues: [
        { title: 'UltraFan blade fatigue analysis', status: IN_PROGRESS, priority: URGENT, assignee: 'shagun' },
        { title: 'Digital-twin telemetry ingestion', status: TODO, priority: HIGH, assignee: 'shaikh' },
        { title: 'EASA certification dossier submission', status: IN_REVIEW, priority: HIGH, assignee: 'harshit' },
        { title: 'Supplier quality audit — turbine castings', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Predictive maintenance model v2', status: TODO, priority: MEDIUM, assignee: 'shaikh' },
        { title: 'Reduce test-cell noise emissions', status: DONE, priority: MEDIUM, assignee: 'shagun' },
      ],
    },
  },
  {
    slug: 'adura',
    name: 'Adura',
    members: [
      { user: 'shaikh', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'rupali', role: Role.MEMBER },
      { user: 'sahil', role: Role.MEMBER },
    ],
    team: { name: 'Growth', key: 'GRW' },
    project: {
      key: 'SKN',
      name: 'Product Launch',
      description: 'Serum line launch — formulation to storefront.',
      issues: [
        { title: 'Finalize serum formulation batch 7', status: IN_PROGRESS, priority: HIGH, assignee: 'shaikh' },
        { title: 'Dermatologist trial sign-off', status: IN_REVIEW, priority: URGENT, assignee: 'harshit' },
        { title: 'Packaging supplier contract', status: TODO, priority: MEDIUM, assignee: 'rupali' },
        { title: 'Launch campaign creative review', status: TODO, priority: MEDIUM, assignee: 'shaikh' },
        { title: 'Shopify storefront QA pass', status: BACKLOG, priority: LOW, assignee: 'sahil' },
        { title: 'Influencer seeding list', status: DONE, priority: LOW, assignee: 'rupali' },
      ],
    },
  },
  {
    slug: 'sanofi',
    name: 'Sanofi',
    members: [
      { user: 'vivek', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'shagun', role: Role.MEMBER },
    ],
    team: { name: 'Clinical', key: 'CLN' },
    project: {
      key: 'CLIN',
      name: 'Clinical Program',
      description: 'Phase III program tracking and regulatory submissions.',
      issues: [
        { title: 'Phase III enrollment tracker', status: IN_PROGRESS, priority: URGENT, assignee: 'vivek' },
        { title: 'Adverse-event reporting pipeline', status: TODO, priority: HIGH, assignee: 'harshit' },
        { title: 'FDA regulatory dossier', status: IN_REVIEW, priority: HIGH, assignee: 'shagun' },
        { title: 'Site monitoring visit schedule', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Patient consent e-signature flow', status: TODO, priority: MEDIUM, assignee: 'shagun' },
        { title: 'Data lock for interim analysis', status: DONE, priority: HIGH, assignee: 'vivek' },
      ],
    },
  },
  {
    slug: 'cisco',
    name: 'Cisco',
    members: [
      { user: 'rupali', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'vivek', role: Role.MEMBER },
      { user: 'sahil', role: Role.MEMBER },
    ],
    team: { name: 'Platform', key: 'PLT' },
    project: {
      key: 'NET',
      name: 'Network OS',
      description: 'IOS-XE platform hardening and roadmap.',
      issues: [
        { title: 'IOS-XE CVE hotfix rollout', status: IN_PROGRESS, priority: URGENT, assignee: 'vivek' },
        { title: 'Zero-trust segmentation policy engine', status: TODO, priority: HIGH, assignee: 'harshit' },
        { title: 'Telemetry export to Grafana', status: IN_REVIEW, priority: MEDIUM, assignee: 'vivek' },
        { title: 'Deprecate legacy SNMP agents', status: BACKLOG, priority: LOW, assignee: 'sahil' },
        { title: 'Config rollback safety checks', status: TODO, priority: MEDIUM, assignee: 'rupali' },
        { title: '400G line-card driver', status: DONE, priority: HIGH, assignee: 'vivek' },
      ],
    },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Retire the old placeholder demo data ------------------------------
  // Deleting the org cascades to its projects/issues/comments/memberships.
  // The old @acme.test users are then orphaned; remove them too (best-effort,
  // in case another fixture still references them).
  await prisma.organization.deleteMany({ where: { slug: 'acme' } });
  await prisma.user
    .deleteMany({ where: { email: { endsWith: '@acme.test' } } })
    .catch(() => undefined);

  // --- Users --------------------------------------------------------------
  const users = {} as Record<PersonKey, { id: string }>;
  for (const key of Object.keys(PEOPLE) as PersonKey[]) {
    const p = PEOPLE[key];
    users[key] = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name },
      create: { email: p.email, name: p.name, passwordHash },
      select: { id: true },
    });
  }

  // --- Orgs, projects & issues -------------------------------------------
  for (const spec of ORGS) {
    const org = await prisma.organization.upsert({
      where: { slug: spec.slug },
      update: { name: spec.name },
      create: {
        slug: spec.slug,
        name: spec.name,
        subscription: { create: { plan: 'FREE', status: 'ACTIVE', seats: 5 } },
        teams: { create: [spec.team] },
      },
      include: { teams: true },
    });

    // Sync memberships explicitly so re-seeding onto an existing org still adds
    // newly-introduced people (upsert on the org body alone won't touch them).
    for (const m of spec.members) {
      await prisma.membership.upsert({
        where: { userId_organizationId: { userId: users[m.user].id, organizationId: org.id } },
        update: { role: m.role },
        create: { userId: users[m.user].id, organizationId: org.id, role: m.role },
      });
    }

    const ownerKey = spec.members.find((m) => m.role === Role.OWNER)!.user;

    const project = await prisma.project.upsert({
      where: { organizationId_key: { organizationId: org.id, key: spec.project.key } },
      update: { name: spec.project.name, description: spec.project.description },
      create: {
        organizationId: org.id,
        teamId: org.teams[0]?.id,
        key: spec.project.key,
        name: spec.project.name,
        description: spec.project.description,
      },
    });

    const perStatusIndex: Record<string, number> = {};
    for (let i = 0; i < spec.project.issues.length; i++) {
      const s = spec.project.issues[i];
      const idx = (perStatusIndex[s.status] = (perStatusIndex[s.status] ?? 0) + 1);
      await prisma.issue.upsert({
        where: { projectId_number: { projectId: project.id, number: i + 1 } },
        // Keep assignee authoritative from the seed (adds Sahil's issues on
        // re-seed) while leaving manual edits like due dates / labels intact.
        update: { assigneeId: s.assignee ? users[s.assignee].id : null },
        create: {
          organizationId: org.id,
          projectId: project.id,
          number: i + 1,
          title: s.title,
          status: s.status,
          priority: s.priority,
          rank: rankAt(idx),
          reporterId: users[ownerKey].id,
          assigneeId: s.assignee ? users[s.assignee].id : null,
        },
      });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { issueCounter: spec.project.issues.length },
    });
  }

  console.log('Seed complete:');
  console.log('  orgs:     rolls-royce · adura · sanofi · cisco');
  console.log('  login:    harshit@rolls-royce.com  (member of all four orgs)');
  console.log('  others:   shagun · shaikh · vivek · rupali · sahil  (@ their org domains)');
  console.log('  password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient, IssueStatus, IssuePriority, Role, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Minimal LexoRank-style midpoint generator for initial ordering. The API uses
// the shared @kairo/types rank helper; the seed only needs spaced-out values.
function rankAt(i: number): string {
  // base-36 zero-padded keeps lexicographic order matching numeric order.
  return (i * 1000).toString(36).padStart(6, '0');
}

// Gives the dashboard calendar something to show right after seeding, without
// a Sprint model: due dates relative to *today* (not fixed dates) so the demo
// looks current no matter when `prisma db seed` runs. DONE issues skip a due
// date — they're already excluded from the calendar query and a past-due
// stamp on a closed issue would just read as "overdue".
function dueDateFor(status: IssueStatus, i: number): Date | null {
  if (status === IssueStatus.DONE) return null;
  const baseOffsetDays: Partial<Record<IssueStatus, number>> = {
    [IssueStatus.IN_REVIEW]: 2,
    [IssueStatus.IN_PROGRESS]: 4,
    [IssueStatus.TODO]: 8,
    [IssueStatus.BACKLOG]: 15,
  };
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + (baseOffsetDays[status] ?? 7) + i);
  return d;
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
  harsh: { email: 'harsh@mdma.com', name: 'Harsh' },
  rahul: { email: 'rahul@shellema.com', name: 'Rahul' },
  shivam: { email: 'shivam@cc.co', name: 'Shivam' },
  deepika: { email: 'deepika@bms.com', name: 'Deepika' },
  akshita: { email: 'akshita@mi.com', name: 'Akshita' },
  arpit: { email: 'arpit@jlr.com', name: 'Arpit' },
  chikara: { email: 'chikara@novatris.com', name: 'Chikara' },
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
  {
    slug: 'mdma',
    name: 'MDMA',
    members: [
      { user: 'harsh', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'rahul', role: Role.MEMBER },
    ],
    team: { name: 'Creative', key: 'CRE' },
    project: {
      key: 'CAMP',
      name: 'Campaign Ops',
      description: 'Global ad campaign production pipeline.',
      issues: [
        { title: 'Q3 brand refresh storyboard', status: IN_PROGRESS, priority: HIGH, assignee: 'harsh' },
        { title: 'Client sign-off — holiday campaign', status: IN_REVIEW, priority: URGENT, assignee: 'rahul' },
        { title: 'Media buy reconciliation', status: TODO, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Influencer contract renewals', status: BACKLOG, priority: LOW, assignee: null },
        { title: 'Post-campaign performance report', status: TODO, priority: MEDIUM, assignee: 'rahul' },
        { title: 'Rebrand style guide v3', status: DONE, priority: MEDIUM, assignee: 'harsh' },
      ],
    },
  },
  {
    slug: 'shellema',
    name: 'ShellEma',
    members: [
      { user: 'rahul', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'shivam', role: Role.MEMBER },
    ],
    team: { name: 'Energy Ops', key: 'ENO' },
    project: {
      key: 'RET',
      name: 'Retail Fuel Platform',
      description: 'Forecourt systems and retail energy pricing.',
      issues: [
        { title: 'Dynamic fuel pricing engine', status: IN_PROGRESS, priority: URGENT, assignee: 'rahul' },
        { title: 'EV charging bay rollout — phase 2', status: TODO, priority: HIGH, assignee: 'shivam' },
        { title: 'POS terminal firmware update', status: IN_REVIEW, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Carbon offset reporting dashboard', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Loyalty card fraud detection', status: TODO, priority: HIGH, assignee: 'shivam' },
        { title: 'Site safety audit — Q2', status: DONE, priority: LOW, assignee: 'rahul' },
      ],
    },
  },
  {
    slug: 'cc',
    name: 'CC',
    members: [
      { user: 'shivam', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'deepika', role: Role.MEMBER },
    ],
    team: { name: 'Supply Chain', key: 'SUP' },
    project: {
      key: 'BOT',
      name: 'Bottling Ops',
      description: 'Bottling line efficiency and distribution tracking.',
      issues: [
        { title: 'Line 4 downtime root-cause analysis', status: IN_PROGRESS, priority: URGENT, assignee: 'shivam' },
        { title: 'Recyclable packaging pilot', status: TODO, priority: HIGH, assignee: 'deepika' },
        { title: 'Distributor onboarding portal', status: IN_REVIEW, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Cold-chain sensor rollout', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Regional demand forecasting model', status: TODO, priority: HIGH, assignee: 'shivam' },
        { title: 'Bottling plant safety certification', status: DONE, priority: MEDIUM, assignee: 'deepika' },
      ],
    },
  },
  {
    slug: 'bms',
    name: 'BMS',
    members: [
      { user: 'deepika', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'akshita', role: Role.MEMBER },
    ],
    team: { name: 'R&D', key: 'RND' },
    project: {
      key: 'ONC',
      name: 'Oncology Pipeline',
      description: 'Early-phase oncology drug trial tracking.',
      issues: [
        { title: 'Phase I dose escalation study', status: IN_PROGRESS, priority: URGENT, assignee: 'deepika' },
        { title: 'Biomarker assay validation', status: TODO, priority: HIGH, assignee: 'akshita' },
        { title: 'IRB protocol amendment', status: IN_REVIEW, priority: HIGH, assignee: 'harshit' },
        { title: 'Lab equipment calibration schedule', status: BACKLOG, priority: LOW, assignee: null },
        { title: 'Trial site recruitment tracker', status: TODO, priority: MEDIUM, assignee: 'akshita' },
        { title: 'Preclinical toxicology report', status: DONE, priority: MEDIUM, assignee: 'deepika' },
      ],
    },
  },
  {
    slug: 'mi',
    name: 'MI',
    members: [
      { user: 'akshita', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'arpit', role: Role.MEMBER },
    ],
    team: { name: 'Hardware', key: 'HW' },
    project: {
      key: 'PHN',
      name: 'Smartphone Line',
      description: 'Next flagship device — design to manufacturing.',
      issues: [
        { title: 'Camera module thermal testing', status: IN_PROGRESS, priority: URGENT, assignee: 'akshita' },
        { title: 'Battery fast-charge safety review', status: TODO, priority: HIGH, assignee: 'arpit' },
        { title: 'Supply chain component sourcing', status: IN_REVIEW, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Retail packaging redesign', status: BACKLOG, priority: LOW, assignee: null },
        { title: 'Firmware OTA rollout plan', status: TODO, priority: MEDIUM, assignee: 'arpit' },
        { title: 'FCC certification submission', status: DONE, priority: HIGH, assignee: 'akshita' },
      ],
    },
  },
  {
    slug: 'jlr',
    name: 'JLR',
    members: [
      { user: 'arpit', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'chikara', role: Role.MEMBER },
    ],
    team: { name: 'Vehicle Eng', key: 'VEH' },
    project: {
      key: 'EVP',
      name: 'EV Platform',
      description: 'Next-gen electric drivetrain platform.',
      issues: [
        { title: 'Battery pack thermal runaway testing', status: IN_PROGRESS, priority: URGENT, assignee: 'arpit' },
        { title: 'Infotainment OTA update pipeline', status: TODO, priority: HIGH, assignee: 'chikara' },
        { title: 'Crash test compliance report', status: IN_REVIEW, priority: HIGH, assignee: 'harshit' },
        { title: 'Supplier tooling qualification', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Range estimation algorithm tuning', status: TODO, priority: MEDIUM, assignee: 'chikara' },
        { title: 'Cold-weather range validation', status: DONE, priority: MEDIUM, assignee: 'arpit' },
      ],
    },
  },
  {
    slug: 'novatris',
    name: 'Novatris',
    members: [
      { user: 'chikara', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'harsh', role: Role.MEMBER },
    ],
    team: { name: 'Clinical', key: 'CLN' },
    project: {
      key: 'GTX',
      name: 'Gene Therapy Program',
      description: 'AAV-vector gene therapy trial pipeline.',
      issues: [
        { title: 'Vector manufacturing scale-up', status: IN_PROGRESS, priority: URGENT, assignee: 'chikara' },
        { title: 'Long-term follow-up protocol', status: TODO, priority: HIGH, assignee: 'harsh' },
        { title: 'Regulatory pre-submission meeting', status: IN_REVIEW, priority: HIGH, assignee: 'harshit' },
        { title: 'Patient registry data migration', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Immunogenicity assay development', status: TODO, priority: MEDIUM, assignee: 'harsh' },
        { title: 'Orphan drug designation filing', status: DONE, priority: HIGH, assignee: 'chikara' },
      ],
    },
  },
  {
    slug: 'clgfso',
    name: 'ClgFso',
    members: [
      { user: 'shivam', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'deepika', role: Role.MEMBER },
      { user: 'harsh', role: Role.MEMBER },
    ],
    team: { name: 'Academics', key: 'ACA' },
    project: {
      key: 'CUR',
      name: 'Curriculum Platform',
      description: 'Full-stack course content and student ops.',
      issues: [
        { title: 'New batch onboarding flow', status: IN_PROGRESS, priority: HIGH, assignee: 'shivam' },
        { title: 'Assignment auto-grading service', status: TODO, priority: MEDIUM, assignee: 'deepika' },
        { title: 'Placement drive tracker', status: IN_REVIEW, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Alumni mentorship portal', status: BACKLOG, priority: LOW, assignee: null },
        { title: 'Live class recording pipeline', status: TODO, priority: MEDIUM, assignee: 'harsh' },
        { title: 'Capstone project showcase page', status: DONE, priority: LOW, assignee: 'shivam' },
      ],
    },
  },
  {
    slug: 'ey',
    name: 'EY',
    members: [
      { user: 'akshita', role: Role.OWNER },
      { user: 'harshit', role: Role.ADMIN },
      { user: 'arpit', role: Role.MEMBER },
      { user: 'chikara', role: Role.MEMBER },
    ],
    team: { name: 'Advisory', key: 'ADV' },
    project: {
      key: 'AUD',
      name: 'Audit Modernization',
      description: 'AI-assisted audit workflow tooling.',
      issues: [
        { title: 'Automated anomaly detection in ledgers', status: IN_PROGRESS, priority: URGENT, assignee: 'akshita' },
        { title: 'Client data room security review', status: TODO, priority: HIGH, assignee: 'arpit' },
        { title: 'Engagement letter e-signature flow', status: IN_REVIEW, priority: MEDIUM, assignee: 'harshit' },
        { title: 'Cross-border tax compliance checklist', status: BACKLOG, priority: MEDIUM, assignee: null },
        { title: 'Audit sampling model v2', status: TODO, priority: MEDIUM, assignee: 'chikara' },
        { title: 'Partner sign-off dashboard', status: DONE, priority: MEDIUM, assignee: 'akshita' },
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
          dueDate: dueDateFor(s.status, i),
        },
      });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { issueCounter: spec.project.issues.length },
    });
  }

  // --- Fake inbox --------------------------------------------------------
  // Notifications normally arrive via the queue as a side effect of real
  // mutations, so a fresh checkout has an empty Inbox. Seed a realistic
  // spread directly (payload shapes matching what issues/comments/orgs
  // services enqueue) for harshit, the demo login, so the Inbox has
  // something to show — mixed types, orgs, and read state.
  const findIssue = (orgSlug: string, projectKey: string, number: number) =>
    prisma.issue.findFirstOrThrow({
      where: { number, project: { key: projectKey, organization: { slug: orgSlug } } },
      select: { id: true, number: true, title: true },
    });

  const [easaDossier, telemetry, noiseFix, serumTrial] = await Promise.all([
    findIssue('rolls-royce', 'ENG', 3), // EASA certification dossier submission
    findIssue('rolls-royce', 'ENG', 2), // Digital-twin telemetry ingestion
    findIssue('rolls-royce', 'ENG', 6), // Reduce test-cell noise emissions
    findIssue('adura', 'SKN', 2), // Dermatologist trial sign-off
  ]);

  const notifOrgs = Object.fromEntries(
    await Promise.all(
      (['rolls-royce', 'adura', 'cisco', 'mdma'] as const).map(async (slug) => [
        slug,
        await prisma.organization.findUniqueOrThrow({ where: { slug }, select: { id: true, name: true } }),
      ]),
    ),
  ) as Record<'rolls-royce' | 'adura' | 'cisco' | 'mdma', { id: string; name: string }>;

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
  const daysAgo = (d: number) => hoursAgo(d * 24);

  const notifSpecs: {
    id: string;
    orgSlug: keyof typeof notifOrgs;
    type: NotificationType;
    payload: Record<string, unknown>;
    createdAt: Date;
    read: boolean;
  }[] = [
    {
      id: 'seed-notif-easa-assigned',
      orgSlug: 'rolls-royce',
      type: NotificationType.ISSUE_ASSIGNED,
      payload: { issueId: easaDossier.id, number: easaDossier.number, title: easaDossier.title },
      createdAt: hoursAgo(2),
      read: false,
    },
    {
      id: 'seed-notif-easa-mentioned',
      orgSlug: 'rolls-royce',
      type: NotificationType.MENTIONED,
      payload: { issueId: easaDossier.id, number: easaDossier.number, title: easaDossier.title },
      createdAt: hoursAgo(0.5),
      read: false,
    },
    {
      id: 'seed-notif-noise-status',
      orgSlug: 'rolls-royce',
      type: NotificationType.ISSUE_STATUS_CHANGED,
      payload: {
        issueId: noiseFix.id,
        number: noiseFix.number,
        title: noiseFix.title,
        from: IssueStatus.IN_REVIEW,
        to: IssueStatus.DONE,
      },
      createdAt: hoursAgo(20),
      read: false,
    },
    {
      id: 'seed-notif-telemetry-comment',
      orgSlug: 'rolls-royce',
      type: NotificationType.COMMENT_CREATED,
      payload: { issueId: telemetry.id, number: telemetry.number, title: telemetry.title },
      createdAt: daysAgo(3),
      read: true,
    },
    {
      id: 'seed-notif-serum-assigned',
      orgSlug: 'adura',
      type: NotificationType.ISSUE_ASSIGNED,
      payload: { issueId: serumTrial.id, number: serumTrial.number, title: serumTrial.title },
      createdAt: daysAgo(2),
      read: true,
    },
    {
      id: 'seed-notif-cisco-invite-accepted',
      orgSlug: 'cisco',
      type: NotificationType.INVITE_ACCEPTED,
      payload: {
        orgName: notifOrgs.cisco.name,
        memberEmail: 'newhire@cisco.com',
        title: notifOrgs.cisco.name,
      },
      createdAt: hoursAgo(1),
      read: false,
    },
    {
      id: 'seed-notif-mdma-invited',
      orgSlug: 'mdma',
      type: NotificationType.INVITED,
      payload: { orgName: notifOrgs.mdma.name, role: Role.ADMIN, title: notifOrgs.mdma.name },
      createdAt: daysAgo(5),
      read: true,
    },
  ];

  for (const n of notifSpecs) {
    const readAt = n.read ? n.createdAt : null;
    await prisma.notification.upsert({
      where: { id: n.id },
      update: { payload: n.payload, createdAt: n.createdAt, readAt },
      create: {
        id: n.id,
        organizationId: notifOrgs[n.orgSlug].id,
        userId: users.harshit.id,
        type: n.type,
        payload: n.payload,
        createdAt: n.createdAt,
        readAt,
      },
    });
  }

  console.log('Seed complete:');
  console.log(
    '  orgs:     rolls-royce · adura · sanofi · cisco · mdma · shellema · cc · bms · mi · jlr · novatris · clgfso · ey',
  );
  console.log('  login:    harshit@rolls-royce.com  (member of all thirteen orgs)');
  console.log(
    '  others:   shagun · shaikh · vivek · rupali · sahil · harsh · rahul · shivam · deepika · akshita · arpit · chikara  (@ their org domains)',
  );
  console.log('  password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

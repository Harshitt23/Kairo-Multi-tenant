import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums (mirror the Prisma enums; kept here so the web app and DTO
// validation share one definition without importing the Prisma client).
// ---------------------------------------------------------------------------

export const issueStatusSchema = z.enum([
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELED',
]);
export type IssueStatusValue = z.infer<typeof issueStatusSchema>;

export const issuePrioritySchema = z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type IssuePriorityValue = z.infer<typeof issuePrioritySchema>;

export const roleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  // optionally create an org on signup
  orgName: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Org / membership
// ---------------------------------------------------------------------------

export const createOrgSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
});
export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: roleSchema.exclude(['OWNER']).default('MEMBER'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: roleSchema.exclude(['OWNER']),
});

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  key: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/, 'uppercase letters and numbers only'),
  description: z.string().max(2000).optional(),
  teamId: z.string().cuid().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ---------------------------------------------------------------------------
// Issue
// ---------------------------------------------------------------------------

export const createIssueSchema = z.object({
  title: z.string().min(1).max(280),
  description: z.string().max(20000).optional(),
  status: issueStatusSchema.default('BACKLOG'),
  priority: issuePrioritySchema.default('NONE'),
  assigneeId: z.string().cuid().nullish(),
  dueDate: z.coerce.date().nullish(),
  labelIds: z.array(z.string().cuid()).optional(),
});
export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = createIssueSchema.partial();
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

// Drag/drop move: place the issue in `status` between two neighbours.
// Columns render in ascending `rank` order (top -> bottom), so:
//   aboveId = card now directly ABOVE the dropped one (smaller rank)
//   belowId = card now directly BELOW the dropped one (larger rank)
// New rank = rankBetween(above.rank, below.rank). Null = column edge.
export const moveIssueSchema = z.object({
  status: issueStatusSchema,
  aboveId: z.string().cuid().nullish(),
  belowId: z.string().cuid().nullish(),
});
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;

export const issueFilterSchema = z.object({
  q: z.string().max(280).optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type IssueFilter = z.infer<typeof issueFilterSchema>;

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export const createCommentSchema = z.object({
  body: z.string().min(1).max(20000),
  mentionIds: z.array(z.string().cuid()).optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ---------------------------------------------------------------------------
// Attachments (S3 presigned upload)
// ---------------------------------------------------------------------------

// 25 MB cap — adjust per plan. Mirrored client-side for early feedback.
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

// Step 1: client asks the API for a presigned PUT URL to upload directly to S3.
export const presignAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});
export type PresignAttachmentInput = z.infer<typeof presignAttachmentSchema>;

// Step 2: after a successful upload the client confirms, creating the DB row.
export const confirmAttachmentSchema = z.object({
  fileKey: z.string().min(1).max(1024),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});
export type ConfirmAttachmentInput = z.infer<typeof confirmAttachmentSchema>;

// ---------------------------------------------------------------------------
// Invites (invite-by-email)
// ---------------------------------------------------------------------------

export const acceptInviteSchema = z.object({
  token: z.string().min(10).max(200),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export const notificationPrefsSchema = z.object({
  emailOnAssigned: z.boolean().optional(),
  emailOnMentioned: z.boolean().optional(),
  emailOnComment: z.boolean().optional(),
});
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;

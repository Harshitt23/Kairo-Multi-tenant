'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCommentInput,
  CreateIssueInput,
  CreateLabelInput,
  CreateOrgInput,
  CreateProjectInput,
  IssueStatusValue,
  MoveIssueInput,
  UpdateIssueInput,
} from '@pm/types';
import { api, uploadAttachment, type Attachment } from './api';

/** Shape returned by GET /auth/me. */
export interface Me {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  memberships: { role: string; organization: { id: string; slug: string; name: string } }[];
}

export const useMe = (enabled = true) =>
  useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/auth/me'), enabled });

export interface Org {
  id: string;
  slug: string;
  name: string;
  memberships: { role: string }[];
  _count: { projects: number; memberships: number };
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  _count: { issues: number };
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: IssueStatusValue;
  priority: string;
  rank: string;
  assigneeId: string | null;
  projectId: string;
  dueDate: string | null;
  updatedAt: string;
  labels?: { label: Label }[];
}

export interface Member {
  id: string; // membership id
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export const useOrgs = (enabled = true) =>
  useQuery({ queryKey: ['orgs'], queryFn: () => api.get<Org[]>('/orgs'), enabled });

/** Create an organization; caller navigates to the returned slug. */
export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrgInput) =>
      api.post<{ id: string; slug: string; name: string }>('/orgs', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Create a project inside an org; caller navigates to its board. */
export function useCreateProject(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api.post<Project>(`/orgs/${orgSlug}/projects`, input, orgSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', orgSlug] }),
  });
}

export const useMembers = (orgSlug: string) =>
  useQuery({
    queryKey: ['members', orgSlug],
    queryFn: () => api.get<Member[]>(`/orgs/${orgSlug}/members`, orgSlug),
    enabled: !!orgSlug,
  });

/** Invite a member by email. Returns {status:'added'|'invited'}. */
export function useInviteMember(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: string }) =>
      api.post<{ status: string }>(`/orgs/${orgSlug}/members`, input, orgSlug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', orgSlug] });
      qc.invalidateQueries({ queryKey: ['invites', orgSlug] });
    },
  });
}

/** Change a member's role (ADMIN/MEMBER/GUEST — owners are immutable). */
export function useUpdateMemberRole(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch<{ id: string; role: string }>(`/orgs/${orgSlug}/members/${userId}`, { role }, orgSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgSlug] }),
  });
}

export function useRemoveMember(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/orgs/${orgSlug}/members/${userId}`, orgSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgSlug] }),
  });
}

export interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

/** Pending (un-accepted) invites. Admin-only endpoint — gate with `enabled`. */
export const useInvites = (orgSlug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['invites', orgSlug],
    queryFn: () => api.get<Invite[]>(`/orgs/${orgSlug}/invites`, orgSlug),
    enabled: !!orgSlug && enabled,
  });

export interface NotificationPrefs {
  emailOnAssigned: boolean;
  emailOnMentioned: boolean;
  emailOnComment: boolean;
}

export const useNotificationPrefs = () =>
  useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.get<NotificationPrefs>('/notifications/prefs'),
  });

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NotificationPrefs>) =>
      api.patch<NotificationPrefs>('/notifications/prefs', input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['notification-prefs'] });
      const previous = qc.getQueryData<NotificationPrefs>(['notification-prefs']);
      if (previous) qc.setQueryData(['notification-prefs'], { ...previous, ...input });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(['notification-prefs'], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });
}

export const useProjects = (orgSlug: string) =>
  useQuery({
    queryKey: ['projects', orgSlug],
    queryFn: () => api.get<Project[]>(`/orgs/${orgSlug}/projects`, orgSlug),
    enabled: !!orgSlug,
  });

// --- labels -----------------------------------------------------------------

export const labelsKey = (orgSlug: string) => ['labels', orgSlug];

export const useLabels = (orgSlug: string) =>
  useQuery({
    queryKey: labelsKey(orgSlug),
    queryFn: () => api.get<Label[]>(`/orgs/${orgSlug}/labels`, orgSlug),
    enabled: !!orgSlug,
  });

export function useCreateLabel(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLabelInput) =>
      api.post<Label>(`/orgs/${orgSlug}/labels`, input, orgSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(orgSlug) }),
  });
}

export const issuesKey = (orgSlug: string, projectKey: string) => ['issues', orgSlug, projectKey];

export const useIssues = (orgSlug: string, projectKey: string) =>
  useQuery({
    queryKey: issuesKey(orgSlug, projectKey),
    queryFn: () =>
      api.get<Issue[]>(`/orgs/${orgSlug}/projects/${projectKey}/issues?limit=100`, orgSlug),
    enabled: !!orgSlug && !!projectKey,
  });

export function useCreateIssue(orgSlug: string, projectKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) =>
      api.post<Issue>(`/orgs/${orgSlug}/projects/${projectKey}/issues`, input, orgSlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: issuesKey(orgSlug, projectKey) }),
  });
}

/**
 * Optimistic drag/drop move. We patch the cache immediately, then roll back if
 * the server rejects the move — the hallmark of a responsive board UI.
 */
export function useMoveIssue(orgSlug: string, projectKey: string) {
  const qc = useQueryClient();
  const key = issuesKey(orgSlug, projectKey);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveIssueInput; optimisticRank: string }) =>
      api.patch<Issue>(`/orgs/${orgSlug}/projects/${projectKey}/issues/${id}/move`, input, orgSlug),

    onMutate: async ({ id, input, optimisticRank }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Issue[]>(key);
      qc.setQueryData<Issue[]>(key, (old) =>
        (old ?? []).map((i) =>
          i.id === id ? { ...i, status: input.status, rank: optimisticRank } : i,
        ),
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

/** Edit an issue's fields (title/description/status/priority/assignee). */
export function useUpdateIssue(orgSlug: string, projectKey: string) {
  const qc = useQueryClient();
  const key = issuesKey(orgSlug, projectKey);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIssueInput }) =>
      api.patch<Issue>(`/orgs/${orgSlug}/projects/${projectKey}/issues/${id}`, input, orgSlug),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Issue[]>(key);
      // `input` may carry dueDate (Date) / labelIds, which don't match the
      // Issue shape 1:1 — the merge is just an optimistic placeholder until the
      // onSettled refetch replaces it with the server row.
      qc.setQueryData<Issue[]>(key, (old) =>
        (old ?? []).map((i) => (i.id === id ? ({ ...i, ...input } as Issue) : i)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

/** Delete an issue, removing it from the board cache immediately. */
export function useDeleteIssue(orgSlug: string, projectKey: string) {
  const qc = useQueryClient();
  const key = issuesKey(orgSlug, projectKey);
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/orgs/${orgSlug}/projects/${projectKey}/issues/${id}`, orgSlug),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Issue[]>(key);
      qc.setQueryData<Issue[]>(key, (old) => (old ?? []).filter((i) => i.id !== id));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

// --- attachments ---------------------------------------------------------

export const attachmentsKey = (orgSlug: string, issueId: string) => [
  'attachments',
  orgSlug,
  issueId,
];

export const useAttachments = (orgSlug: string, issueId: string) =>
  useQuery({
    queryKey: attachmentsKey(orgSlug, issueId),
    queryFn: () =>
      api.get<Attachment[]>(`/orgs/${orgSlug}/issues/${issueId}/attachments`, orgSlug),
    enabled: !!orgSlug && !!issueId,
  });

export function useUploadAttachment(orgSlug: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(orgSlug, issueId, file),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: attachmentsKey(orgSlug, issueId) }),
  });
}

export function useDeleteAttachment(orgSlug: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/orgs/${orgSlug}/issues/${issueId}/attachments/${id}`, orgSlug),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: attachmentsKey(orgSlug, issueId) }),
  });
}

// --- comments --------------------------------------------------------------

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export const commentsKey = (orgSlug: string, issueId: string) => [
  'comments',
  orgSlug,
  issueId,
];

export const useComments = (orgSlug: string, issueId: string) =>
  useQuery({
    queryKey: commentsKey(orgSlug, issueId),
    queryFn: () =>
      api.get<Comment[]>(`/orgs/${orgSlug}/issues/${issueId}/comments`, orgSlug),
    enabled: !!orgSlug && !!issueId,
  });

export function useCreateComment(orgSlug: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      api.post<Comment>(`/orgs/${orgSlug}/issues/${issueId}/comments`, input, orgSlug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(orgSlug, issueId) });
      qc.invalidateQueries({ queryKey: activityKey(orgSlug, issueId) });
    },
  });
}

// --- activity timeline ------------------------------------------------------

export type ActivityItem = {
  id: string;
  at: string;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
} & (
  | { type: 'created' }
  | { type: 'comment'; body: string }
  | { type: 'status'; from: string | null; to: string | null }
  | { type: 'priority'; from: string; to: string }
  | { type: 'assignee'; from: string | null; to: string | null }
  | { type: 'updated'; fields: string[] }
);

export const activityKey = (orgSlug: string, issueId: string) => [
  'activity',
  orgSlug,
  issueId,
];

export const useActivity = (orgSlug: string, issueId: string) =>
  useQuery({
    queryKey: activityKey(orgSlug, issueId),
    queryFn: () =>
      api.get<ActivityItem[]>(`/orgs/${orgSlug}/issues/${issueId}/activity`, orgSlug),
    enabled: !!orgSlug && !!issueId,
  });

// --- global search ----------------------------------------------------------

export interface SearchIssue {
  id: string;
  number: number;
  title: string;
  status: IssueStatusValue;
  priority: string;
  projectKey: string;
}

export interface SearchProject {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

export interface SearchResults {
  issues: SearchIssue[];
  projects: SearchProject[];
}

/** Workspace-wide search. Fires only once `q` is at least 2 chars. */
export const useSearch = (orgSlug: string, q: string) =>
  useQuery({
    queryKey: ['search', orgSlug, q],
    queryFn: () =>
      api.get<SearchResults>(
        `/orgs/${orgSlug}/search?q=${encodeURIComponent(q)}`,
        orgSlug,
      ),
    enabled: !!orgSlug && q.trim().length >= 2,
  });

// --- my work ----------------------------------------------------------------

export interface MyWorkIssue {
  id: string;
  number: number;
  title: string;
  status: IssueStatusValue;
  priority: string;
  dueDate: string | null;
  updatedAt: string;
  projectKey: string;
  projectName: string;
  labels: { label: Label }[];
}

/** Everything assigned to the signed-in user across the workspace. */
export const useMyWork = (orgSlug: string) =>
  useQuery({
    queryKey: ['my-work', orgSlug],
    queryFn: () => api.get<MyWorkIssue[]>(`/orgs/${orgSlug}/my-work`, orgSlug),
    enabled: !!orgSlug,
  });

// --- invites ---------------------------------------------------------------

export interface AcceptInviteResult {
  id: string;
  role: string;
  organizationId: string;
  organization: { slug: string; name: string };
}

/** Redeem an invite token for the signed-in user; caller navigates to the org. */
export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post<AcceptInviteResult>('/invites/accept', { token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// --- notifications -----------------------------------------------------------

export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_STATUS_CHANGED'
  | 'COMMENT_CREATED'
  | 'MENTIONED'
  | 'INVITED'
  | 'INVITE_ACCEPTED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: { title?: string; number?: number } & Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

const notificationsKey = ['notifications'];

export const useNotifications = () =>
  useQuery({
    queryKey: notificationsKey,
    queryFn: () => api.get<AppNotification[]>('/notifications'),
    refetchInterval: 30_000,
  });

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.patch<{ count: number }>('/notifications/read', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<{ count: number }>('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });
}

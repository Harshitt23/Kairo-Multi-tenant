import type { IssueStatusValue, IssuePriorityValue } from './schemas';

// ============================================================================
// Realtime contract — the typed event surface for the Socket.io gateway and
// the web client. Clients join a room per project: `org:<id>:project:<id>`.
// ============================================================================

export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  cursor?: { issueId: string } | null;
}

export interface IssueSnapshot {
  id: string;
  number: number;
  title: string;
  status: IssueStatusValue;
  priority: IssuePriorityValue;
  rank: string;
  assigneeId: string | null;
  updatedAt: string;
}

// Server -> client
export interface ServerToClientEvents {
  'presence:sync': (users: PresenceUser[]) => void;
  'presence:join': (user: PresenceUser) => void;
  'presence:leave': (payload: { userId: string }) => void;
  'issue:created': (issue: IssueSnapshot) => void;
  'issue:updated': (issue: IssueSnapshot) => void;
  'issue:moved': (payload: { id: string; status: IssueStatusValue; rank: string }) => void;
  'issue:deleted': (payload: { id: string }) => void;
}

// Client -> server
export interface ClientToServerEvents {
  'project:join': (payload: { projectId: string }) => void;
  'project:leave': (payload: { projectId: string }) => void;
  'presence:cursor': (payload: { projectId: string; issueId: string | null }) => void;
}

export const projectRoom = (orgId: string, projectId: string) =>
  `org:${orgId}:project:${projectId}`;

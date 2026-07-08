'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { PresenceUser } from '@pm/types';
import { getSocket } from './socket';
import { useAuthStore } from './auth-store';
import { issuesKey, useProjects, type Issue } from './hooks';

/**
 * Subscribes the board to its project's realtime room: keeps the React Query
 * issue cache in sync with other users' mutations and tracks presence.
 */
export function useBoardRealtime(orgSlug: string, projectKey: string): PresenceUser[] {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const projects = useProjects(orgSlug);
  const projectId = projects.data?.find((p) => p.key === projectKey)?.id;
  const [presence, setPresence] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!token || !projectId) return;
    const socket = getSocket(token);
    const key = issuesKey(orgSlug, projectKey);

    socket.emit('project:join', { projectId });

    const patch = (fn: (list: Issue[]) => Issue[]) =>
      qc.setQueryData<Issue[]>(key, (old) => fn(old ?? []));

    socket.on('issue:created', (issue) => patch((l) => (l.some((i) => i.id === issue.id) ? l : [...l, issue as Issue])));
    socket.on('issue:updated', (issue) =>
      patch((l) => l.map((i) => (i.id === issue.id ? { ...i, ...(issue as Issue) } : i))),
    );
    socket.on('issue:moved', ({ id, status, rank }) =>
      patch((l) => l.map((i) => (i.id === id ? { ...i, status, rank } : i))),
    );
    socket.on('issue:deleted', ({ id }) => patch((l) => l.filter((i) => i.id !== id)));

    socket.on('presence:sync', setPresence);
    socket.on('presence:join', (u) =>
      setPresence((prev) => [...prev.filter((p) => p.userId !== u.userId), u]),
    );
    socket.on('presence:leave', ({ userId }) =>
      setPresence((prev) => prev.filter((p) => p.userId !== userId)),
    );

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('issue:created');
      socket.off('issue:updated');
      socket.off('issue:moved');
      socket.off('issue:deleted');
      socket.off('presence:sync');
      socket.off('presence:join');
      socket.off('presence:leave');
    };
  }, [token, projectId, orgSlug, projectKey, qc]);

  return presence;
}

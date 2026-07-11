'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useIssues, useMembers, useProjects, type Issue } from '../../lib/hooks';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Avatar } from '../brand';
import { PRIORITY_DOT } from '../issue-modal';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

const COLUMNS: { status: string; label: string; dot: string }[] = [
  { status: 'TODO', label: 'To do', dot: 'bg-zinc-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-indigo-500' },
  { status: 'IN_REVIEW', label: 'In Review', dot: 'bg-amber-500' },
  { status: 'DONE', label: 'Done', dot: 'bg-emerald-500' },
];

export function BoardPreview({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const projects = useProjects(orgSlug);
  // Simplification: preview the org's first project (no "most recently active"
  // signal is tracked yet) rather than inventing one.
  const project = projects.data?.[0];
  const issues = useIssues(orgSlug, project?.key ?? '');
  const members = useMembers(orgSlug);

  const memberByUserId = useMemo(
    () => new Map((members.data ?? []).map((m) => [m.user.id, m])),
    [members.data],
  );

  const byStatus = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const c of COLUMNS) map.set(c.status, []);
    for (const issue of issues.data ?? []) {
      map.get(issue.status)?.push(issue);
    }
    return map;
  }, [issues.data]);

  if (projects.isLoading) {
    return (
      <DashboardCard theme={theme}>
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (!project) {
    return (
      <DashboardCard theme={theme}>
        <div className="text-[14.5px] font-semibold text-zinc-900">Board preview</div>
        <p className="mt-3 text-sm text-zinc-500">
          Create a project to see its board here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard theme={theme}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[14.5px] font-semibold text-zinc-900">Board preview</span>
        <Link
          href={`/${orgSlug}/${project.key}/board`}
          className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700"
        >
          {project.name} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {COLUMNS.map((col) => {
          const colIssues = byStatus.get(col.status) ?? [];
          return (
            <div key={col.status} className="min-w-0">
              <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-zinc-600">
                  {col.label}
                </span>
                <span className="text-[11px] text-zinc-400">{colIssues.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {colIssues.slice(0, 3).map((issue) => {
                  const assignee = issue.assigneeId ? memberByUserId.get(issue.assigneeId) : undefined;
                  return (
                    <Link
                      key={issue.id}
                      href={`/${orgSlug}/${project.key}/board?issue=${issue.number}`}
                      className="block rounded-lg border border-edge bg-elevated/40 p-2.5 transition-colors hover:bg-elevated"
                    >
                      <div className="line-clamp-2 text-[12.5px] font-medium text-zinc-800">
                        {issue.title}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            (PRIORITY_DOT as Record<string, string>)[issue.priority] ?? 'bg-zinc-300'
                          }`}
                        />
                        {assignee && (
                          <Avatar name={assignee.user.name} seed={assignee.user.id} size={18} />
                        )}
                      </div>
                    </Link>
                  );
                })}
                {colIssues.length === 0 && (
                  <div className="rounded-lg border border-dashed border-edge px-2 py-4 text-center text-[11px] text-zinc-400">
                    Nothing here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

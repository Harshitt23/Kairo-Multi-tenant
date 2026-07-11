'use client';

import Link from 'next/link';
import { useMyWork } from '../../lib/hooks';
import { dueBadge } from '../../lib/due';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { PRIORITY_DOT } from '../issue-modal';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

export function TasksPanel({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const { data, isLoading } = useMyWork(orgSlug);
  const open = (data ?? []).filter((i) => i.status !== 'DONE' && i.status !== 'CANCELED');

  return (
    <DashboardCard theme={theme}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[14.5px] font-semibold text-zinc-900">Your tasks</span>
        <span className="text-[11.5px] text-zinc-400">{open.length} open</span>
      </div>
      {isLoading && (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      )}
      {!isLoading && open.length === 0 && (
        <p className="py-6 text-center text-sm text-zinc-500">Nothing assigned to you — nice.</p>
      )}
      {!isLoading && open.length > 0 && (
        <div className="flex flex-col">
          {open.slice(0, 6).map((issue) => {
            const badge = dueBadge(issue);
            return (
              <Link
                key={issue.id}
                href={`/${orgSlug}/${issue.projectKey}/board?issue=${issue.number}`}
                className="flex items-center gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-elevated/40"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    (PRIORITY_DOT as Record<string, string>)[issue.priority] ?? 'bg-zinc-300'
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-zinc-700">{issue.title}</span>
                {badge && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${badge.cls}`}>
                    {badge.text}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

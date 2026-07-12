'use client';

import { useMemo, useState } from 'react';
import { useDashboardActivity, type DashboardActivityItem } from '../../lib/hooks';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Avatar } from '../brand';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

const COLLAPSED_COUNT = 6;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dayGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Badge glyph + color derived from the audit label the API already computes
// (see dashboard.service.ts#labelFor) — not a separate guess at intent.
const ACTION_BADGE: Record<string, { path: string; bg: string; color: string }> = {
  created: { path: 'M12 5v14M5 12h14', bg: 'bg-violet-100', color: 'text-violet-600' },
  completed: { path: 'M5 13l4 4L19 7', bg: 'bg-emerald-100', color: 'text-emerald-600' },
  deleted: {
    path: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    bg: 'bg-red-100',
    color: 'text-red-600',
  },
  moved: { path: 'M7 8l5-5 5 5M7 16l5 5 5-5M12 3v18', bg: 'bg-indigo-100', color: 'text-indigo-600' },
  reassigned: {
    path: 'M9 8a3 3 0 100-6 3 3 0 000 6zM3 21c0-3.9 2.7-7 6-7s6 3.1 6 7',
    bg: 'bg-sky-100',
    color: 'text-sky-600',
  },
  'changed priority on': {
    path: 'M5 3v18M5 4h11l-2.5 4L16 12H5',
    bg: 'bg-amber-100',
    color: 'text-amber-600',
  },
  updated: { path: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z', bg: 'bg-zinc-100', color: 'text-zinc-500' },
};

function badgeFor(item: DashboardActivityItem) {
  return ACTION_BADGE[item.label] ?? ACTION_BADGE.updated;
}

export function ActivityFeed({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const { data, isLoading } = useDashboardActivity(orgSlug);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? data : data?.slice(0, COLLAPSED_COUNT);
  const hasMore = !!data && data.length > COLLAPSED_COUNT;

  const groups = useMemo(() => {
    if (!visible) return [];
    let lastGroup = '';
    return visible.map((item) => {
      const group = dayGroup(item.at);
      const showHeader = group !== lastGroup;
      lastGroup = group;
      return { item, group, showHeader };
    });
  }, [visible]);

  return (
    <DashboardCard theme={theme}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[14.5px] font-semibold text-zinc-900">Recent activity</span>
        {!isLoading && !!data?.length && (
          <span className="text-[11.5px] text-zinc-400">{data.length} events</span>
        )}
      </div>
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="mt-2 h-2.5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (!data || data.length === 0) && (
        <p className="py-6 text-center text-sm text-zinc-500">No activity yet.</p>
      )}
      {!isLoading && data && data.length > 0 && (
        <div className="flex flex-col">
          {groups.map(({ item, group, showHeader }, i) => {
            const badge = badgeFor(item);
            const isLast = i === groups.length - 1;
            return (
              <div key={item.id}>
                {showHeader && (
                  <div className="px-1 pb-1.5 pt-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-zinc-400 first:pt-0">
                    {group}
                  </div>
                )}
                <div className="flex gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-elevated/40">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="relative">
                      <Avatar name={item.actor?.name ?? '?'} seed={item.actor?.id} size={28} />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-panel ${badge.bg} ${badge.color}`}
                      >
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d={badge.path} />
                        </svg>
                      </span>
                    </span>
                    {!isLast && <span className="mt-1 w-px flex-1 bg-elevated" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <p className="text-[12.5px] leading-relaxed text-zinc-700">
                      <strong className="font-semibold text-zinc-900">
                        {item.actor?.name ?? 'Someone'}
                      </strong>{' '}
                      {item.label}{' '}
                      {item.issueTitle && (
                        <strong className="font-semibold text-zinc-900">
                          {item.projectKey ? `${item.projectKey}-${item.issueNumber}` : ''} {item.issueTitle}
                        </strong>
                      )}
                    </p>
                    <div className="mt-0.5 text-[11px] text-zinc-400">{timeAgo(item.at)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 self-center"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : `View more (${data.length - COLLAPSED_COUNT})`}
            </Button>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

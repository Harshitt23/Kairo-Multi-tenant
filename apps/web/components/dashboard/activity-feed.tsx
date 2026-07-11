'use client';

import { useDashboardActivity } from '../../lib/hooks';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Avatar } from '../brand';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

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

export function ActivityFeed({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const { data, isLoading } = useDashboardActivity(orgSlug);

  return (
    <DashboardCard theme={theme}>
      <div className="mb-4 text-[14.5px] font-semibold text-zinc-900">Recent activity</div>
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
          {data.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-elevated/40">
              <Avatar name={item.actor?.name ?? '?'} seed={item.actor?.id} size={28} />
              <div className="min-w-0 flex-1">
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
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

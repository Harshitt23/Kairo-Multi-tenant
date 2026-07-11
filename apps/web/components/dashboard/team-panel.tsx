'use client';

import { useMembers } from '../../lib/hooks';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Avatar } from '../brand';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

// Deterministic per-member placeholder status — presence isn't tracked
// org-wide yet (only per-board, in-memory). Swap for real data once a
// lastSeenAt/heartbeat exists; this keeps the UI honest-looking in the
// meantime rather than fully random on every render.
function mockStatus(seed: string): { label: string; dot: string; bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const away = h % 5 === 0;
  return away
    ? { label: 'Away', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' }
    : { label: 'Active', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
}

export function TeamPanel({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const { data, isLoading } = useMembers(orgSlug);
  const members = data ?? [];
  const activeCount = members.filter((m) => mockStatus(m.id).label === 'Active').length;

  return (
    <DashboardCard theme={theme}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[14.5px] font-semibold text-zinc-900">Team</span>
        {!isLoading && <span className="text-[11.5px] font-medium text-emerald-600">{activeCount} online</span>}
      </div>
      {isLoading && (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      )}
      {!isLoading && (
        <div className="flex flex-col gap-1">
          {members.map((m) => {
            const status = mockStatus(m.id);
            return (
              <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                <span className="relative shrink-0">
                  <Avatar name={m.user.name} seed={m.user.id} size={30} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${status.dot}`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-zinc-700">{m.user.name}</span>
                  <span className="block text-[11px] capitalize text-zinc-400">{m.role.toLowerCase()}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

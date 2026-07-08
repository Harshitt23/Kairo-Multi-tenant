'use client';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotifications,
  type AppNotification,
} from '../../../lib/hooks';
import { cn } from '../../../lib/cn';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Skeleton } from '../../../components/ui/skeleton';

/** "#12 · Fix login" from the job payload, tolerating missing fields. */
function issueRef(n: AppNotification) {
  const num = typeof n.payload.number === 'number' ? `#${n.payload.number}` : null;
  const title = typeof n.payload.title === 'string' ? n.payload.title : null;
  return [num, title].filter(Boolean).join(' · ');
}

/** Humanize a status enum ("IN_PROGRESS" -> "In progress"). */
function statusLabel(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null;
}

function describe(n: AppNotification): string {
  const ref = issueRef(n);
  switch (n.type) {
    case 'ISSUE_ASSIGNED':
      return ref ? `You were assigned ${ref}` : 'You were assigned an issue';
    case 'ISSUE_STATUS_CHANGED': {
      const from = statusLabel(n.payload.from);
      const to = statusLabel(n.payload.to);
      const transition = from && to ? ` (${from} → ${to})` : '';
      return ref ? `Status changed on ${ref}${transition}` : 'An issue status changed';
    }
    case 'COMMENT_CREATED':
      return ref ? `New comment on ${ref}` : 'New comment on an issue you follow';
    case 'MENTIONED':
      return ref ? `You were mentioned in ${ref}` : 'You were mentioned';
    case 'INVITED': {
      const org = str(n.payload.orgName);
      const role = str(n.payload.role);
      if (org) return `You were added to ${org}${role ? ` as ${role.toLowerCase()}` : ''}`;
      return 'You were invited to a workspace';
    }
    case 'INVITE_ACCEPTED': {
      const who = str(n.payload.memberEmail);
      const org = str(n.payload.orgName);
      if (who) return `${who} accepted your invite${org ? ` to ${org}` : ''}`;
      return 'Your invite was accepted';
    }
    default:
      return 'Notification';
  }
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_ICON: Record<string, string> = {
  ISSUE_ASSIGNED: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M20 8v6 M23 11h-6', // user-plus
  ISSUE_STATUS_CHANGED: 'M21 12a9 9 0 1 1-9-9 M21 3v6h-6', // rotate
  COMMENT_CREATED: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z', // chat
  MENTIONED: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8', // at-sign
  INVITED: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z', // inbox
  INVITE_ACCEPTED: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3', // check-circle
};

function TypeIcon({ type }: { type: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={TYPE_ICON[type] ?? TYPE_ICON.INVITED} />
    </svg>
  );
}

export default function InboxPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications.data ?? [];
  const unread = items.filter((n) => n.readAt === null);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {unread.length > 0 ? `${unread.length} unread` : 'You’re all caught up.'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {notifications.isError && (
        <ErrorState title="Couldn’t load notifications" onRetry={() => notifications.refetch()} />
      )}

      {notifications.isSuccess && items.length === 0 && (
        <EmptyState
          title="No notifications"
          description="When someone assigns you an issue or mentions you, it shows up here."
        />
      )}

      <ul className="space-y-1.5">
        {items.map((n) => {
          const isUnread = n.readAt === null;
          return (
            <li key={n.id}>
              <button
                onClick={() => isUnread && markRead.mutate([n.id])}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors',
                  isUnread
                    ? 'border-edge bg-panel hover:border-indigo-500/40'
                    : 'border-transparent bg-transparent opacity-60 hover:opacity-90',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    isUnread ? 'bg-brand/15 text-indigo-300' : 'bg-elevated text-zinc-500',
                  )}
                >
                  <TypeIcon type={n.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', isUnread ? 'font-medium text-zinc-100' : 'text-zinc-400')}>
                    {describe(n)}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600">{timeAgo(n.createdAt)}</span>
                </span>
                {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

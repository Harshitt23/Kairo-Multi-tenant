'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotifications,
  type AppNotification,
} from '../../../lib/hooks';
import { cn } from '../../../lib/cn';
import { staggerContainer, staggerItem } from '../../../lib/motion';
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

/** Same local calendar date as now? */
function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const TYPE_ICON: Record<string, string> = {
  ISSUE_ASSIGNED: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M20 8v6 M23 11h-6', // user-plus
  ISSUE_STATUS_CHANGED: 'M21 12a9 9 0 1 1-9-9 M21 3v6h-6', // rotate
  COMMENT_CREATED: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z', // chat
  MENTIONED: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8', // at-sign
  INVITED: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z', // inbox
  INVITE_ACCEPTED: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3', // check-circle
};

const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  ISSUE_ASSIGNED: { bg: 'bg-indigo-50', fg: 'text-indigo-700' },
  MENTIONED: { bg: 'bg-pink-50', fg: 'text-pink-700' },
  COMMENT_CREATED: { bg: 'bg-blue-50', fg: 'text-blue-700' },
  ISSUE_STATUS_CHANGED: { bg: 'bg-emerald-50', fg: 'text-emerald-700' },
  INVITED: { bg: 'bg-violet-50', fg: 'text-violet-700' },
  INVITE_ACCEPTED: { bg: 'bg-emerald-50', fg: 'text-emerald-700' },
};

function TypeIcon({ type }: { type: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={TYPE_ICON[type] ?? TYPE_ICON.INVITED} />
    </svg>
  );
}

type TabKey = 'all' | 'unread' | 'mentions';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'mentions', label: 'Mentions' },
];

const EMPTY_COPY: Record<TabKey, { title: string; description: string }> = {
  all: {
    title: "You're all caught up",
    description: 'When someone assigns you or mentions you, it shows up here.',
  },
  unread: {
    title: 'No unread notifications',
    description: "You've read everything in your inbox.",
  },
  mentions: {
    title: 'No mentions yet',
    description: "You'll see it here when someone @-mentions you.",
  },
};

export default function InboxPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [tab, setTab] = useState<TabKey>('all');

  const items = notifications.data ?? [];
  const unread = items.filter((n) => n.readAt === null);
  const mentions = items.filter((n) => n.type === 'MENTIONED');

  const filtered =
    tab === 'unread' ? unread : tab === 'mentions' ? mentions : items;

  const todayItems = filtered.filter((n) => isToday(n.createdAt));
  const earlierItems = filtered.filter((n) => !isToday(n.createdAt));
  const dayGroups = [
    { label: 'Today', items: todayItems },
    { label: 'Earlier', items: earlierItems },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
          <p data-testid="inbox-subtitle" className="mt-0.5 text-[13px] text-zinc-500">
            {unread.length > 0 ? `${unread.length} unread notification${unread.length === 1 ? '' : 's'}` : 'You’re all caught up.'}
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

      <div className="relative flex w-fit rounded-lg bg-elevated p-[3px] shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)]">
        {TABS.map((t) => {
          const count = t.key === 'unread' ? unread.length : t.key === 'mentions' ? mentions.length : 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative z-10 flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-[12.5px] transition-colors',
                active ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-500',
              )}
            >
              {active && (
                <motion.span
                  layoutId="inbox-tab-active"
                  className="absolute inset-0 -z-10 rounded-md bg-panel shadow-card"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              {t.label}
              {count > 0 && t.key !== 'all' && (
                <span
                  className={cn(
                    'inline-flex min-w-[15px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white',
                    active ? 'bg-brand' : 'bg-zinc-400',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {notifications.isLoading && (
        <div className="mt-5 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {notifications.isError && (
        <ErrorState className="mt-5" title="Couldn’t load notifications" onRetry={() => notifications.refetch()} />
      )}

      {notifications.isSuccess && filtered.length === 0 && (
        <EmptyState className="mt-5" title={EMPTY_COPY[tab].title} description={EMPTY_COPY[tab].description} />
      )}

      <div className="mt-5 flex flex-col gap-4">
        {dayGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </div>
            <motion.ul
              className="overflow-hidden rounded-xl border border-edge bg-panel shadow-card"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {group.items.map((n) => {
                const isUnread = n.readAt === null;
                const tone = TYPE_TONE[n.type] ?? TYPE_TONE.INVITED;
                return (
                  <motion.li key={n.id} variants={staggerItem} className="border-b border-edge last:border-b-0">
                    <button
                      onClick={() => isUnread && markRead.mutate([n.id])}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-indigo-50/40',
                        isUnread ? 'bg-indigo-50/20' : 'bg-transparent',
                      )}
                    >
                      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', tone.bg, tone.fg)}>
                        <TypeIcon type={n.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[13.5px] leading-snug', isUnread ? 'text-zinc-900' : 'text-zinc-600')}>
                          {describe(n)}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">{timeAgo(n.createdAt)}</span>
                      </span>
                      {isUnread && (
                        <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]" />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        ))}
      </div>
    </div>
  );
}

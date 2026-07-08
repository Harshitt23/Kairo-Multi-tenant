'use client';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotifications,
  type AppNotification,
} from '../lib/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

function describe(n: AppNotification): string {
  const { title, number } = n.payload;
  const ref = number !== undefined ? `#${number}` : null;
  switch (n.type) {
    case 'ISSUE_ASSIGNED':
      return `You were assigned to ${ref ?? 'an issue'}${title ? ` — ${title}` : ''}`;
    case 'ISSUE_STATUS_CHANGED':
      return `Status changed on ${ref ?? 'an issue'}${title ? ` — ${title}` : ''}`;
    case 'COMMENT_CREATED':
      return `New comment on ${ref ?? 'an issue'}${title ? ` — ${title}` : ''}`;
    case 'MENTIONED':
      return `You were mentioned on ${ref ?? 'an issue'}${title ? ` — ${title}` : ''}`;
    case 'INVITED':
      return 'You were invited to a workspace';
    default:
      return 'New notification';
  }
}

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

/** Bell menu showing in-app notifications, backed by GET/PATCH /notifications. */
export function NotificationsMenu() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-elevated hover:text-zinc-200"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <DropdownMenuLabel className="p-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <ul className="max-h-80 overflow-y-auto py-1.5">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => !n.readAt && markRead.mutate([n.id])}
                className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-elevated"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    n.readAt ? 'bg-transparent' : 'bg-indigo-500'
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className={n.readAt ? 'text-zinc-400' : 'text-zinc-100'}>
                    {describe(n)}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
          {notifications.length === 0 && (
            <li className="px-3.5 py-6 text-center text-xs text-zinc-600">
              You&apos;re all caught up.
            </li>
          )}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BellIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 13 6 11.5 6 8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 17.5a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

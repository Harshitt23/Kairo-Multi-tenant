'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { useMe } from '../lib/hooks';
import { Avatar, Logo } from './brand';
import { NotificationsMenu } from './notifications-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

/**
 * Sticky top bar shown on authenticated pages: brand mark (links home),
 * an optional breadcrumb trail, and the current user's menu.
 */
export function AppBar({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const me = useMe();

  async function signOut() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      /* ignore — clear locally regardless */
    }
    clear();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Logo size={28} />
          <span className="hidden text-sm font-semibold tracking-tight text-zinc-900 sm:inline">
            Kairo
          </span>
        </Link>
        {children && (
          <>
            <span className="text-zinc-700">/</span>
            <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">{children}</div>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <NotificationsMenu />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-80">
              <Avatar name={me.data?.name ?? '…'} seed={me.data?.id} size={30} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <span className="block truncate text-[13px] font-medium text-zinc-800">
                  {me.data?.name ?? 'Loading…'}
                </span>
                <span className="block truncate text-xs text-zinc-500">{me.data?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push('/')}>
                Your organizations
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={signOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useMe, useNotifications, useOrgs, useProjects } from '../lib/hooks';
import { useSignOut } from '../lib/use-sign-out';
import { cn } from '../lib/cn';
import { Avatar, Logo } from './brand';
import { CommandPalette, isMac, openCommandPalette } from './command-palette';
import { CreateOrgDialog } from './create-org-dialog';
import { CreateProjectDialog } from './create-project-dialog';
import { AssistantDrawer } from './dashboard/assistant-drawer';
import { NotificationsMenu } from './notifications-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// -- tiny inline icons (stroke inherits currentColor) ------------------------

const ic = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const IconGrid = () => (
  <svg {...ic}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
const IconHome = () => (
  <svg {...ic}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9h12v-9" /></svg>
);
const IconSettings = () => (
  <svg {...ic}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09c0 .68.4 1.3 1.03 1.56a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09c.26.63.88 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03Z" /></svg>
);
const IconPlus = () => (
  <svg {...ic}><path d="M12 5v14M5 12h14" /></svg>
);
const IconInbox = () => (
  <svg {...ic}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></svg>
);
const IconMyWork = () => (
  <svg {...ic}><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
);
const IconChevrons = () => (
  <svg {...ic} width={13} height={13}><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
);
const IconLogout = () => (
  <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
const IconMenu = () => (
  <svg {...ic} width={18} height={18}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const IconSearch = () => (
  <svg {...ic} width={14} height={14}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
const IconCollapse = () => (
  <svg {...ic} width={16} height={16}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>
);

// -- nav building blocks ------------------------------------------------------

function NavLink({
  href,
  active,
  icon,
  trailing,
  children,
  onNavigate,
  collapsed,
}: {
  href: string;
  active: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? String(children) : undefined}
      className={cn(
        'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
        collapsed && 'justify-center',
        active
          ? 'font-medium text-zinc-900'
          : 'text-zinc-600 hover:bg-elevated/60 hover:text-zinc-800',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-md bg-indigo-50"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      {icon && <span className={cn('relative shrink-0', active ? 'text-indigo-600' : 'text-zinc-500')}>
        {icon}
        {collapsed && trailing && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand" />
        )}
      </span>}
      {!collapsed && <span className="truncate">{children}</span>}
      {!collapsed && trailing && <span className="ml-auto shrink-0">{trailing}</span>}
    </Link>
  );
}

/** Sidebar body — shared between the desktop rail and the mobile drawer. */
function SidebarContent({
  orgSlug,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  orgSlug: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const orgs = useOrgs();
  const projects = useProjects(orgSlug);
  const me = useMe();
  const notifications = useNotifications();
  const unreadCount = notifications.data?.filter((n) => n.readAt === null).length ?? 0;
  const signOut = useSignOut();
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const currentOrg = orgs.data?.find((o) => o.slug === orgSlug);

  return (
    <div className="flex h-full flex-col">
      {/* org switcher */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            title={collapsed ? (currentOrg?.name ?? orgSlug) : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg bg-indigo-50/60 px-2 py-1.5 text-left transition-colors hover:bg-indigo-100/70',
              collapsed && 'justify-center px-0',
            )}
          >
            <Logo size={26} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-zinc-900">
                    {currentOrg?.name ?? orgSlug}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {currentOrg?.memberships[0]?.role.toLowerCase() ?? 'workspace'}
                  </span>
                </span>
                <span className="text-zinc-600"><IconChevrons /></span>
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
            {orgs.data?.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onSelect={() => {
                  onNavigate?.();
                  router.push(`/${o.slug}`);
                }}
              >
                <Avatar name={o.name} seed={o.id} size={20} />
                <span className="truncate">{o.name}</span>
                {o.slug === orgSlug && <span className="ml-auto text-indigo-600">✓</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreatingOrg(true)}>
              <IconPlus /> New organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* search / command palette trigger */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <button
            onClick={openCommandPalette}
            className="flex w-full items-center gap-2 rounded-md border border-edge bg-indigo-50/60 px-2.5 py-1.5 text-[13px] text-zinc-500 transition-all duration-150 hover:border-zinc-300 hover:bg-indigo-100/70 hover:text-zinc-700 active:scale-[0.99]"
          >
            <IconSearch />
            <span className="flex-1 text-left">Search…</span>
            <kbd
              suppressHydrationWarning
              className="rounded border border-edge bg-surface px-1.5 py-px text-[10px] text-zinc-500"
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
        </div>
      )}

      {/* main nav */}
      <nav className="space-y-0.5 px-3">
        <NavLink href={`/${orgSlug}`} active={pathname === `/${orgSlug}`} icon={<IconHome />} onNavigate={onNavigate} collapsed={collapsed}>
          Home
        </NavLink>
        <NavLink
          href={`/${orgSlug}/projects`}
          active={pathname === `/${orgSlug}/projects`}
          icon={<IconGrid />}
          onNavigate={onNavigate}
          collapsed={collapsed}
        >
          Projects
        </NavLink>
        <NavLink
          href={`/${orgSlug}/my-work`}
          active={pathname === `/${orgSlug}/my-work`}
          icon={<IconMyWork />}
          onNavigate={onNavigate}
          collapsed={collapsed}
        >
          My Work
        </NavLink>
        <NavLink
          href={`/${orgSlug}/inbox`}
          active={pathname === `/${orgSlug}/inbox`}
          icon={<IconInbox />}
          onNavigate={onNavigate}
          collapsed={collapsed}
          trailing={
            unreadCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : undefined
          }
        >
          Inbox
        </NavLink>
        <NavLink
          href={`/${orgSlug}/settings`}
          active={pathname === `/${orgSlug}/settings`}
          icon={<IconSettings />}
          onNavigate={onNavigate}
          collapsed={collapsed}
        >
          Settings
        </NavLink>
      </nav>

      {/* projects */}
      {!collapsed && (
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <div className="mb-1 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Your projects
            </span>
            <button
              onClick={() => setCreatingProject(true)}
              aria-label="New project"
              className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-elevated hover:text-zinc-800"
            >
              <IconPlus />
            </button>
          </div>
          <div className="space-y-0.5">
            {projects.data?.map((p) => (
              <NavLink
                key={p.id}
                href={`/${orgSlug}/${p.key}/board`}
                active={pathname.startsWith(`/${orgSlug}/${p.key}/`)}
                onNavigate={onNavigate}
                icon={
                  <span className="inline-flex h-4 min-w-7 items-center justify-center rounded bg-indigo-50 px-1 text-[10px] font-bold tracking-wide text-indigo-700">
                    {p.key}
                  </span>
                }
              >
                {p.name}
              </NavLink>
            ))}
            {projects.isLoading &&
              [0, 1].map((i) => <div key={i} className="mx-2.5 h-6 animate-pulse rounded bg-elevated" />)}
            {projects.data?.length === 0 && (
              <p className="px-2.5 py-1 text-xs text-zinc-600">No projects yet</p>
            )}
          </div>
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      {/* user footer */}
      <div className="border-t border-edge p-3">
        <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-1.5', collapsed && 'justify-center px-0')}>
          <Avatar name={me.data?.name ?? '…'} seed={me.data?.id} size={26} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-zinc-800">
                  {me.data?.name ?? 'Loading…'}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">{me.data?.email}</span>
              </span>
              <button
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-elevated hover:text-red-600"
              >
                <IconLogout />
              </button>
            </>
          )}
        </div>
      </div>

      {onToggleCollapse && !collapsed && (
        <div className="border-t border-edge px-3 py-2">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] text-zinc-500 transition-colors hover:bg-elevated/60 hover:text-zinc-800"
          >
            <IconCollapse />
            Collapse
          </button>
        </div>
      )}
      {onToggleCollapse && collapsed && (
        <div className="border-t border-edge p-2">
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex w-full items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-elevated/60 hover:text-zinc-800"
          >
            <span className="[transform:rotate(180deg)]"><IconCollapse /></span>
          </button>
        </div>
      )}

      <CreateOrgDialog open={creatingOrg} onOpenChange={setCreatingOrg} />
      <CreateProjectDialog orgSlug={orgSlug} open={creatingProject} onOpenChange={setCreatingProject} />
    </div>
  );
}

/**
 * App shell: fixed sidebar on desktop, slide-over drawer + slim topbar on
 * mobile. Wraps all org-scoped pages via app/[orgSlug]/layout.tsx.
 */
export function AppShell({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* desktop rail */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-edge bg-panel/50 transition-[width] duration-200 ease-out md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent orgSlug={orgSlug} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fade-in border-r border-edge bg-panel">
            <SidebarContent orgSlug={orgSlug} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile topbar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-edge px-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-zinc-600 hover:bg-elevated hover:text-zinc-800"
          >
            <IconMenu />
          </button>
          <Logo size={24} />
          <span className="text-sm font-semibold text-zinc-900">PM SaaS</span>
        </div>

        {/* desktop utility bar — search / assistant / notifications, available
            on every org page (not just Home) */}
        <div className="hidden h-14 shrink-0 items-center gap-3 border-b border-edge bg-surface/80 px-5 backdrop-blur md:flex">
          <button
            onClick={openCommandPalette}
            className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-edge bg-indigo-50/60 px-3 py-1.5 text-[13px] text-zinc-500 transition-all duration-150 hover:border-zinc-300 hover:bg-indigo-100/70 hover:text-zinc-700"
          >
            <IconSearch />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd
              suppressHydrationWarning
              className="rounded border border-edge bg-elevated px-1.5 py-px text-[10px] text-zinc-500"
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:border-indigo-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            </svg>
            Assistant
          </button>
          <NotificationsMenu />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette orgSlug={orgSlug} />
      <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

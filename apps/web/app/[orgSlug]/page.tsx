'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useMembers, useProjects } from '../../lib/hooks';
import { openCommandPalette } from '../../components/command-palette';
import { CreateProjectDialog } from '../../components/create-project-dialog';
import { NewIssueModal } from '../../components/issue-modal';
import { NotificationsMenu } from '../../components/notifications-menu';
import { ActivityFeed } from '../../components/dashboard/activity-feed';
import { AssistantDrawer } from '../../components/dashboard/assistant-drawer';
import { BoardPreview } from '../../components/dashboard/board-preview';
import { CalendarWidget } from '../../components/dashboard/calendar-widget';
import { DashboardStatCards } from '../../components/dashboard/stat-cards';
import { TasksPanel } from '../../components/dashboard/tasks-panel';
import { TeamPanel } from '../../components/dashboard/team-panel';
import { DEFAULT_DASHBOARD_THEME, resolveDashboardTheme } from '../../lib/dashboard-theme';

const theme = resolveDashboardTheme(DEFAULT_DASHBOARD_THEME);

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const router = useRouter();
  const me = useMe();
  const projects = useProjects(orgSlug);
  const members = useMembers(orgSlug);

  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const firstProject = projects.data?.[0];
  const firstName = me.data?.name?.split(' ')[0] ?? '';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="animate-fade-in px-6 py-6" style={{ backgroundColor: theme.surfaceTint }}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        {/* header row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-zinc-500">
              {today} · Here’s what’s happening.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2 text-[12.5px] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              Search
            </button>
            <button
              onClick={() => setAssistantOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-3 py-2 text-[12.5px] font-medium text-zinc-700 transition-colors hover:border-indigo-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
              </svg>
              Assistant
            </button>
            <NotificationsMenu />
          </div>
        </div>

        {/* quick actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCreatingIssue(true)}
            disabled={!firstProject}
            className="flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-3.5 py-2 text-[12.5px] font-medium text-zinc-700 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-indigo-600">+</span> New issue
          </button>
          <button
            onClick={() => setCreatingProject(true)}
            className="flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-3.5 py-2 text-[12.5px] font-medium text-zinc-700 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className="text-indigo-600">+</span> New project
          </button>
          <button
            onClick={() => router.push(`/${orgSlug}/settings`)}
            className="flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-3.5 py-2 text-[12.5px] font-medium text-zinc-700 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className="text-indigo-600">+</span> Invite
          </button>
        </div>

        <DashboardStatCards orgSlug={orgSlug} theme={theme} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            <BoardPreview orgSlug={orgSlug} theme={theme} />
            <ActivityFeed orgSlug={orgSlug} theme={theme} />
          </div>
          <div className="flex flex-col gap-6">
            <TasksPanel orgSlug={orgSlug} theme={theme} />
            <TeamPanel orgSlug={orgSlug} theme={theme} />
            <CalendarWidget orgSlug={orgSlug} theme={theme} />
          </div>
        </div>
      </div>

      <CreateProjectDialog orgSlug={orgSlug} open={creatingProject} onOpenChange={setCreatingProject} />
      {creatingIssue && firstProject && (
        <NewIssueModal
          orgSlug={orgSlug}
          projectKey={firstProject.key}
          members={members.data ?? []}
          onClose={() => setCreatingIssue(false)}
        />
      )}
      <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

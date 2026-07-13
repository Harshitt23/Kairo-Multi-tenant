'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { staggerContainer, staggerItem } from '../../../lib/motion';
import { useProjects } from '../../../lib/hooks';
import { CreateProjectDialog } from '../../../components/create-project-dialog';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Skeleton } from '../../../components/ui/skeleton';

function OverviewTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-4 py-3 shadow-card">
      <div className="text-xl font-bold tracking-tight text-zinc-900">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function ProjectsPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const projects = useProjects(orgSlug);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

  const all = projects.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects.data ?? [];
    return (projects.data ?? []).filter(
      (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
    );
  }, [projects.data, query]);

  const totalIssues = all.reduce((sum, p) => sum + p._count.issues, 0);
  const firstKey = all[0]?.key ?? 'APP';

  return (
    <div className="animate-fade-in px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">Open a project to view its board.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          + New project
        </Button>
      </div>

      {projects.isSuccess && all.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-md">
          <OverviewTile label="Projects" value={all.length} />
          <OverviewTile label="Total issues" value={totalIssues} />
        </div>
      )}

      {projects.isSuccess && all.length > 0 && (
        <div className="mb-5 flex max-w-xs items-center gap-2 rounded-md border border-edge bg-panel px-3 py-2 shadow-card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>
      )}

      <motion.ul
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {filtered.map((p) => (
          <motion.li key={p.id} variants={staggerItem}>
            <Link
              href={`/${orgSlug}/${p.key}/board`}
              className="group block h-full rounded-xl border border-edge bg-panel p-4 shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-hover"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-700">
                  {p.key}
                </span>
                <span className="truncate text-[15px] font-semibold text-zinc-900">{p.name}</span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-zinc-500">
                {p.description ?? 'No description'}
              </p>
              <p className="mt-3 text-xs text-zinc-500">{p._count.issues} issues</p>
            </Link>
          </motion.li>
        ))}
        {projects.isLoading &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        {projects.isError && (
          <li className="sm:col-span-2 lg:col-span-3">
            <ErrorState title="Couldn’t load projects" onRetry={() => projects.refetch()} />
          </li>
        )}
        {projects.isSuccess && all.length === 0 && (
          <li className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              title="No projects yet"
              description="Create a project to get a board and start tracking issues."
              action={<Button onClick={() => setCreating(true)}>Create project</Button>}
            />
          </li>
        )}
        {projects.isSuccess && all.length > 0 && filtered.length === 0 && (
          <li className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              title={`No projects match "${query}"`}
              description="Try a different search."
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          </li>
        )}
      </motion.ul>

      {projects.isSuccess && all.length > 0 && (
        <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-indigo-50 px-3.5 py-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <span className="text-[12.5px] text-indigo-700">
            Each project gets its own key (like {firstKey}) used to reference issues, e.g. {firstKey}-7.
          </span>
        </div>
      )}

      <CreateProjectDialog orgSlug={orgSlug} open={creating} onOpenChange={setCreating} />
    </div>
  );
}

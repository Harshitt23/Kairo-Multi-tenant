'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { useProjects } from '../../lib/hooks';
import { CreateProjectDialog } from '../../components/create-project-dialog';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { ErrorState } from '../../components/ui/error-state';
import { Skeleton } from '../../components/ui/skeleton';

export default function OrgPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const projects = useProjects(orgSlug);
  const [creating, setCreating] = useState(false);

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

      <motion.ul
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {projects.data?.map((p) => (
          <motion.li key={p.id} variants={staggerItem}>
            <Link
              href={`/${orgSlug}/${p.key}/board`}
              className="group block h-full rounded-lg border border-edge bg-panel p-4 shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-hover"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-700">
                  {p.key}
                </span>
                <span className="truncate text-[13px] font-medium text-zinc-900">{p.name}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] text-zinc-500">
                {p.description ?? 'No description'}
              </p>
              <p className="mt-3 text-xs text-zinc-600">{p._count.issues} issues</p>
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
        {projects.data?.length === 0 && (
          <li className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              title="No projects yet"
              description="Create a project to get a board and start tracking issues."
              action={<Button onClick={() => setCreating(true)}>Create project</Button>}
            />
          </li>
        )}
      </motion.ul>

      <CreateProjectDialog orgSlug={orgSlug} open={creating} onOpenChange={setCreating} />
    </div>
  );
}

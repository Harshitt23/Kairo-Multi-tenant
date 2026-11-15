'use client';

import { Suspense } from 'react';
import { Board } from '../../../../components/board';
import { ProjectTabs } from '../../../../components/project-tabs';

export default function BoardPage({
  params,
}: {
  params: { orgSlug: string; projectKey: string };
}) {
  const { orgSlug, projectKey } = params;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-edge px-4">
        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-accent">
          {projectKey}
        </span>
        <h1 className="sr-only">Board</h1>
        <ProjectTabs orgSlug={orgSlug} projectKey={projectKey} active="board" />
      </header>
      <div className="min-h-0 flex-1">
        {/* Suspense: Board reads the ?issue= deep-link via useSearchParams. */}
        <Suspense>
          <Board orgSlug={orgSlug} projectKey={projectKey} />
        </Suspense>
      </div>
    </div>
  );
}

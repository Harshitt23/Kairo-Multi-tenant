'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSearch } from '../../../lib/hooks';
import { staggerContainer, staggerItem } from '../../../lib/motion';
import { EmptyState } from '../../../components/ui/empty-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Skeleton } from '../../../components/ui/skeleton';

export default function SearchPage({ params }: { params: { orgSlug: string } }) {
  return (
    <Suspense>
      <SearchView orgSlug={params.orgSlug} />
    </Suspense>
  );
}

function SearchView({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get('q') ?? '';
  const [q, setQ] = useState(initial);

  // Keep the URL in sync (debounced) so results are shareable / refresh-safe.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      router.replace(`/${orgSlug}/search${next}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [q, orgSlug, router]);

  const search = useSearch(orgSlug, q);
  const results = search.data;
  const hasQuery = q.trim().length >= 2;
  const empty =
    hasQuery &&
    search.isSuccess &&
    results!.issues.length === 0 &&
    results!.projects.length === 0;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-6 py-6">
      <h1 className="text-lg font-semibold tracking-tight">Search</h1>
      <p className="mt-0.5 text-[13px] text-zinc-500">
        Find issues and projects across the workspace.
      </p>

      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search issues and projects…"
          className="w-full rounded-lg border border-edge bg-panel py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-card transition-colors focus:border-indigo-500"
        />
      </div>

      {!hasQuery && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Type at least 2 characters to search.
        </p>
      )}

      {hasQuery && search.isLoading && (
        <div className="mt-5 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {hasQuery && search.isError && (
        <div className="mt-5">
          <ErrorState title="Search failed" onRetry={() => search.refetch()} />
        </div>
      )}

      {empty && (
        <div className="mt-5">
          <EmptyState
            title="No matches"
            description={`Nothing matched “${q.trim()}”. Try a different term.`}
          />
        </div>
      )}

      {hasQuery && results && results.projects.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Projects
          </h2>
          <motion.ul className="space-y-1.5" variants={staggerContainer} initial="hidden" animate="show">
            {results.projects.map((p) => (
              <motion.li key={p.id} variants={staggerItem}>
                <Link
                  href={`/${orgSlug}/${p.key}/board`}
                  className="flex items-center gap-3 rounded-lg border border-edge bg-panel px-3.5 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-glow"
                >
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-700">
                    {p.key}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">{p.name}</span>
                    {p.description && (
                      <span className="block truncate text-xs text-zinc-500">{p.description}</span>
                    )}
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}

      {hasQuery && results && results.issues.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Issues
          </h2>
          <motion.ul className="space-y-1.5" variants={staggerContainer} initial="hidden" animate="show">
            {results.issues.map((i) => (
              <motion.li key={i.id} variants={staggerItem}>
                <Link
                  href={`/${orgSlug}/${i.projectKey}/board?issue=${i.number}`}
                  className="flex items-center gap-3 rounded-lg border border-edge bg-panel px-3.5 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-glow"
                >
                  <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                    {i.projectKey}-{i.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">{i.title}</span>
                  <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
                    {i.status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}
    </div>
  );
}

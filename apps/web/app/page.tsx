'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { useOrgs } from '../lib/hooks';
import { AppBar } from '../components/app-bar';
import { Avatar, Logo } from '../components/brand';
import { CreateOrgDialog } from '../components/create-org-dialog';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';

export default function HomePage() {
  const token = useAuthStore((s) => s.accessToken);
  const orgs = useOrgs();
  const [creating, setCreating] = useState(false);

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md animate-fade-in text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={52} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">PM SaaS</h1>
          <p className="mx-auto mt-3 max-w-sm text-zinc-600">
            Multi-tenant project management — boards, issues, and your team, all in one place.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <AppBar />
      <main className="mx-auto max-w-xl animate-fade-in px-4 py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Your organizations</h1>
            <p className="mt-1 text-[13px] text-zinc-500">Select a workspace to continue.</p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            + New organization
          </Button>
        </div>

        <ul className="space-y-2.5">
          {orgs.data?.map((o) => (
            <li key={o.id}>
              <Link
                href={`/${o.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-500/50"
              >
                <Avatar name={o.name} seed={o.id} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-zinc-900">{o.name}</span>
                    <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-600">
                      {o.memberships[0]?.role}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {o._count.projects} projects · {o._count.memberships} members
                  </span>
                </span>
                <span className="text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600">
                  →
                </span>
              </Link>
            </li>
          ))}
          {orgs.isLoading && <SkeletonRows />}
          {orgs.isError && (
            <ErrorState title="Couldn’t load organizations" onRetry={() => orgs.refetch()} />
          )}
          {orgs.data?.length === 0 && (
            <EmptyState
              title="No organizations yet"
              description="Create your first workspace to start managing projects and issues."
              action={<Button onClick={() => setCreating(true)}>Create organization</Button>}
            />
          )}
        </ul>
      </main>
      <CreateOrgDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3.5">
          <span className="h-10 w-10 animate-pulse rounded-full bg-elevated" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-40 animate-pulse rounded bg-elevated" />
            <span className="block h-3 w-24 animate-pulse rounded bg-elevated" />
          </span>
        </li>
      ))}
    </>
  );
}

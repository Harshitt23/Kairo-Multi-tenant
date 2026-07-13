'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMyWork, type MyWorkIssue } from '../../../lib/hooks';
import { dueBadge } from '../../../lib/due';
import { cn } from '../../../lib/cn';
import { staggerContainer, staggerItem } from '../../../lib/motion';
import { PRIORITY_DOT, labelize } from '../../../components/issue-modal';
import { EmptyState } from '../../../components/ui/empty-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Skeleton } from '../../../components/ui/skeleton';

const isSettled = (i: MyWorkIssue) => i.status === 'DONE' || i.status === 'CANCELED';

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-edge bg-panel px-4 py-3 shadow-card">
      <div className={cn('text-2xl font-semibold tabular-nums', tone)}>{value}</div>
      <div className="mt-0.5 text-[13px] text-zinc-500">{label}</div>
    </div>
  );
}

function IssueRow({ orgSlug, issue }: { orgSlug: string; issue: MyWorkIssue }) {
  const due = dueBadge(issue);
  const dot = (PRIORITY_DOT as Record<string, string>)[issue.priority] ?? 'bg-zinc-600';
  return (
    <motion.li variants={staggerItem}>
      <Link
        href={`/${orgSlug}/${issue.projectKey}/board?issue=${issue.number}`}
        className="flex items-center gap-3 rounded-lg border border-edge bg-panel px-3.5 py-2.5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-glow"
      >
        <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} title={labelize(issue.priority)} />
        <span className="shrink-0 font-mono text-[11px] text-zinc-500">
          {issue.projectKey}-{issue.number}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">{issue.title}</span>
        {issue.labels.slice(0, 2).map(({ label }) => (
          <span
            key={label.id}
            className="hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:inline"
            style={{ backgroundColor: `${label.color}1f`, color: label.color }}
          >
            {label.name}
          </span>
        ))}
        {due && !isSettled(issue) && (
          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', due.cls)}>
            {due.text}
          </span>
        )}
      </Link>
    </motion.li>
  );
}

function Section({
  title,
  accent,
  orgSlug,
  issues,
}: {
  title: string;
  accent?: string;
  orgSlug: string;
  issues: MyWorkIssue[];
}) {
  if (issues.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {accent && <span className={cn('h-1.5 w-1.5 rounded-full', accent)} />}
        {title}
        <span className="text-zinc-400">{issues.length}</span>
      </h2>
      <motion.ul
        className="space-y-1.5"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {issues.map((i) => (
          <IssueRow key={i.id} orgSlug={orgSlug} issue={i} />
        ))}
      </motion.ul>
    </section>
  );
}

export default function MyWorkPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const query = useMyWork(orgSlug);
  const issues = query.data ?? [];

  const open = issues.filter((i) => !isSettled(i));
  const overdue = open.filter((i) => dueBadge(i)?.overdue);
  const dueSoon = open.filter((i) => dueBadge(i)?.dueSoon);
  const rest = open.filter((i) => {
    const d = dueBadge(i);
    return !d?.overdue && !d?.dueSoon;
  });
  const done = issues.filter((i) => i.status === 'DONE');

  return (
    <div className="mx-auto max-w-3xl animate-fade-in px-6 py-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">My Work</h1>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          Everything assigned to you across this workspace.
        </p>
      </div>

      {query.isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      )}

      {query.isError && <ErrorState title="Couldn’t load your work" onRetry={() => query.refetch()} />}

      {query.isSuccess && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Open" value={open.length} tone="text-zinc-900" />
            <StatCard label="Overdue" value={overdue.length} tone="text-red-600" />
            <StatCard label="Due soon" value={dueSoon.length} tone="text-amber-600" />
            <StatCard label="Completed" value={done.length} tone="text-emerald-600" />
          </div>

          {issues.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nothing assigned to you"
                description="When a teammate assigns you an issue, it lands here — grouped by how soon it’s due."
              />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-edge bg-panel px-4 py-3 shadow-card">
                <span className="whitespace-nowrap text-[12.5px] font-medium text-zinc-700">Progress</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${issues.length ? Math.round((done.length / issues.length) * 100) : 0}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {done.length} of {issues.length} completed
                </span>
              </div>

              <Section title="Overdue" accent="bg-red-500" orgSlug={orgSlug} issues={overdue} />
              <Section title="Due soon" accent="bg-amber-500" orgSlug={orgSlug} issues={dueSoon} />
              <Section title="Open" accent="bg-indigo-500" orgSlug={orgSlug} issues={rest} />
              <Section title="Completed" accent="bg-emerald-500" orgSlug={orgSlug} issues={done} />
            </>
          )}
        </>
      )}
    </div>
  );
}

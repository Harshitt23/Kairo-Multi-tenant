'use client';

import { motion } from 'framer-motion';
import { useDashboardStats } from '../../lib/hooks';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

function pctDelta(current: number, prior: number): { text: string; up: boolean } | null {
  if (prior === 0) return current === 0 ? null : { text: 'new', up: true };
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct === 0) return null;
  return { text: `${pct > 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
}

function StatCard({
  theme,
  label,
  value,
  delta,
  icon,
}: {
  theme: DashboardStyles;
  label: string;
  value: string;
  delta?: { text: string; up: boolean } | null;
  icon: React.ReactNode;
}) {
  return (
    <motion.div variants={staggerItem}>
      <DashboardCard theme={theme}>
        <div className="flex items-center justify-between">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </span>
          {delta && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                delta.up ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
              }`}
            >
              {delta.text}
            </span>
          )}
        </div>
        <div className="mt-3 text-[12.5px] font-medium text-zinc-500">{label}</div>
        <div className="mt-1 text-[27px] font-bold tracking-tight text-zinc-900">{value}</div>
      </DashboardCard>
    </motion.div>
  );
}

export function DashboardStatCards({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const { data, isLoading, isError } = useDashboardStats(orgSlug);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <DashboardCard key={i} theme={theme}>
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-16" />
          </DashboardCard>
        ))}
      </div>
    );
  }

  if (isError || !data) return null;

  const cycleTime = data.avgCycleTimeDays !== null ? `${data.avgCycleTimeDays.toFixed(1)}d` : '—';

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <StatCard
        theme={theme}
        label="Open issues"
        value={String(data.openIssues)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 6h11M8 12h11M8 18h11" strokeLinecap="round" />
            <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        }
      />
      <StatCard
        theme={theme}
        label="Closed this week"
        value={String(data.closedThisWeek)}
        delta={pctDelta(data.closedThisWeek, data.closedPriorWeek)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <StatCard
        theme={theme}
        label="Overdue"
        value={String(data.overdueIssues)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <StatCard
        theme={theme}
        label="Avg cycle time"
        value={cycleTime}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
          </svg>
        }
      />
    </motion.div>
  );
}

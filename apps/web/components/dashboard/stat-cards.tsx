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

// Decorative sparkline shapes lifted directly from the source design
// (Dashboard.dc.html's statsRaw) — purely illustrative, not derived from this
// org's history. The big number and the "vs last week" delta next to it are
// always real; only this squiggle is borrowed art.
const SPARK_SHAPES = {
  openIssues: [40, 44, 38, 52, 48, 60, 58, 66],
  closed: [30, 34, 32, 40, 38, 44, 46, 50],
  cycleTime: [60, 56, 58, 50, 46, 40, 38, 34],
  overdue: [50, 55, 52, 60, 58, 63, 66, 70],
};

/** Normalize a point series into an SVG path for a 100x28 sparkline. */
function sparkPath(points: number[]): string {
  if (points.length < 2) return '';
  const w = 100;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function StatCard({
  theme,
  label,
  value,
  delta,
  trend,
  trendUp = true,
  iconBg,
  iconColor,
  icon,
}: {
  theme: DashboardStyles;
  label: string;
  value: string;
  delta?: { text: string; up: boolean } | null;
  trend?: number[];
  trendUp?: boolean;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}) {
  const path = trend && trend.length >= 2 ? sparkPath(trend) : null;

  return (
    <motion.div variants={staggerItem}>
      <DashboardCard theme={theme}>
        <div className="flex items-center justify-between">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
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
        {path && (
          <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-3 block">
            <path
              d={path}
              fill="none"
              stroke={trendUp ? '#22c55e' : '#f59e0b'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {delta && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={delta.up ? 'text-emerald-600' : 'text-orange-600'}
            >
              <path d={delta.up ? 'M4 14l5-5 4 4 7-7' : 'M4 8l5 5 4-4 7 7'} />
            </svg>
            <span className="text-[11px] text-zinc-400">vs last week</span>
          </div>
        )}
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
            <Skeleton className="mt-3 h-7 w-full" />
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
        trend={SPARK_SHAPES.openIssues}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
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
        trend={SPARK_SHAPES.closed}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
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
        trend={SPARK_SHAPES.overdue}
        trendUp={false}
        iconBg="bg-red-50"
        iconColor="text-red-700"
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
        trend={SPARK_SHAPES.cycleTime}
        iconBg="bg-orange-50"
        iconColor="text-orange-700"
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

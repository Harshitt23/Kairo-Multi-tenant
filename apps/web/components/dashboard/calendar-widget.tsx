'use client';

import { useMemo } from 'react';
import { useDashboardCalendar } from '../../lib/hooks';
import { type DashboardStyles } from '../../lib/dashboard-theme';
import { Skeleton } from '../ui/skeleton';
import { DashboardCard } from './dashboard-card';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PRIORITY_COLOR: Record<string, string> = {
  NONE: '#a1a1aa',
  LOW: '#38bdf8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export function CalendarWidget({ orgSlug, theme }: { orgSlug: string; theme: DashboardStyles }) {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // 0-based
  const todayDate = now.getDate();
  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const { data, isLoading } = useDashboardCalendar(orgSlug, month);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, string>(); // date -> color of first event
    for (const ev of data ?? []) {
      if (!map.has(ev.date)) map.set(ev.date, PRIORITY_COLOR[ev.priority] ?? '#6366f1');
    }
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, monthIndex, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const out: { label: string; isToday: boolean; date: string | null; eventColor?: string }[] = [];
    for (let i = 0; i < startOffset; i++) out.push({ label: '', isToday: false, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      out.push({
        label: String(d),
        isToday: d === todayDate,
        date,
        eventColor: eventsByDate.get(date),
      });
    }
    return out;
  }, [year, monthIndex, todayDate, eventsByDate]);

  const upcoming = (data ?? []).slice(0, 3);

  return (
    <DashboardCard theme={theme}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[14.5px] font-semibold text-zinc-900">
          {MONTH_NAMES[monthIndex]} {year}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((wd, i) => (
              <span key={i} className="text-center text-[10px] font-semibold text-zinc-400">
                {wd}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => (
              <div
                key={i}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] transition-colors ${
                  c.isToday
                    ? 'bg-brand font-bold text-white'
                    : c.date
                      ? 'font-normal text-zinc-700 hover:bg-elevated'
                      : ''
                }`}
              >
                {c.label}
                {c.eventColor && !c.isToday && (
                  <span
                    className="absolute bottom-1 h-1 w-1 rounded-full"
                    style={{ background: c.eventColor }}
                  />
                )}
              </div>
            ))}
          </div>
          {upcoming.length > 0 && (
            <div className="mt-4 flex flex-col gap-2.5 border-t border-edge pt-3.5">
              {upcoming.map((ev) => (
                <div key={ev.issueId} className="flex items-center gap-2.5">
                  <span
                    className="h-6 w-[3px] shrink-0 rounded-full"
                    style={{ background: PRIORITY_COLOR[ev.priority] ?? '#6366f1' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-zinc-800">{ev.title}</span>
                    <span className="block text-[11px] text-zinc-400">
                      {ev.projectKey}-{ev.issueNumber} · due {ev.date.slice(5)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}

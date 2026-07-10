/**
 * SLA-style due badge shared by the board and the My Work dashboard.
 * Overdue (red), due today / due soon (amber), else a muted date. Settled
 * (done/canceled) issues never read as overdue.
 */
export function dueBadge(
  issue: { dueDate: string | null; status: string },
): { text: string; cls: string; overdue: boolean; dueSoon: boolean } | null {
  if (!issue.dueDate) return null;
  const due = new Date(issue.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const date = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const settled = issue.status === 'DONE' || issue.status === 'CANCELED';
  if (settled) return { text: date, cls: 'bg-elevated text-zinc-500', overdue: false, dueSoon: false };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((due.getTime() - startOfToday.getTime()) / 86_400_000);
  if (days < 0) return { text: `Overdue · ${date}`, cls: 'bg-red-50 text-red-700', overdue: true, dueSoon: false };
  if (days === 0) return { text: 'Due today', cls: 'bg-amber-50 text-amber-700', overdue: false, dueSoon: true };
  if (days <= 2) return { text: `Due ${date}`, cls: 'bg-amber-50 text-amber-700', overdue: false, dueSoon: true };
  return { text: date, cls: 'bg-elevated text-zinc-500', overdue: false, dueSoon: false };
}

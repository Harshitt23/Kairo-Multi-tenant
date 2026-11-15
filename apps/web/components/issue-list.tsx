'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { issuePrioritySchema, type IssueStatusValue } from '@kairo/types';
import { useIssues, useLabels, useMembers, type Issue, type Member } from '../lib/hooks';
import { cn } from '../lib/cn';
import { dueBadge } from '../lib/due';
import { Avatar } from './brand';
import { Button } from './ui/button';
import { ErrorState } from './ui/error-state';
import { EmptyState } from './ui/empty-state';
import { Skeleton } from './ui/skeleton';
import { IssueDetailModal, NewIssueModal, PRIORITY_DOT, labelize } from './issue-modal';

/**
 * Table view over the same issues the board shows — sortable columns,
 * the board's filters, and the same ?issue= deep-link modal.
 */

const STATUS_ORDER: Record<string, number> = {
  BACKLOG: 0,
  TODO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  DONE: 4,
  CANCELED: 5,
};

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

const STATUS_DOT: Record<string, string> = {
  BACKLOG: 'bg-faint',
  TODO: 'bg-sky-500',
  IN_PROGRESS: 'bg-amber-500',
  IN_REVIEW: 'bg-violet-500',
  DONE: 'bg-emerald-500',
  CANCELED: 'bg-faint',
};

type SortKey = 'number' | 'title' | 'status' | 'priority' | 'dueDate' | 'updatedAt';

interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

export function IssueList({ orgSlug, projectKey }: { orgSlug: string; projectKey: string }) {
  const issuesQuery = useIssues(orgSlug, projectKey);
  const issuesData = issuesQuery.data;
  const issues = useMemo(() => issuesData ?? [], [issuesData]);
  const { data: members = [] } = useMembers(orgSlug);
  const { data: labels = [] } = useLabels(orgSlug);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [assignee, setAssignee] = useState<string>('ALL');
  const [label, setLabel] = useState<string>('ALL');
  const [sort, setSort] = useState<Sort>({ key: 'updatedAt', dir: 'desc' });

  // Same ?issue=<number> deep link the board uses, so links work across views.
  const issueParam = searchParams.get('issue');
  const openIssue = (n: number) => router.replace(`${pathname}?issue=${n}`, { scroll: false });
  const closeIssue = () => router.replace(pathname, { scroll: false });

  // C = new issue, / = focus search (ignored while typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'c') {
        e.preventDefault();
        setCreating(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.user.id, m])), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (status !== 'ALL' && i.status !== status) return false;
      if (priority !== 'ALL' && i.priority !== priority) return false;
      if (assignee === 'UNASSIGNED' && i.assigneeId !== null) return false;
      if (assignee !== 'ALL' && assignee !== 'UNASSIGNED' && i.assigneeId !== assignee) return false;
      if (label !== 'ALL' && !i.labels?.some((l) => l.label.id === label)) return false;
      if (q && !(i.title.toLowerCase().includes(q) || `#${i.number}`.includes(q))) return false;
      return true;
    });
  }, [issues, query, status, priority, assignee, label]);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const by = sort.key;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (by) {
        case 'number':
          cmp = a.number - b.number;
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          break;
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
          break;
        case 'dueDate': {
          // Issues without a due date always sort last, regardless of direction.
          const av = a.dueDate ? new Date(a.dueDate).getTime() : null;
          const bv = b.dueDate ? new Date(b.dueDate).getTime() : null;
          if (av === null && bv === null) cmp = 0;
          else if (av === null) return 1;
          else if (bv === null) return -1;
          else cmp = av - bv;
          break;
        }
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return cmp * dir;
    });
  }, [filtered, sort]);

  const filtersActive =
    query.trim() !== '' || status !== 'ALL' || priority !== 'ALL' || assignee !== 'ALL' || label !== 'ALL';

  const selectedIssue = issueParam
    ? issues.find((i) => String(i.number) === issueParam) ?? null
    : null;

  function toggleSort(key: SortKey) {
    setSort((cur) =>
      cur.key === key
        ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'updatedAt' ? 'desc' : 'asc' },
    );
  }

  const selectClass =
    'h-7 rounded-md border border-edge bg-elevated px-2 text-[13px] text-ink transition-colors focus:border-accent';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar — mirrors the board's filters, plus a status filter */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-edge px-4 py-2">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          title="Press / to focus"
          placeholder="Search issues…"
          className="h-7 w-48 rounded-md border border-edge bg-elevated px-2.5 text-[13px] text-ink placeholder:text-faint transition-colors focus:border-accent"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="ALL">All statuses</option>
          {Object.keys(STATUS_ORDER).map((s) => (
            <option key={s} value={s}>
              {labelize(s)}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
          <option value="ALL">All priorities</option>
          {issuePrioritySchema.options.map((p) => (
            <option key={p} value={p}>
              {labelize(p)}
            </option>
          ))}
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={selectClass}>
          <option value="ALL">All assignees</option>
          <option value="UNASSIGNED">Unassigned</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.name}
            </option>
          ))}
        </select>
        {labels.length > 0 && (
          <select value={label} onChange={(e) => setLabel(e.target.value)} className={selectClass}>
            <option value="ALL">All labels</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
        {filtersActive && (
          <button
            onClick={() => {
              setQuery('');
              setStatus('ALL');
              setPriority('ALL');
              setAssignee('ALL');
              setLabel('ALL');
            }}
            className="h-7 rounded-md px-2 text-[13px] text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted">
            {filtersActive ? `${sorted.length} of ${issues.length}` : `${issues.length} issues`}
          </span>
          <Button size="sm" title="Press C" onClick={() => setCreating(true)}>
            + New issue
          </Button>
        </div>
      </div>

      {/* table */}
      {issuesQuery.isError ? (
        <div className="grid min-h-0 flex-1 place-items-center px-4">
          <ErrorState
            title="Couldn’t load issues"
            onRetry={() => issuesQuery.refetch()}
            className="w-full max-w-sm border-none bg-transparent"
          />
        </div>
      ) : issuesQuery.isLoading ? (
        <ListSkeleton />
      ) : sorted.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            title={filtersActive ? 'No issues match the filters' : 'No issues yet'}
            description={
              filtersActive
                ? 'Try clearing a filter or two.'
                : 'Create the first issue to get this project moving.'
            }
            action={
              filtersActive ? undefined : (
                <Button size="sm" onClick={() => setCreating(true)}>
                  + New issue
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-edge text-left">
                <Th label="ID" sortKey="number" sort={sort} onSort={toggleSort} className="w-20 pl-4" />
                <Th label="Title" sortKey="title" sort={sort} onSort={toggleSort} />
                <Th label="Status" sortKey="status" sort={sort} onSort={toggleSort} className="w-32" />
                <Th label="Priority" sortKey="priority" sort={sort} onSort={toggleSort} className="w-28" />
                <th className="w-24 py-2 pr-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                  Assignee
                </th>
                <Th label="Due" sortKey="dueDate" sort={sort} onSort={toggleSort} className="w-28" />
                <Th label="Updated" sortKey="updatedAt" sort={sort} onSort={toggleSort} className="w-28 pr-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((issue) => (
                <Row
                  key={issue.id}
                  issue={issue}
                  assignee={issue.assigneeId ? memberByUserId.get(issue.assigneeId) : undefined}
                  onOpen={() => openIssue(issue.number)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          orgSlug={orgSlug}
          projectKey={projectKey}
          issue={selectedIssue}
          members={members}
          onClose={closeIssue}
        />
      )}
      {creating && (
        <NewIssueModal
          orgSlug={orgSlug}
          projectKey={projectKey}
          members={members}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function Th({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={cn('py-2 pr-2', className)}>
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide transition-colors',
          active ? 'text-ink' : 'text-muted hover:text-ink',
        )}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-opacity', active ? 'opacity-100' : 'opacity-0')}
        >
          {sort.dir === 'asc' ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
        </svg>
      </button>
    </th>
  );
}

function Row({
  issue,
  assignee,
  onOpen,
}: {
  issue: Issue;
  assignee?: Member;
  onOpen: () => void;
}) {
  const due = dueBadge(issue);
  const dot = (PRIORITY_DOT as Record<string, string>)[issue.priority] ?? 'bg-faint';
  const updated = new Date(issue.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-edge transition-colors hover:bg-elevated/50"
    >
      <td className="py-2 pl-4 pr-2 font-mono text-[12px] text-faint">#{issue.number}</td>
      <td className="max-w-0 py-2 pr-2">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink">{issue.title}</span>
          {issue.labels?.map(({ label }) => (
            <span
              key={label.id}
              className="hidden shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium lg:inline-flex"
              style={{ backgroundColor: `${label.color}1f`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[issue.status] ?? 'bg-faint')} />
          {labelize(issue.status)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span className={cn('h-2 w-2 rounded-full', dot)} />
          {labelize(issue.priority)}
        </span>
      </td>
      <td className="py-2 pr-2">
        {assignee ? (
          <span title={assignee.user.name}>
            <Avatar name={assignee.user.name} seed={assignee.user.id} size={20} />
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        {due ? (
          <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', due.cls)}>
            {due.text}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
      <td className="whitespace-nowrap py-2 pr-4 text-muted">{updated}</td>
    </tr>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-px p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

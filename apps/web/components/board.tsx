'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { rankBetween, issuePrioritySchema, type IssueStatusValue } from '@pm/types';
import { useIssues, useLabels, useMembers, useMoveIssue, type Issue, type Member } from '../lib/hooks';
import { useBoardRealtime } from '../lib/use-board-realtime';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { dueBadge } from '../lib/due';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Avatar } from './brand';
import { Button } from './ui/button';
import { ErrorState } from './ui/error-state';
import { Skeleton } from './ui/skeleton';
import { IssueDetailModal, NewIssueModal, PRIORITY_DOT, labelize } from './issue-modal';

const COLUMNS: { status: IssueStatusValue; label: string }[] = [
  { status: 'BACKLOG', label: 'Backlog' },
  { status: 'TODO', label: 'Todo' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DONE', label: 'Done' },
];

const COL_PREFIX = 'col:';

export function Board({ orgSlug, projectKey }: { orgSlug: string; projectKey: string }) {
  const issuesQuery = useIssues(orgSlug, projectKey);
  const issuesData = issuesQuery.data;
  const issues = useMemo(() => issuesData ?? [], [issuesData]);
  const { data: members = [] } = useMembers(orgSlug);
  const { data: labels = [] } = useLabels(orgSlug);
  const move = useMoveIssue(orgSlug, projectKey);
  const presence = useBoardRealtime(orgSlug, projectKey);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ?issue=<number> is the shareable deep-link; the modal mirrors it.
  const issueParam = searchParams.get('issue');
  const openIssue = (id: string) => {
    const n = issues.find((i) => i.id === id)?.number;
    if (n != null) router.replace(`${pathname}?issue=${n}`, { scroll: false });
  };
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
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<string>('ALL');
  const [assignee, setAssignee] = useState<string>('ALL');
  const [label, setLabel] = useState<string>('ALL');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (priority !== 'ALL' && i.priority !== priority) return false;
      if (assignee === 'UNASSIGNED' && i.assigneeId !== null) return false;
      if (assignee !== 'ALL' && assignee !== 'UNASSIGNED' && i.assigneeId !== assignee) return false;
      if (label !== 'ALL' && !i.labels?.some((l) => l.label.id === label)) return false;
      if (q && !(i.title.toLowerCase().includes(q) || `#${i.number}`.includes(q))) return false;
      return true;
    });
  }, [issues, query, priority, assignee, label]);

  const filtersActive =
    query.trim() !== '' || priority !== 'ALL' || assignee !== 'ALL' || label !== 'ALL';

  const memberByUserId = useMemo(
    () => new Map(members.map((m) => [m.user.id, m])),
    [members],
  );

  const byStatus = useMemo(() => {
    const map = new Map<IssueStatusValue, Issue[]>();
    for (const c of COLUMNS) map.set(c.status, []);
    for (const i of filtered) map.get(i.status)?.push(i);
    for (const list of map.values()) list.sort((a, b) => (a.rank < b.rank ? -1 : 1));
    return map;
  }, [filtered]);

  const statusOf = (id: string) => issues.find((i) => i.id === id)?.status;

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const activeIssueId = String(e.active.id);
    const over = e.over;
    if (!over) return;

    const overId = String(over.id);
    const targetStatus: IssueStatusValue | undefined = overId.startsWith(COL_PREFIX)
      ? (overId.slice(COL_PREFIX.length) as IssueStatusValue)
      : statusOf(overId);
    if (!targetStatus) return;

    // Build the destination column without the dragged card.
    const column = (byStatus.get(targetStatus) ?? []).filter((i) => i.id !== activeIssueId);
    const overIndex = overId.startsWith(COL_PREFIX)
      ? column.length
      : column.findIndex((i) => i.id === overId);
    const insertAt = overIndex < 0 ? column.length : overIndex;

    const above = column[insertAt - 1]?.rank ?? null;
    const below = column[insertAt]?.rank ?? null;
    if (above === below) return; // dropped in place

    let optimisticRank: string;
    try {
      optimisticRank = rankBetween(above, below);
    } catch {
      return;
    }

    move.mutate({
      id: activeIssueId,
      optimisticRank,
      input: {
        status: targetStatus,
        aboveId: column[insertAt - 1]?.id ?? null,
        belowId: column[insertAt]?.id ?? null,
      },
    });
  }

  const activeIssue = issues.find((i) => i.id === activeId) ?? null;
  const selectedIssue = issueParam
    ? issues.find((i) => String(i.number) === issueParam) ?? null
    : null;

  const selectClass =
    'h-7 rounded-md border border-edge bg-elevated px-2 text-[13px] text-zinc-700 transition-colors focus:border-indigo-500';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-edge px-4 py-2">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          title="Press / to focus"
          placeholder="Search issues…"
          className="h-7 w-48 rounded-md border border-edge bg-elevated px-2.5 text-[13px] text-zinc-800 placeholder:text-zinc-400 transition-colors focus:border-indigo-500"
        />
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
              setPriority('ALL');
              setAssignee('ALL');
              setLabel('ALL');
            }}
            className="h-7 rounded-md px-2 text-[13px] text-zinc-500 transition-colors hover:bg-elevated hover:text-zinc-800"
          >
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Presence users={presence} />
          <span className="text-xs text-zinc-600">
            {filtersActive ? `${filtered.length} of ${issues.length}` : `${issues.length} issues`}
          </span>
          <Button size="sm" title="Press C" onClick={() => setCreating(true)}>
            + New issue
          </Button>
        </div>
      </div>

      {/* columns */}
      {issuesQuery.isError ? (
        <div className="grid min-h-0 flex-1 place-items-center px-4">
          <ErrorState
            title="Couldn’t load the board"
            onRetry={() => issuesQuery.refetch()}
            className="w-full max-w-sm border-none bg-transparent"
          />
        </div>
      ) : issuesQuery.isLoading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={onDragEnd}
        >
          <div className="min-h-0 flex-1 overflow-x-auto">
            <motion.div
              className="flex h-full gap-3 px-4 py-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {COLUMNS.map((col) => (
                <motion.div key={col.status} variants={staggerItem} className="h-full">
                  <Column
                    status={col.status}
                    label={col.label}
                    issues={byStatus.get(col.status) ?? []}
                    memberByUserId={memberByUserId}
                    onOpen={openIssue}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
          <DragOverlay>
            {activeIssue ? (
              <Card
                issue={activeIssue}
                assignee={activeIssue.assigneeId ? memberByUserId.get(activeIssue.assigneeId) : undefined}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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

function Column({
  status,
  label,
  issues,
  memberByUserId,
  onOpen,
}: {
  status: IssueStatusValue;
  label: string;
  issues: Issue[];
  memberByUserId: Map<string, Member>;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COL_PREFIX}${status}` });
  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center gap-2 px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">{label}</span>
        <span className="rounded-full bg-elevated px-1.5 py-px text-[11px] text-zinc-500">
          {issues.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border p-2 transition-colors',
          isOver ? 'border-indigo-400 bg-indigo-50/60' : 'border-edge bg-elevated/40',
        )}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <Card
              key={issue.id}
              issue={issue}
              assignee={issue.assigneeId ? memberByUserId.get(issue.assigneeId) : undefined}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function Card({
  issue,
  assignee,
  overlay = false,
  onOpen,
}: {
  issue: Issue;
  assignee?: Member;
  overlay?: boolean;
  onOpen?: (id: string) => void;
}) {
  const due = dueBadge(issue);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !overlay ? 0.4 : 1,
  };
  const dot = (PRIORITY_DOT as Record<string, string>)[issue.priority] ?? 'bg-zinc-600';
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(issue.id)}
      className={cn(
        'cursor-pointer rounded-md border border-edge bg-panel p-2.5 text-[13px] shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-glow',
        overlay && 'rotate-1 shadow-glow',
      )}
    >
      {issue.labels && issue.labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {issue.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}1f`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="font-medium leading-snug text-zinc-900">{issue.title}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <span>{`#${issue.number} · ${issue.priority}`}</span>
        {due && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', due.cls)}>
            {due.text}
          </span>
        )}
        {assignee && (
          <span className="ml-auto" title={assignee.user.name}>
            <Avatar name={assignee.user.name} seed={assignee.user.id} size={18} />
          </span>
        )}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-x-auto">
      <div className="flex h-full gap-3 px-4 py-3">
        {COLUMNS.map((col, c) => (
          <div key={col.status} className="flex h-full w-72 shrink-0 flex-col">
            <div className="mb-2 px-1">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="min-h-0 flex-1 space-y-2 rounded-lg border border-edge/60 bg-panel/40 p-2">
              {Array.from({ length: 3 - (c % 2) }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Presence({ users }: { users: { userId: string; name: string }[] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex items-center -space-x-1.5" title={users.map((u) => u.name).join(', ')}>
      {users.slice(0, 4).map((u) => (
        <span key={u.userId} className="rounded-full ring-2 ring-surface">
          <Avatar name={u.name} seed={u.userId} size={22} />
        </span>
      ))}
      {users.length > 4 && (
        <span className="z-10 inline-flex h-[22px] items-center rounded-full bg-elevated px-1.5 text-[10px] text-zinc-600 ring-2 ring-surface">
          +{users.length - 4}
        </span>
      )}
    </div>
  );
}

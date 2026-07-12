'use client';

import { useEffect, useRef, useState } from 'react';
import {
  issuePrioritySchema,
  issueStatusSchema,
  MAX_ATTACHMENT_BYTES,
  type IssuePriorityValue,
  type IssueStatusValue,
} from '@kairo/types';
import {
  useActivity,
  useCreateComment,
  useAttachments,
  useCreateIssue,
  useDeleteAttachment,
  useDeleteIssue,
  useUploadAttachment,
  useUpdateIssue,
  type ActivityItem,
  type Issue,
  type Member,
} from '../lib/hooks';
import { Avatar } from './brand';
import { LabelPicker } from './label-picker';
import { cn } from '../lib/cn';

const STATUSES = issueStatusSchema.options;
const PRIORITIES = issuePrioritySchema.options;

/** BACKLOG -> "Backlog", IN_PROGRESS -> "In Progress". */
function labelize(v: string): string {
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const PRIORITY_DOT: Record<IssuePriorityValue, string> = {
  NONE: 'bg-zinc-600',
  LOW: 'bg-sky-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

// --- shared presentational bits --------------------------------------------

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/30 p-4 backdrop-blur-sm sm:p-10"
      onClick={onClose}
    >
      <div
        className="mt-4 w-full max-w-2xl rounded-xl border border-edge bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500';
const selectCls = inputCls + ' cursor-pointer';

function AssigneeOptions({ members }: { members: Member[] }) {
  return (
    <>
      <option value="">Unassigned</option>
      {members.map((m) => (
        <option key={m.user.id} value={m.user.id}>
          {m.user.name}
        </option>
      ))}
    </>
  );
}

/**
 * Value -> "YYYY-MM-DD" for <input type="date">, or "" when unset/invalid.
 * Accepts a string (server ISO) or a Date (optimistic cache) transparently.
 */
function toDateInput(value: string | Date | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // Use local date parts so the picker doesn't shift a day across timezones.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentsSection({ orgSlug, issueId }: { orgSlug: string; issueId: string }) {
  const { data: files = [] } = useAttachments(orgSlug, issueId);
  const upload = useUploadAttachment(orgSlug, issueId);
  const del = useDeleteAttachment(orgSlug, issueId);
  const [err, setErr] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setErr('File exceeds the 25 MB limit.');
      return;
    }
    upload.mutate(file, {
      onError: () => setErr('Upload failed — object storage may not be configured yet.'),
    });
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Attachments
      </span>
      <ul className="space-y-1">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded-md border border-edge bg-surface px-3 py-2 text-sm"
          >
            <a
              href={f.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-indigo-700 hover:underline"
            >
              {f.fileName}
            </a>
            <span className="ml-3 flex items-center gap-3 text-xs text-zinc-500">
              <span>{formatSize(f.size)}</span>
              <button
                onClick={() => del.mutate(f.id)}
                className="text-zinc-500 hover:text-red-600"
                aria-label="Delete attachment"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
        {files.length === 0 && <li className="text-xs text-zinc-600">No files attached.</li>}
      </ul>
      <label className="mt-2 inline-block cursor-pointer text-xs text-indigo-600 hover:text-indigo-700">
        {upload.isPending ? 'Uploading…' : '+ Attach a file'}
        <input type="file" className="hidden" onChange={onFile} disabled={upload.isPending} />
      </label>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

// --- activity timeline ------------------------------------------------------

/** "3m ago", "2h ago", "5d ago", or a date. Mirrors the inbox helper. */
function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const FIELD_LABEL: Record<string, string> = {
  title: 'title',
  description: 'description',
  dueDate: 'due date',
  labels: 'labels',
};

/** The human sentence for a non-comment activity event. */
function describeEvent(item: Extract<ActivityItem, { type: Exclude<ActivityItem['type'], 'comment'> }>): string {
  switch (item.type) {
    case 'created':
      return 'created this issue';
    case 'status':
      return `changed status ${item.from ? labelize(item.from) : '—'} → ${item.to ? labelize(item.to) : '—'}`;
    case 'priority':
      return `set priority to ${labelize(item.to)}`;
    case 'assignee':
      if (!item.to) return 'unassigned this issue';
      return item.from ? `reassigned to ${item.to}` : `assigned ${item.to}`;
    case 'updated':
      return `updated the ${item.fields.map((f) => FIELD_LABEL[f] ?? f).join(', ')}`;
  }
}

function EventDot({ type }: { type: ActivityItem['type'] }) {
  const paths: Record<string, string> = {
    created: 'M12 5v14M5 12h14',
    status: 'M4 7h11l-3-3M20 17H9l3 3',
    priority: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    assignee: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87',
    updated: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  };
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-elevated text-zinc-500">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[type] ?? paths.updated} />
      </svg>
    </span>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Render a comment body, styling any "@Member Name" that matches the team. */
function renderCommentBody(body: string, memberNames: string[]): React.ReactNode {
  if (memberNames.length === 0) return body;
  const names = [...memberNames].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const re = new RegExp(`@(?:${names.join('|')})`, 'g');
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) nodes.push(body.slice(last, m.index));
    nodes.push(
      <span key={m.index} className="rounded bg-indigo-50 px-1 font-medium text-indigo-700">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < body.length) nodes.push(body.slice(last));
  return nodes;
}

function ActivityRow({ item, memberNames }: { item: ActivityItem; memberNames: string[] }) {
  const who = item.actor?.name ?? 'Someone';
  if (item.type === 'comment') {
    return (
      <li className="flex gap-2.5">
        <Avatar name={who} seed={item.actor?.id} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-zinc-900">{who}</span>
            <span className="text-xs text-zinc-500">{timeAgo(item.at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-surface px-3 py-2 text-sm text-zinc-700">
            {renderCommentBody(item.body, memberNames)}
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2.5">
      <EventDot type={item.type} />
      <span className="min-w-0 text-[13px] text-zinc-500">
        <span className="font-medium text-zinc-700">{who}</span> {describeEvent(item)}
        <span className="text-zinc-400"> · {timeAgo(item.at)}</span>
      </span>
    </li>
  );
}

/** Comment box with @-triggered member autocomplete. */
function MentionComposer({
  members,
  pending,
  onSubmit,
}: {
  members: Member[];
  pending: boolean;
  onSubmit: (body: string, mentionIds: string[]) => void;
}) {
  const [body, setBody] = useState('');
  // name -> userId for every mention the user has inserted this session.
  const picked = useRef(new Map<string, string>());
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [popup, setPopup] = useState<{ query: string; start: number } | null>(null);
  const [active, setActive] = useState(0);

  const suggestions = popup
    ? members
        .filter((m) => m.user.name.toLowerCase().includes(popup.query.toLowerCase()))
        .slice(0, 6)
    : [];

  const detect = (value: string, caret: number) => {
    const match = /(?:^|\s)@(\w*)$/.exec(value.slice(0, caret));
    if (match) {
      setPopup({ query: match[1], start: caret - match[1].length - 1 });
      setActive(0);
    } else {
      setPopup(null);
    }
  };

  const pick = (m: Member) => {
    if (!popup) return;
    const caret = taRef.current?.selectionStart ?? body.length;
    const insert = `@${m.user.name} `;
    const next = body.slice(0, popup.start) + insert + body.slice(caret);
    picked.current.set(m.user.name, m.user.id);
    setBody(next);
    setPopup(null);
    requestAnimationFrame(() => {
      const pos = popup.start + insert.length;
      taRef.current?.focus();
      taRef.current?.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    const text = body.trim();
    if (!text || pending) return;
    const ids = new Set<string>();
    for (const [name, id] of picked.current) {
      if (text.includes(`@${name}`)) ids.add(id);
    }
    onSubmit(text, [...ids]);
    setBody('');
    picked.current.clear();
    setPopup(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (popup && suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pick(suggestions[active]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setPopup(null);
        return;
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative mt-3">
      <textarea
        ref={taRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          detect(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        rows={3}
        className={inputCls + ' resize-y'}
        placeholder="Write a comment…  (@ to mention · ⌘/Ctrl + Enter to send)"
      />
      {popup && suggestions.length > 0 && (
        <div className="absolute bottom-full z-10 mb-1 w-64 overflow-hidden rounded-lg border border-edge bg-panel py-1 shadow-card">
          {suggestions.map((m, i) => (
            <button
              key={m.user.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(m)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                i === active ? 'bg-elevated text-zinc-900' : 'text-zinc-600',
              )}
            >
              <Avatar name={m.user.name} seed={m.user.id} size={20} />
              <span className="truncate">{m.user.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <button
          onClick={submit}
          disabled={!body.trim() || pending}
          className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Posting…' : 'Comment'}
        </button>
      </div>
    </div>
  );
}

function ActivitySection({
  orgSlug,
  issueId,
  members,
}: {
  orgSlug: string;
  issueId: string;
  members: Member[];
}) {
  const { data: items = [], isLoading } = useActivity(orgSlug, issueId);
  const create = useCreateComment(orgSlug, issueId);
  const memberNames = members.map((m) => m.user.name);

  return (
    <div>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Activity
      </span>

      <ul className="space-y-3">
        {isLoading && <li className="text-xs text-zinc-600">Loading…</li>}
        {!isLoading && items.length === 0 && (
          <li className="text-xs text-zinc-600">No activity yet.</li>
        )}
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} memberNames={memberNames} />
        ))}
      </ul>

      <MentionComposer
        members={members}
        pending={create.isPending}
        onSubmit={(body, mentionIds) =>
          create.mutate({ body, mentionIds: mentionIds.length ? mentionIds : undefined })
        }
      />
    </div>
  );
}

// --- edit an existing issue -------------------------------------------------

export function IssueDetailModal({
  orgSlug,
  projectKey,
  issue,
  members,
  onClose,
}: {
  orgSlug: string;
  projectKey: string;
  issue: Issue;
  members: Member[];
  onClose: () => void;
}) {
  const update = useUpdateIssue(orgSlug, projectKey);
  const del = useDeleteIssue(orgSlug, projectKey);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = (input: Parameters<typeof update.mutate>[0]['input']) =>
    update.mutate({ id: issue.id, input });

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-edge px-5 py-3">
        <span className="font-mono text-xs text-zinc-500">
          {projectKey}-{issue.number}
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-surface hover:text-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 p-5">
        <input
          defaultValue={issue.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== issue.title) save({ title: v });
          }}
          className="w-full rounded-md bg-transparent px-1 text-lg font-semibold text-zinc-900 outline-none focus:bg-surface"
          placeholder="Issue title"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <select
              className={selectCls}
              value={issue.status}
              onChange={(e) => save({ status: e.target.value as IssueStatusValue })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select
              className={selectCls}
              value={issue.priority}
              onChange={(e) => save({ priority: e.target.value as IssuePriorityValue })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assignee">
            <select
              className={selectCls}
              value={issue.assigneeId ?? ''}
              onChange={(e) => save({ assigneeId: e.target.value || null })}
            >
              <AssigneeOptions members={members} />
            </select>
          </Field>

          <Field label="Due date">
            <input
              type="date"
              className={inputCls + ' cursor-pointer'}
              value={toDateInput(issue.dueDate)}
              onChange={(e) => save({ dueDate: e.target.value ? new Date(e.target.value) : null })}
            />
          </Field>
        </div>

        <LabelPicker
          orgSlug={orgSlug}
          selected={issue.labels?.map((l) => l.label.id) ?? []}
          onChange={(labelIds) => save({ labelIds })}
        />

        <Field label="Description">
          <textarea
            defaultValue={issue.description ?? ''}
            rows={5}
            onBlur={(e) => {
              const v = e.target.value;
              if (v !== (issue.description ?? '')) save({ description: v });
            }}
            className={inputCls + ' resize-y'}
            placeholder="Add a description…"
          />
        </Field>

        <AttachmentsSection orgSlug={orgSlug} issueId={issue.id} />

        <div className="border-t border-edge pt-4">
          <ActivitySection orgSlug={orgSlug} issueId={issue.id} members={members} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-edge px-5 py-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-600">Delete this issue?</span>
            <button
              onClick={() => {
                del.mutate(issue.id);
                onClose();
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
        <span className="text-xs text-zinc-600">
          {update.isPending ? 'Saving…' : 'Changes save automatically'}
        </span>
      </div>
    </ModalShell>
  );
}

// --- create a new issue -----------------------------------------------------

export function NewIssueModal({
  orgSlug,
  projectKey,
  members,
  onClose,
}: {
  orgSlug: string;
  projectKey: string;
  members: Member[];
  onClose: () => void;
}) {
  const create = useCreateIssue(orgSlug, projectKey);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IssueStatusValue>('BACKLOG');
  const [priority, setPriority] = useState<IssuePriorityValue>('NONE');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelIds, setLabelIds] = useState<string[]>([]);

  const submit = () => {
    const t = title.trim();
    if (!t || create.isPending) return;
    create.mutate(
      {
        title: t,
        description: description || undefined,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labelIds: labelIds.length ? labelIds : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h2 className="text-sm font-medium text-zinc-800">New issue</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-surface hover:text-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 p-5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.metaKey && submit()}
          className={inputCls + ' text-base'}
          placeholder="Issue title"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <select
              className={selectCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatusValue)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className={selectCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriorityValue)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select
              className={selectCls}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <AssigneeOptions members={members} />
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={selectCls}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <LabelPicker orgSlug={orgSlug} selected={labelIds} onChange={setLabelIds} />

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputCls + ' resize-y'}
            placeholder="Add a description…"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-edge px-5 py-3">
        <button
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!title.trim() || create.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create issue'}
        </button>
      </div>
    </ModalShell>
  );
}

export { PRIORITY_DOT, labelize };

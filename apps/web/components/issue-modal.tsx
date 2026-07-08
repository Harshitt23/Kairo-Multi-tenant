'use client';

import { useEffect, useState } from 'react';
import {
  issuePrioritySchema,
  issueStatusSchema,
  MAX_ATTACHMENT_BYTES,
  type IssuePriorityValue,
  type IssueStatusValue,
} from '@pm/types';
import {
  useAttachments,
  useCreateIssue,
  useDeleteAttachment,
  useDeleteIssue,
  useUploadAttachment,
  useUpdateIssue,
  type Issue,
  type Member,
} from '../lib/hooks';

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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-10"
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
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500';
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
              className="min-w-0 truncate text-indigo-300 hover:underline"
            >
              {f.fileName}
            </a>
            <span className="ml-3 flex items-center gap-3 text-xs text-zinc-500">
              <span>{formatSize(f.size)}</span>
              <button
                onClick={() => del.mutate(f.id)}
                className="text-zinc-500 hover:text-red-400"
                aria-label="Delete attachment"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
        {files.length === 0 && <li className="text-xs text-zinc-600">No files attached.</li>}
      </ul>
      <label className="mt-2 inline-block cursor-pointer text-xs text-indigo-400 hover:text-indigo-300">
        {upload.isPending ? 'Uploading…' : '+ Attach a file'}
        <input type="file" className="hidden" onChange={onFile} disabled={upload.isPending} />
      </label>
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
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
          className="rounded p-1 text-zinc-500 hover:bg-surface hover:text-zinc-200"
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
          className="w-full rounded-md bg-transparent px-1 text-lg font-semibold text-zinc-100 outline-none focus:bg-surface"
          placeholder="Issue title"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        </div>

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
      </div>

      <div className="flex items-center justify-between border-t border-edge px-5 py-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Delete this issue?</span>
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
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
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
      },
      { onSuccess: onClose },
    );
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h2 className="text-sm font-medium text-zinc-200">New issue</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-surface hover:text-zinc-200"
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        </div>

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
          className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
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

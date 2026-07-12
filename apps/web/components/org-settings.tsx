'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { can, type Role } from '@kairo/types';
import { ApiError } from '../lib/api';
import {
  useInviteMember,
  useInvites,
  useMe,
  useMembers,
  useNotificationPrefs,
  useRemoveMember,
  useUpdateMemberRole,
  useUpdateNotificationPrefs,
  type Member,
  type NotificationPrefs,
} from '../lib/hooks';
import { Avatar } from './brand';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';

const ROLES = ['MEMBER', 'ADMIN', 'GUEST'];

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-indigo-50 text-indigo-700',
  ADMIN: 'bg-emerald-50 text-emerald-700',
  MEMBER: 'bg-zinc-100 text-zinc-700',
  GUEST: 'bg-zinc-100 text-zinc-500',
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-edge bg-panel p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

export function MembersPanel({ orgSlug }: { orgSlug: string }) {
  const { data: members = [], isLoading } = useMembers(orgSlug);
  const { data: me } = useMe();
  const invite = useInviteMember(orgSlug);
  const updateRole = useUpdateMemberRole(orgSlug);
  const removeMember = useRemoveMember(orgSlug);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [notice, setNotice] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const myRole = members.find((m) => m.user.id === me?.id)?.role as Role | undefined;
  const canManage = !!myRole && can(myRole, 'member:update_role');
  const invites = useInvites(orgSlug, canManage);

  const changeRole = (m: Member, next: string) =>
    updateRole.mutate(
      { userId: m.user.id, role: next },
      {
        onSuccess: () => toast.success(`${m.user.name} is now ${next.toLowerCase()}`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Failed to update role'),
      },
    );

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeMember.mutate(removeTarget.user.id, {
      onSuccess: () => {
        toast.success(`${removeTarget.user.name} removed from the organization`);
        setRemoveTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : 'Failed to remove member');
        setRemoveTarget(null);
      },
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || invite.isPending) return;
    setNotice(null);
    invite.mutate(
      { email: value, role },
      {
        onSuccess: (data) => {
          setNotice(
            data.status === 'added'
              ? `${value} was already a user — added to the org.`
              : `Invitation email sent to ${value}.`,
          );
          setEmail('');
        },
      },
    );
  };

  const errMsg =
    invite.error instanceof ApiError
      ? invite.error.status === 403
        ? 'You need admin rights to invite members.'
        : invite.error.message
      : invite.error
        ? 'Failed to invite.'
        : null;

  return (
    <Panel title="Members">
      <ul className="mb-4 divide-y divide-edge">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={m.user.name} seed={m.user.id} size={28} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm text-zinc-900">
                  {m.user.name}
                  {me?.id === m.user.id && (
                    <span className="rounded bg-elevated px-1.5 py-px text-[10px] uppercase tracking-wide text-zinc-500">
                      You
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{m.user.email}</p>
              </div>
            </div>
            {canManage && m.role !== 'OWNER' && m.user.id !== me?.id ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <select
                  value={m.role}
                  disabled={updateRole.isPending}
                  onChange={(e) => changeRole(m, e.target.value)}
                  className="rounded-md border border-edge bg-surface px-2 py-1 text-xs text-zinc-800 outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setRemoveTarget(m)}
                  aria-label={`Remove ${m.user.name}`}
                  title="Remove member"
                  className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-elevated hover:text-red-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <span
                className={`rounded px-2 py-0.5 text-xs ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}
              >
                {m.role}
              </span>
            )}
          </li>
        ))}
        {isLoading && <li className="py-2 text-sm text-zinc-500">Loading…</li>}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="flex-1 rounded-md border border-edge bg-surface px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!email.trim() || invite.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {invite.isPending ? 'Inviting…' : 'Invite'}
        </button>
      </form>
      {notice && <p className="mt-2 text-xs text-emerald-600">{notice}</p>}
      {errMsg && <p className="mt-2 text-xs text-red-600">{errMsg}</p>}

      {canManage && (invites.data?.length ?? 0) > 0 && (
        <div className="mt-5 border-t border-edge pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pending invites
          </h3>
          <ul className="divide-y divide-edge">
            {invites.data!.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-700">{inv.email}</p>
                  <p className="text-xs text-zinc-600">{expiresIn(inv.expiresAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs ${ROLE_BADGE[inv.role] ?? ROLE_BADGE.MEMBER}`}
                >
                  {inv.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        {removeTarget && (
          <DialogContent
            title={`Remove ${removeTarget.user.name}?`}
            description={`${removeTarget.user.email} will immediately lose access to every project in this organization.`}
          >
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={removeMember.isPending} onClick={confirmRemove}>
                Remove member
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Panel>
  );
}

/** "Expires in 6d" / "Expires today" / "Expired". */
function expiresIn(iso: string): string {
  const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  return `Expires in ${days}d`;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-zinc-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationPrefsPanel() {
  const { data: prefs } = useNotificationPrefs();
  const update = useUpdateNotificationPrefs();
  const set = (key: keyof NotificationPrefs, value: boolean) => update.mutate({ [key]: value });

  return (
    <Panel title="Email notifications">
      {prefs ? (
        <div className="divide-y divide-edge">
          <Toggle
            label="When assigned to an issue"
            hint="Email me when someone assigns an issue to me."
            checked={prefs.emailOnAssigned}
            onChange={(v) => set('emailOnAssigned', v)}
          />
          <Toggle
            label="When mentioned"
            hint="Email me when someone @-mentions me in a comment."
            checked={prefs.emailOnMentioned}
            onChange={(v) => set('emailOnMentioned', v)}
          />
          <Toggle
            label="On new comments"
            hint="Email me about comments on issues I'm involved in."
            checked={prefs.emailOnComment}
            onChange={(v) => set('emailOnComment', v)}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
    </Panel>
  );
}

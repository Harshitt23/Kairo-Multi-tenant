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

function Panel({
  title,
  badge,
  description,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-edge bg-panel p-6 shadow-card-hover">
      <div className="mb-0.5 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {badge}
      </div>
      {description && <p className="mb-4 text-[13px] text-zinc-500">{description}</p>}
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
    <Panel
      title="Members"
      badge={
        <span className="rounded-full bg-elevated px-2 py-px text-[11px] font-semibold text-zinc-500">
          {members.length}
        </span>
      }
      description="Invite teammates and manage their access to this workspace."
    >
      <form onSubmit={submit} className="mb-2 flex flex-col gap-2 rounded-lg border border-edge bg-surface p-3 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="h-[34px] min-w-0 flex-1 rounded-md border border-edge bg-panel px-2.5 text-[13px] text-zinc-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-[34px] shrink-0 rounded-md border border-edge bg-panel px-2 text-[12.5px] font-medium text-zinc-700 outline-none focus:border-indigo-400"
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
          className="h-[34px] shrink-0 whitespace-nowrap rounded-md bg-brand px-3.5 text-[13px] font-medium text-white shadow-glow transition-all duration-150 ease-premium hover:opacity-95 hover:-translate-y-px disabled:opacity-50 disabled:translate-y-0"
        >
          {invite.isPending ? 'Inviting…' : 'Invite'}
        </button>
      </form>
      {notice && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 animate-fade-in">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
          {notice}
        </div>
      )}
      {errMsg && <p className="mb-3 text-xs text-red-600">{errMsg}</p>}

      <ul className="flex flex-col">
        {members.map((m) => (
          <li key={m.id} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface">
            <Avatar name={m.user.name} seed={m.user.id} size={32} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[13px] font-medium text-zinc-900">
                {m.user.name}
                {me?.id === m.user.id && (
                  <span className="shrink-0 rounded bg-elevated px-1.5 py-px text-[10px] font-semibold uppercase text-zinc-500">
                    You
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-zinc-500">{m.user.email}</p>
            </div>
            {canManage && m.role !== 'OWNER' && m.user.id !== me?.id ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <select
                  value={m.role}
                  disabled={updateRole.isPending}
                  onChange={(e) => changeRole(m, e.target.value)}
                  className="h-[30px] rounded-md border border-edge bg-panel px-2 text-xs font-medium text-zinc-700 outline-none focus:border-indigo-400 disabled:opacity-50"
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
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}
              >
                {m.role}
              </span>
            )}
          </li>
        ))}
        {isLoading && <li className="py-2 text-sm text-zinc-500">Loading…</li>}
      </ul>

      {canManage && (invites.data?.length ?? 0) > 0 && (
        <div className="mt-3 border-t border-edge pt-3">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Pending invites
          </h3>
          <ul className="divide-y divide-edge">
            {invites.data!.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-700">{inv.email}</p>
                  <p className="text-xs text-zinc-500">{expiresIn(inv.expiresAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[inv.role] ?? ROLE_BADGE.MEMBER}`}
                >
                  {inv.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="my-4 h-px bg-edge" />
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">How roles work</h3>
      <div className="flex flex-col gap-1.5 text-[12.5px] text-zinc-500">
        <p className="flex gap-2">
          <span className="w-14 shrink-0 font-semibold text-zinc-700">Owner</span>
          Full control, including billing and deleting the workspace.
        </p>
        <p className="flex gap-2">
          <span className="w-14 shrink-0 font-semibold text-zinc-700">Admin</span>
          Manage members, projects, and workspace settings.
        </p>
        <p className="flex gap-2">
          <span className="w-14 shrink-0 font-semibold text-zinc-700">Member</span>
          Create and edit issues in projects they&apos;re added to.
        </p>
        <p className="flex gap-2">
          <span className="w-14 shrink-0 font-semibold text-zinc-700">Guest</span>
          Limited, read-mostly access to shared projects.
        </p>
      </div>

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
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div>
        <p className="text-[13px] font-medium text-zinc-900">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-elevated'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 first:mt-0">
      {children}
    </h3>
  );
}

export function NotificationPrefsPanel() {
  const { data: prefs } = useNotificationPrefs();
  const update = useUpdateNotificationPrefs();
  const set = (key: keyof NotificationPrefs, value: boolean) => update.mutate({ [key]: value });

  return (
    <Panel title="Email notifications" description="Choose what you get emailed about.">
      {prefs ? (
        <>
          <SectionLabel>Issues</SectionLabel>
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

          <SectionLabel>In-app</SectionLabel>
          <div className="flex items-center justify-between gap-3 py-2.5 opacity-55">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-900">
                Desktop push
                <span className="rounded bg-elevated px-1.5 py-px text-[10px] font-semibold text-zinc-500">SOON</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">Get notified even when Kairo isn&apos;t open.</p>
            </div>
            <span className="relative h-5 w-9 shrink-0 rounded-full bg-elevated">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white" />
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
    </Panel>
  );
}

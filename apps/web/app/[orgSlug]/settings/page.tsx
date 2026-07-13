'use client';

import { MembersPanel, NotificationPrefsPanel } from '../../../components/org-settings';

export default function OrgSettingsPage({ params }: { params: { orgSlug: string } }) {
  return (
    <div className="animate-fade-in px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Manage members and how you get notified.
          </p>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <MembersPanel orgSlug={params.orgSlug} />
          <NotificationPrefsPanel />
        </div>
      </div>
    </div>
  );
}

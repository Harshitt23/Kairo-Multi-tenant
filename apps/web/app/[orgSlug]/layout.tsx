'use client';

import { AppShell } from '../../components/sidebar';

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  return <AppShell orgSlug={params.orgSlug}>{children}</AppShell>;
}

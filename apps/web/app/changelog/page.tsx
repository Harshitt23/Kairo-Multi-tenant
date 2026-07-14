import type { Metadata } from 'next';
import { ChangelogContent } from '../../components/marketing/changelog-content';
import { MarketingShell } from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Changelog — Kairo',
  description: 'New features, improvements, and fixes shipped to Kairo.',
};

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <ChangelogContent />
    </MarketingShell>
  );
}

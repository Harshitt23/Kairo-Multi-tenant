import type { Metadata } from 'next';
import { DocsContent } from '../../components/marketing/docs-content';
import { MarketingShell } from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Docs — Kairo',
  description: 'Guides and reference for building your workflow on Kairo.',
};

export default function DocsPage() {
  return (
    <MarketingShell>
      <DocsContent />
    </MarketingShell>
  );
}

import type { Metadata } from 'next';
import { BlogContent } from '../../components/marketing/blog-content';
import { MarketingShell } from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Blog — Kairo',
  description: 'Notes on shipping, team process, and building calm software.',
};

export default function BlogPage() {
  return (
    <MarketingShell>
      <BlogContent />
    </MarketingShell>
  );
}

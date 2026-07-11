import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MarketingPageHeader,
  MarketingShell,
  SIGN_UP_HREF,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Docs — PM SaaS',
  description: 'Guides and reference for building your workflow on PM SaaS.',
};

const SECTIONS = [
  {
    title: 'Getting started',
    blurb: 'Create your first workspace, invite teammates, and set up a board in minutes.',
    articles: ['Quickstart', 'Core concepts', 'Inviting your team'],
  },
  {
    title: 'Workspaces & orgs',
    blurb: 'Multi-tenant workspaces, membership, and switching between organizations.',
    articles: ['Creating a workspace', 'Members & roles', 'Switching orgs'],
  },
  {
    title: 'Boards & issues',
    blurb: 'Real-time drag-and-drop boards, issue fields, priorities, and labels.',
    articles: ['Board basics', 'Issue fields', 'Labels & priorities'],
  },
  {
    title: 'Permissions',
    blurb: 'Role-based access control across workspace, project, and guest scopes.',
    articles: ['The role model', 'Guest access', 'Best practices'],
  },
  {
    title: 'Billing',
    blurb: 'Plans, seats, usage-based charges, and managing your subscription.',
    articles: ['Plans & pricing', 'Managing seats', 'Invoices & receipts'],
  },
  {
    title: 'API & webhooks',
    blurb: 'Automate PM SaaS with our REST API and subscribe to real-time events.',
    articles: ['Authentication', 'REST reference', 'Webhooks'],
  },
];

export default function DocsPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Docs"
        title="Everything you need to build your workflow"
        description="Guides, concepts, and reference for getting the most out of PM SaaS — from your first board to the API."
      />
      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-edge bg-panel p-6 shadow-card"
            >
              <h3 className="text-base font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-500">{s.blurb}</p>
              <ul className="mt-4 flex flex-col gap-2 border-t border-edge pt-4">
                {s.articles.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-zinc-600">
                    <span className="text-indigo-400">→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-5xl rounded-2xl bg-zinc-900 px-8 py-10 text-center">
          <h2 className="text-xl font-semibold text-white">Ready to try it yourself?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Spin up a workspace and follow the quickstart — free for teams up to 10.
          </p>
          <Link
            href={SIGN_UP_HREF}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

import type { Metadata } from 'next';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Changelog — Kairo',
  description: 'New features, improvements, and fixes shipped to Kairo.',
};

const TAG_STYLES: Record<string, string> = {
  New: 'bg-emerald-50 text-emerald-700',
  Improved: 'bg-indigo-50 text-indigo-700',
  Fixed: 'bg-amber-50 text-amber-700',
};

const RELEASES = [
  {
    version: 'v2.4',
    date: 'July 4, 2026',
    tags: ['New', 'Improved'],
    title: 'Live presence on every board',
    items: [
      'See teammate cursors and avatars in real time as they move issues.',
      'Board columns now animate on drop with a snappier spring curve.',
      'Command palette gained a “Search everything” action.',
    ],
  },
  {
    version: 'v2.3',
    date: 'June 12, 2026',
    tags: ['New'],
    title: 'Role-based access control',
    items: [
      'Workspace, project, and guest roles that mirror your org chart.',
      'Per-project visibility controls for external collaborators.',
    ],
  },
  {
    version: 'v2.2',
    date: 'May 20, 2026',
    tags: ['Improved', 'Fixed'],
    title: 'Faster inbox & notifications',
    items: [
      'Grouped notifications so your inbox is digestible on your own schedule.',
      'Fixed a rare case where issue counts drifted after a bulk move.',
    ],
  },
  {
    version: 'v2.1',
    date: 'April 8, 2026',
    tags: ['New'],
    title: 'Usage-based billing',
    items: [
      'Seat and usage-based Stripe plans — upgrade or downgrade anytime.',
      'Self-serve invoices and receipts under workspace settings.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Changelog"
        title="What's new in Kairo"
        description="A running log of the features, improvements, and fixes we ship. Follow along as the product evolves."
      />
      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          {RELEASES.map((r) => (
            <article key={r.version} className="relative border-l border-edge pl-6">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-zinc-900">{r.version}</span>
                <span className="text-[13px] text-zinc-400">{r.date}</span>
                <div className="flex gap-1.5">
                  {r.tags.map((t) => (
                    <span
                      key={t}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TAG_STYLES[t]}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-zinc-900">{r.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {r.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-600">
                    <span className="text-indigo-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}

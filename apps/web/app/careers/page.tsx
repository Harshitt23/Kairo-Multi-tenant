import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Careers — PM SaaS',
  description: 'Open roles at PM SaaS — a small, fully-remote team building a calm project tracker.',
};

const PERKS = [
  { title: 'Fully remote', body: 'Work from anywhere within ±6 hours of CET. We sync async-first.' },
  { title: 'Real ownership', body: 'Meaningful equity and end-to-end ownership of what you ship.' },
  { title: 'Focus time', body: 'No-meeting Wednesdays and a culture that protects deep work.' },
  { title: 'Health & time off', body: 'Comprehensive coverage and a minimum — not maximum — vacation policy.' },
];

const ROLES = [
  { title: 'Senior Product Engineer', team: 'Engineering', location: 'Remote (EU)' },
  { title: 'Product Designer', team: 'Design', location: 'Remote (EU/US-East)' },
  { title: 'Developer Advocate', team: 'Growth', location: 'Remote' },
  { title: 'Customer Success Lead', team: 'Success', location: 'Remote (EU)' },
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Careers"
        title="Build the tracker teams love to open"
        description="We're a small, fully-remote team with big ambitions and a bias for calm, well-crafted software. If that resonates, we'd love to talk."
      />

      <section className="border-b border-edge bg-panel px-6 py-14 lg:px-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">Why work here</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {PERKS.map((p) => (
              <div key={p.title}>
                <h3 className="mb-1.5 text-base font-semibold text-zinc-900">{p.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">Open roles</h2>
          <div className="divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-panel">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-elevated"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-900">{r.title}</div>
                  <div className="mt-0.5 text-[13px] text-zinc-500">
                    {r.team} · {r.location}
                  </div>
                </div>
                <Link
                  href="mailto:careers@pmsaas.example?subject=Application"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-edge px-4 text-[13px] font-medium text-zinc-700 transition-colors hover:border-indigo-400 hover:text-zinc-900"
                >
                  Apply
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Don’t see your role?{' '}
            <Link
              href="mailto:careers@pmsaas.example?subject=Open%20application"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Send us an open application
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}

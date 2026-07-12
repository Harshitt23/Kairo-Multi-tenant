import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MarketingPageHeader,
  MarketingShell,
  SIGN_UP_HREF,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'About — PM SaaS',
  description: 'Why we build a calm, real-time project tracker for teams who ship.',
};

const STATS = [
  { value: '2,400+', label: 'Teams onboarded' },
  { value: '40M+', label: 'Issues tracked' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '28', label: 'People, fully remote' },
];

const VALUES = [
  {
    title: 'Calm over noise',
    body: 'Software should reduce anxiety, not manufacture it. We design for focus, not for engagement metrics.',
  },
  {
    title: 'Real-time by default',
    body: 'Your team moves together. Presence, boards, and updates sync instantly so nobody works off a stale copy.',
  },
  {
    title: 'Own your work',
    body: 'Multi-tenant from day one. Your data, your workspaces, your rules — portable and exportable, always.',
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="About"
        title="We build the tracker we always wanted"
        description="PM SaaS started because every project tool we used felt like it was working against us. We set out to build a calm, fast, multi-tenant tracker that teams actually open on their own."
      />

      <section className="border-b border-edge bg-panel px-6 py-12 lg:px-14">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-zinc-900">{s.value}</div>
              <div className="mt-1 text-[13px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">What we believe</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title}>
                <h3 className="mb-2 text-base font-semibold text-zinc-900">{v.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-panel px-6 py-16 text-center lg:px-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Want to help us build it?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          We’re a small, fully-remote team — and we’re hiring.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/careers"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
          >
            See open roles
          </Link>
          <Link
            href={SIGN_UP_HREF}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-edge px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-indigo-400 hover:text-zinc-900"
          >
            Try PM SaaS
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

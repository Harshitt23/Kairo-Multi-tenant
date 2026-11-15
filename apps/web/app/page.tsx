'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { useOrgs } from '../lib/hooks';
import { AppBar } from '../components/app-bar';
import { CreateOrgDialog } from '../components/create-org-dialog';
import {
  MarketingFooter,
  MarketingNav,
  SIGN_UP_HREF,
} from '../components/marketing-chrome';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';

export default function HomePage() {
  const token = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  // Gate on the token: without it the /orgs query 401s and the api layer bounces
  // the visitor to /login, so the signed-out MarketingLanding below never shows.
  const orgs = useOrgs(!!token);
  const [creating, setCreating] = useState(false);

  // No org picker step: land straight in the first workspace (the sidebar's
  // org switcher covers picking a different one) so login goes straight to
  // the real dashboard instead of an intermediate list.
  useEffect(() => {
    if (orgs.data && orgs.data.length > 0) {
      router.replace(`/${orgs.data[0].slug}`);
    }
  }, [orgs.data, router]);

  if (!token) {
    return <MarketingLanding />;
  }

  if (orgs.isLoading || (orgs.data && orgs.data.length > 0)) {
    return null;
  }

  return (
    <>
      <AppBar />
      <main className="mx-auto max-w-xl animate-fade-in px-4 py-12">
        {orgs.isError ? (
          <ErrorState title="Couldn’t load organizations" onRetry={() => orgs.refetch()} />
        ) : (
          <EmptyState
            title="No organizations yet"
            description="Create your first workspace to start managing projects and issues."
            action={<Button onClick={() => setCreating(true)}>Create organization</Button>}
          />
        )}
      </main>
      <CreateOrgDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

/* --------------------------------------------------------------------- */
/*  Marketing landing page — shown when the visitor is signed out.       */
/*  Deliberately plain: no scroll animation, no gradients, no inflated   */
/*  numbers. The product and the engineering are the pitch.              */
/* --------------------------------------------------------------------- */

function MarketingLanding() {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-edge px-5 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Issue tracking, without the ceremony.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
            Workspaces, real-time boards, and role-based access for teams that care more about
            shipping than administering a tool.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={SIGN_UP_HREF}
              className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-4 text-[13px] font-medium text-surface transition-colors hover:bg-ink/85"
            >
              Get started
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-9 items-center justify-center rounded-md border border-edge bg-panel px-4 text-[13px] font-medium text-ink transition-colors hover:bg-elevated"
            >
              Read the docs
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-faint">Free for teams up to 10. No credit card.</p>

          {/* Product mock — flat, honest, no floating or rotation. */}
          <div className="mt-14 overflow-hidden rounded-lg border border-edge bg-panel">
            <div className="flex items-center gap-2.5 border-b border-edge px-4 py-2.5">
              <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide text-accent">
                KAI
              </span>
              <span className="text-[12.5px] font-medium text-ink">Checkout revamp</span>
              <span className="ml-auto text-[11.5px] text-faint">Board · 7 issues</span>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-x-auto bg-edge">
              <MockColumn label="Todo" count={3}>
                <MockCard id="KAI-41" title="Update empty-cart copy" priority="low" />
                <MockCard id="KAI-42" title="Saved payment methods" priority="med" />
                <MockCard id="KAI-44" title="Retry failed webhooks" priority="high" />
              </MockColumn>
              <MockColumn label="In progress" count={2}>
                <MockCard id="KAI-38" title="Stripe metered billing" priority="high" />
                <MockCard id="KAI-40" title="Tax calculation per region" priority="med" />
              </MockColumn>
              <MockColumn label="Done" count={2}>
                <MockCard id="KAI-35" title="Guest checkout flow" done />
                <MockCard id="KAI-36" title="Apple Pay support" done />
              </MockColumn>
            </div>
          </div>
        </div>
      </section>

      {/* Features — bordered grid, hairline dividers */}
      <section id="features" className="scroll-mt-14 border-b border-edge px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Built for how teams actually ship
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-panel p-5">
                <div className="mb-3 text-muted">{f.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold text-ink">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Under the hood — specific engineering facts, not adjectives */}
      <section className="border-b border-edge px-5 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Under the hood</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Kairo is built like infrastructure, not a demo. The parts you can’t see are the parts
              that keep your data where it belongs.
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {GUTS.map((g) => (
              <div key={g.term}>
                <dt className="font-mono text-[12px] font-medium text-ink">{g.term}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-muted">{g.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-14 border-b border-edge px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Pricing</h2>
          <p className="mt-2 text-[14px] text-muted">
            Every plan includes unlimited projects and real-time boards.
          </p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-edge bg-edge lg:grid-cols-3">
            {PLANS.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-edge px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Questions</h2>
          <div className="flex flex-col">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-edge">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-faint transition-transform duration-150 group-open:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="pb-4 text-[13.5px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Set up a workspace in about a minute.
        </h2>
        <p className="mt-2 text-[14px] text-muted">Free for teams up to 10 — no credit card.</p>
        <Link
          href={SIGN_UP_HREF}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-ink px-4 text-[13px] font-medium text-surface transition-colors hover:bg-ink/85"
        >
          Get started
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}

/* ---- hero board mock ------------------------------------------------- */

function MockColumn({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="min-w-[180px] bg-surface p-3">
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span className="font-mono text-[11px] text-faint">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

const MOCK_PRIORITY: Record<string, string> = {
  high: 'bg-red-500',
  med: 'bg-amber-500',
  low: 'bg-faint',
};

function MockCard({
  id,
  title,
  priority,
  done,
}: {
  id: string;
  title: string;
  priority?: 'high' | 'med' | 'low';
  done?: boolean;
}) {
  return (
    <div className="rounded-md border border-edge bg-panel p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10.5px] text-faint">{id}</span>
        {priority && (
          <span className={`ml-auto h-1.5 w-1.5 rounded-full ${MOCK_PRIORITY[priority]}`} />
        )}
        {done && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto text-emerald-600 dark:text-emerald-400"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <p className={`mt-1 text-[12.5px] leading-snug ${done ? 'text-faint line-through' : 'text-ink'}`}>
        {title}
      </p>
    </div>
  );
}

/* ---- pricing --------------------------------------------------------- */

function PricingCard({
  name,
  blurb,
  price,
  period,
  cta,
  featured,
  features,
}: (typeof PLANS)[number]) {
  return (
    <div className="flex flex-col bg-panel p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">{name}</h3>
        {featured && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10.5px] font-medium text-accent">
            Popular
          </span>
        )}
      </div>
      <p className="mt-1 text-[12.5px] text-muted">{blurb}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-mono text-3xl font-semibold tracking-tight text-ink">{price}</span>
        {period && <span className="text-[12px] text-faint">{period}</span>}
      </div>
      <ul className="mb-6 mt-5 flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-ink"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={SIGN_UP_HREF}
        className={
          featured
            ? 'mt-auto inline-flex h-9 items-center justify-center rounded-md bg-ink px-4 text-[13px] font-medium text-surface transition-colors hover:bg-ink/85'
            : 'mt-auto inline-flex h-9 items-center justify-center rounded-md border border-edge px-4 text-[13px] font-medium text-ink transition-colors hover:bg-elevated'
        }
      >
        {cta}
      </Link>
    </div>
  );
}

/* ---- content --------------------------------------------------------- */

const icon = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const FEATURES = [
  {
    title: 'Real-time boards',
    description:
      'Drag-and-drop Kanban that syncs across every open tab instantly, with presence so you can see who’s looking.',
    icon: (
      <svg {...icon}>
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="14" y="4" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    title: 'Roles that hold',
    description:
      'Owner, admin, member, guest — one permission matrix enforced identically in the API and the UI.',
    icon: (
      <svg {...icon}>
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
  {
    title: 'A focused inbox',
    description:
      'Assignments, mentions, and status changes in one place, with per-user email preferences.',
    icon: (
      <svg {...icon}>
        <path d="M4 5h16M4 12h16M4 19h10" />
      </svg>
    ),
  },
  {
    title: 'Issues with depth',
    description:
      'Comments, @mentions, labels, due dates, attachments, and a full activity timeline on every issue.',
    icon: (
      <svg {...icon}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    title: 'Search everything',
    description:
      'Workspace-wide search over issues and projects, plus a keyboard-first command palette.',
    icon: (
      <svg {...icon}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: 'An honest audit trail',
    description:
      'Every mutation lands in an append-only log — who changed what, and when, forever.',
    icon: (
      <svg {...icon}>
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

const GUTS = [
  {
    term: 'tenant isolation',
    detail:
      'Every request resolves its workspace through one guard, and Postgres row-level security backs it up — a missed WHERE clause still can’t leak a row.',
  },
  {
    term: 'auth',
    detail:
      'Access tokens live in memory, never localStorage. Refresh tokens rotate per use; replaying a stolen one revokes its whole family.',
  },
  {
    term: 'realtime',
    detail:
      'Socket.io fan-out over Redis. Board moves apply optimistically and reconcile against the server.',
  },
  {
    term: 'background work',
    detail:
      'Notifications and email run through a Redis-backed queue — nothing slow sits on the request path.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    blurb: 'For small teams getting organized.',
    price: '$0',
    period: '/ month',
    cta: 'Start free',
    featured: false,
    features: ['Up to 10 members', 'Unlimited issues', '1 workspace', '7-day activity history'],
  },
  {
    name: 'Team',
    blurb: 'For teams shipping every week.',
    price: '$10',
    period: '/ user / month',
    cta: 'Start free trial',
    featured: true,
    features: [
      'Unlimited members',
      'Unlimited workspaces',
      'Real-time presence',
      'Role-based access control',
      'Full activity history',
    ],
  },
  {
    name: 'Enterprise',
    blurb: 'For organizations with real scale.',
    price: 'Custom',
    period: '',
    cta: 'Talk to us',
    featured: false,
    features: ['SSO (on the roadmap)', 'Full audit log export', 'Priority support'],
  },
];

const FAQS = [
  {
    q: 'Can one account run multiple companies or clients?',
    a: 'Yes — Kairo is multi-tenant by design. Create a separate workspace per org or client, each with its own members, projects, and permissions.',
  },
  {
    q: 'Who can see my data?',
    a: 'Only members of your workspace. Isolation is enforced twice: once at the API boundary, and again by row-level security in the database itself.',
  },
  {
    q: 'What happens when my team outgrows the free plan?',
    a: 'Nothing breaks. You keep your data and upgrade whenever you’re ready — billing runs through Stripe and takes effect immediately.',
  },
  {
    q: 'Is there an API?',
    a: 'The entire product runs on the same REST API we’d give you — it’s documented in the docs section, and nothing in the app uses a private endpoint.',
  },
];

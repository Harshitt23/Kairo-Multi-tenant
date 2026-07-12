'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  fadeInUp,
  hoverLift,
  reducedMotionProps,
  spring,
  staggerContainer,
  staggerItem,
} from '../lib/motion';
import { useAuthStore } from '../lib/auth-store';
import { useOrgs } from '../lib/hooks';
import { AppBar } from '../components/app-bar';
import { Avatar } from '../components/brand';
import { CreateOrgDialog } from '../components/create-org-dialog';
import {
  MarketingFooter,
  MarketingNav,
  SIGN_UP_HREF,
} from '../components/marketing-chrome';
import { Badge } from '../components/ui/badge';
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
/*  NOTE: the CTAs are plain <Link>s styled to match the primary button  */
/*  on purpose — our Button component does not support `asChild`, so     */
/*  don't "fix" these into <Button asChild>.                             */
/* --------------------------------------------------------------------- */

function MarketingLanding() {
  const reduce = useReducedMotion();
  const motionProps = reduce ? reducedMotionProps : { variants: fadeInUp };

  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav />

      {/* Hero — split layout, product board demo up front */}
      <section className="grid gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-14 lg:py-24">
        <motion.div {...motionProps} initial="hidden" animate="show">
          <Badge variant="brand" className="mb-6 whitespace-nowrap px-3 py-1 text-[12.5px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            Live presence, everywhere
          </Badge>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl">
            The project tracker that gets out of your way.
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-zinc-600">
            Workspaces, boards, and role-based access for teams who care more about shipping
            than administering a tool.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href={SIGN_UP_HREF}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
            <Link
              href="/#demo"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-edge px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-indigo-400 hover:text-zinc-900"
            >
              Watch demo
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-zinc-400">
            No credit card required · Free for teams up to 10
          </p>
          <div className="mt-9 flex items-center gap-3">
            <div className="flex">
              <span className="rounded-full border-2 border-surface">
                <Avatar name="Jordan Lee" seed="jl" size={28} />
              </span>
              <span className="-ml-2 h-[30px] w-[30px] rounded-full border-2 border-surface bg-zinc-400" />
              <span className="-ml-2 h-[30px] w-[30px] rounded-full border-2 border-surface bg-zinc-500" />
            </div>
            <span className="text-[13px] text-zinc-500">Joined by 2,400+ teams this quarter</span>
          </div>
        </motion.div>

        <motion.div
          {...(reduce ? reducedMotionProps : { variants: fadeInUp })}
          initial="hidden"
          animate="show"
          transition={{ delay: reduce ? 0 : 0.08 }}
          id="demo"
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-edge bg-panel shadow-card"
        >
          <div className="flex items-center gap-2 border-b border-edge px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3.5 text-[12.5px] font-medium text-zinc-500">
              Checkout Revamp — Board
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                JL
              </span>
              <span className="-ml-1.5 h-5 w-5 rounded-full bg-zinc-400" />
              <span className="ml-1.5 text-[11px] text-zinc-400">2 online</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3.5 bg-zinc-50 p-5">
            <BoardColumn label="To do" count={2}>
              <BoardCard priority="LOW" title="Update empty-cart copy" />
              <BoardCard priority="MEDIUM" title="Add saved payment methods" />
            </BoardColumn>
            <BoardColumn label="Doing" count={1}>
              <BoardCard priority="HIGH" title="Wire Stripe metered billing" active />
            </BoardColumn>
            <BoardColumn label="Done" count={1}>
              <BoardCard title="Guest checkout flow" done />
            </BoardColumn>
          </div>
        </motion.div>
      </section>

      {/* Logo strip */}
      <section className="border-y border-edge bg-panel px-6 py-11 text-center lg:px-14">
        <p className="mb-6 text-[12.5px] font-semibold uppercase tracking-wide text-zinc-400">
          Trusted by engineering teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4 text-lg font-bold tracking-tight text-zinc-300">
          <span>Northwind</span>
          <span>Hearth</span>
          <span>Lumen</span>
          <span>Argus</span>
          <span>Meridian</span>
          <span>Fable</span>
        </div>
      </section>

      {/* Feature grid */}
      <motion.section
        id="features"
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="scroll-mt-20 px-6 py-20 lg:px-14 lg:py-24"
      >
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-indigo-600">
            Everything, one workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Built for how teams actually ship
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={reduce ? fadeInUp : staggerItem}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                {f.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-zinc-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonial */}
      <section className="bg-surface px-6 py-20 lg:px-14">
        <div className="mx-auto max-w-2xl text-center">
          <svg width="30" height="22" viewBox="0 0 32 24" fill="#c7c9f5" className="mx-auto mb-5" aria-hidden>
            <path d="M0 24V13.5C0 5.6 5.2 0 13 0v6.2c-4 .5-6.4 3-6.7 6.3H10V24H0zm17 0V13.5c0-7.9 5.2-13.5 13-13.5v6.2c-4 .5-6.4 3-6.7 6.3H27V24H17z" />
          </svg>
          <p className="text-xl font-semibold leading-relaxed tracking-tight text-zinc-900 sm:text-2xl">
            &ldquo;We ripped out three tools and moved forty engineers over in a week. Kairo is
            the first tracker the whole team actually opens on its own.&rdquo;
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Avatar name="Priya Nair" seed="priya" size={36} />
            <div className="text-left">
              <div className="text-sm font-semibold text-zinc-900">Priya Nair</div>
              <div className="text-[13px] text-zinc-500">VP Engineering, Meridian Labs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-panel px-6 py-20 lg:px-14 lg:py-24">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-indigo-600">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Plans that grow with your team
          </h2>
          <p className="mt-3 text-[15.5px] text-zinc-500">
            Every plan includes unlimited workspaces and real-time boards.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          <PricingCard
            name="Starter"
            blurb="For small teams getting organized."
            price="$0"
            period="/ month"
            cta="Start free"
            features={['Up to 10 members', 'Unlimited issues', '1 workspace', '7-day activity history']}
          />
          <PricingCard
            name="Team"
            blurb="For teams shipping every week."
            price="$10"
            period="/ user / month"
            cta="Start free trial"
            featured
            features={[
              'Unlimited members',
              'Unlimited workspaces',
              'Real-time presence',
              'Role-based access control',
              'Full activity history',
            ]}
          />
          <PricingCard
            name="Enterprise"
            blurb="For organizations with real scale."
            price="Custom"
            cta="Talk to sales"
            features={['SSO & SCIM provisioning', 'Audit logs', '99.9% uptime SLA', 'Dedicated support']}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface px-6 py-20 lg:px-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Questions, answered
          </h2>
          <div className="divide-y divide-edge">
            {FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <div className="mb-1.5 text-[15.5px] font-semibold text-zinc-900">{f.q}</div>
                <div className="text-sm leading-relaxed text-zinc-500">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-panel px-6 py-20 text-center lg:px-14">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Bring your team into focus.
        </h2>
        <p className="mb-8 text-base text-zinc-500">
          Free for teams up to 10 — no credit card required.
        </p>
        <Link
          href={SIGN_UP_HREF}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
        >
          Start free
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}

function BoardColumn({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-elevated p-3">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-zinc-500">{label}</span>
        <span className="text-[11px] text-zinc-400">{count}</span>
      </div>
      {children}
    </div>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  NONE: 'bg-zinc-100 text-zinc-500',
  LOW: 'bg-sky-50 text-sky-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-orange-50 text-orange-700',
  URGENT: 'bg-red-50 text-red-700',
};

function BoardCard({
  priority,
  title,
  active,
  done,
}: {
  priority?: keyof typeof PRIORITY_STYLES;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <motion.div
      whileHover={active ? { y: -2, transition: spring } : undefined}
      className={`rounded-lg border bg-panel p-3 ${
        active ? 'border-indigo-500 shadow-glow' : 'border-edge'
      } ${done ? 'opacity-60' : ''}`}
    >
      {priority && (
        <span
          className={`mb-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[priority]}`}
        >
          {priority}
        </span>
      )}
      <div className={`text-[12.5px] font-medium text-zinc-800 ${done ? 'line-through' : ''}`}>
        {title}
      </div>
    </motion.div>
  );
}

function PricingCard({
  name,
  blurb,
  price,
  period,
  cta,
  features,
  featured,
}: {
  name: string;
  blurb: string;
  price: string;
  period?: string;
  cta: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <motion.div
      {...hoverLift}
      className={`rounded-2xl p-8 ${
        featured
          ? 'relative bg-zinc-900 shadow-card'
          : 'border border-edge bg-panel'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-[11.5px] font-bold text-white">
          Most popular
        </span>
      )}
      <h3 className={`mb-1.5 text-base font-semibold ${featured ? 'text-white' : 'text-zinc-900'}`}>
        {name}
      </h3>
      <p className={`mb-5 text-[13.5px] ${featured ? 'text-zinc-400' : 'text-zinc-500'}`}>{blurb}</p>
      <div className="mb-6 flex items-baseline gap-1">
        <span className={`text-4xl font-bold tracking-tight ${featured ? 'text-white' : 'text-zinc-900'}`}>
          {price}
        </span>
        {period && <span className="text-sm text-zinc-400">{period}</span>}
      </div>
      <Link
        href={SIGN_UP_HREF}
        className={`mb-7 flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
          featured
            ? 'bg-brand text-white shadow-glow hover:opacity-90'
            : 'border border-edge text-zinc-700 hover:border-indigo-400 hover:text-zinc-900'
        }`}
      >
        {cta}
      </Link>
      <ul className={`flex flex-col gap-3 text-sm ${featured ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
    </motion.div>
  );
}

const FEATURES = [
  {
    title: 'Real-time boards',
    description: 'Drag-and-drop that syncs instantly, with live cursors for every teammate.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="14" y="4" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    title: 'Granular permissions',
    description: 'Workspace, project, and guest roles that mirror your org chart.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
  {
    title: 'A focused inbox',
    description: 'Grouped, mutable, and digestible on your own schedule.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
        <path d="M4 5h16M4 12h16M4 19h10" />
      </svg>
    ),
  },
  {
    title: 'Billing that scales',
    description: 'Seat and usage-based Stripe plans, upgrade or downgrade anytime.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
];

const FAQS = [
  {
    q: 'Can one Kairo account run multiple companies or clients?',
    a: 'Yes — Kairo is multi-tenant by design. Create separate workspaces for each org or client, each with its own members, projects, and permissions.',
  },
  {
    q: 'Can we migrate from Jira or Linear?',
    a: 'One-click importers preserve issue history, comments, and assignees. Most teams are fully migrated in under a day.',
  },
  {
    q: 'Do you support SSO and SCIM?',
    a: 'SAML SSO and SCIM provisioning are available on the Enterprise plan, alongside audit logs and a dedicated success contact.',
  },
  {
    q: "What's your uptime track record?",
    a: 'Kairo runs on a 99.9% uptime SLA for Enterprise customers, with a public status page and real-time incident updates.',
  },
];

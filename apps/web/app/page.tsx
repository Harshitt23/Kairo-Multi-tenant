'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ease,
  fadeInUp,
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

/** Scroll-triggered rise-in used for the below-the-fold sections. */
const revealUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

function MarketingLanding() {
  const reduce = useReducedMotion();
  const motionProps = reduce ? reducedMotionProps : { variants: fadeInUp };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f7fa]">
      <AuroraBackground />

      <div className="relative z-10">
        <MarketingNav />

        {/* Hero — split layout, product board demo up front */}
        <section
          className="relative overflow-hidden px-6 py-16 sm:py-20 lg:px-14 lg:py-24"
          style={{
            background:
              'radial-gradient(1100px 620px at 12% 8%, rgba(238,240,255,0.55) 0%, rgba(247,247,250,0.35) 55%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
              backgroundSize: '46px 46px',
              maskImage: 'radial-gradient(800px 500px at 20% 10%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(800px 500px at 20% 10%, black, transparent)',
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <motion.div {...motionProps} initial="hidden" animate="show">
              <Badge variant="brand" className="mb-6 whitespace-nowrap px-3 py-1 text-[12.5px]">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-emerald-500" />
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
                  className="group inline-flex h-[52px] items-center gap-2 rounded-xl bg-brand-sheen bg-[length:220%_100%] bg-[position:0%_0%] px-[22px] text-[14.5px] font-semibold text-white shadow-glow transition-[background-position,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:bg-[position:100%_0%] hover:shadow-glow-lg active:translate-y-0 active:scale-[0.97]"
                >
                  Start free
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  href="/#demo"
                  className="inline-flex h-[52px] items-center gap-2.5 rounded-xl border-[1.5px] border-edge bg-white px-5 text-[14.5px] font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-[0_10px_24px_-12px_rgba(99,102,241,0.35)] active:translate-y-0 active:scale-[0.97]"
                >
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  Watch demo
                </Link>
              </div>
              <p className="mt-4 text-[12.5px] text-zinc-400">
                No credit card required · Free for teams up to 10
              </p>
              <div className="mt-9 flex items-center gap-3">
                <div className="flex">
                  {HERO_AVATARS.map((av) => (
                    <span
                      key={av.initials}
                      className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-[2.5px] border-surface text-[10px] font-bold text-white first:ml-0"
                      style={{ background: av.color }}
                    >
                      {av.initials}
                    </span>
                  ))}
                </div>
                <span className="text-[12.5px] font-medium text-zinc-500">
                  Joined by 2,400+ teams this quarter
                </span>
              </div>
            </motion.div>

            <motion.div
              {...(reduce ? reducedMotionProps : { variants: fadeInUp })}
              initial="hidden"
              animate="show"
              transition={{ delay: reduce ? 0 : 0.08 }}
              id="demo"
              className="relative scroll-mt-24"
            >
              <div className="absolute -bottom-6 -left-4 z-20 flex w-[230px] animate-float-toast items-center gap-2.5 rounded-2xl border border-edge bg-white p-3.5 shadow-card">
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-xs font-medium leading-snug text-zinc-700">
                  Wire Stripe metered billing moved to Doing
                </span>
              </div>

              <div className="animate-float-card overflow-hidden rounded-[18px] border border-edge bg-panel shadow-[0_30px_70px_-24px_rgba(16,24,40,0.3)]">
                <div className="flex items-center gap-2 border-b border-edge px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3.5 truncate text-[12.5px] font-medium text-zinc-500">
                    Checkout Revamp — Board
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-panel bg-brand text-[9px] font-bold text-white">
                      JL
                    </span>
                    <span className="-ml-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-panel bg-sky-500 text-[9px] font-bold text-white">
                      MK
                    </span>
                    <span className="ml-1.5 flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-emerald-500">
                      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                      2 online
                    </span>
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
              </div>
            </motion.div>
          </div>
        </section>

        {/* Logo strip */}
        <section className="border-y border-edge bg-white/55 px-6 py-11 text-center backdrop-blur-xl lg:px-14">
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

        {/* Feature grid + testimonial */}
        <section className="bg-[rgba(245,246,248,0.5)] px-6 py-20 backdrop-blur-xl lg:px-14 lg:py-24">
          <motion.div
            id="features"
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="scroll-mt-20"
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
          </motion.div>

          <motion.div
            variants={reduce ? undefined : revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mx-auto mt-24 max-w-2xl text-center"
          >
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
          </motion.div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="scroll-mt-20 bg-white/55 px-6 py-20 backdrop-blur-xl lg:px-14 lg:py-24"
        >
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
          <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqSection />

        <FinalCta />

        <MarketingFooter />
      </div>
    </div>
  );
}

/** Fixed, decorative background: three slow-drifting blurred gradient blobs. */
function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-[10%] -top-[15%] h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] animate-aurora-1 rounded-full blur-[60px]"
        style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.16), transparent 72%)' }}
      />
      <div
        className="absolute -right-[15%] top-[20%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] animate-aurora-2 rounded-full blur-[60px]"
        style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,0.14), transparent 72%)' }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] h-[65vw] w-[65vw] max-h-[850px] max-w-[850px] animate-aurora-3 rounded-full blur-[60px]"
        style={{ background: 'radial-gradient(closest-side, rgba(196,181,253,0.18), transparent 72%)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(247,247,250,0.2) 40%, rgba(247,247,250,0.6) 100%)',
        }}
      />
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
  icon,
}: {
  name: string;
  blurb: string;
  price: string;
  period?: string;
  cta: string;
  features: string[];
  featured?: boolean;
  icon: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }

  const tiltStyle = tilt
    ? {
        transform: `perspective(800px) rotateX(${(-tilt.y * 6).toFixed(2)}deg) rotateY(${(tilt.x * 6).toFixed(
          2,
        )}deg) translateY(-6px)`,
      }
    : undefined;

  return (
    <motion.div
      variants={reduce ? undefined : revealUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      <div
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt(null)}
        style={tiltStyle}
        className={`relative flex h-full flex-col rounded-2xl p-8 transition-transform duration-300 ${
          featured ? 'bg-zinc-900 shadow-card' : 'border border-edge bg-panel'
        }`}
      >
        {featured && (
          <span className="absolute -top-3 left-8 rounded-full bg-brand-sheen px-3 py-1 text-[11.5px] font-bold text-white shadow-glow">
            Most popular
          </span>
        )}
        <div
          className={`mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] ${
            featured ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {icon}
        </div>
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
          className={`mb-7 flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 ${
            featured
              ? 'bg-brand-sheen bg-[length:220%_100%] bg-[position:0%_0%] text-white shadow-glow hover:bg-[position:100%_0%] hover:shadow-glow-lg'
              : 'border border-edge text-zinc-700 hover:border-indigo-400 hover:text-zinc-900'
          }`}
        >
          {cta}
        </Link>
        <ul className={`flex flex-1 flex-col gap-3 text-sm ${featured ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={featured ? '#a5b4fc' : '#6366f1'}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/** Single-open accordion: opening one question closes whichever was open. */
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[rgba(245,246,248,0.5)] px-6 py-20 backdrop-blur-xl lg:px-14">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Questions, answered
        </h2>
        <div className="flex flex-col">
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              question={f.q}
              answer={f.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? undefined : revealUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      className="border-b border-edge"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-zinc-900">{question}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#98a2b3"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <p className="mb-5 max-w-[90%] animate-fade-in text-sm leading-relaxed text-zinc-500">{answer}</p>
      )}
    </motion.div>
  );
}

function FinalCta() {
  const reduce = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  function handleMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  }

  function handleLeave() {
    setMouse({ x: 0, y: 0 });
    setHover(false);
  }

  const glowFactor = 0.4;
  const tiltFactor = hover ? 0.06 : 0;
  const btnFactor = hover ? 0.12 : 0;

  return (
    <section
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={handleLeave}
      className="relative overflow-hidden bg-white/55 px-6 py-24 text-center backdrop-blur-xl lg:px-14"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[640px] rounded-full blur-2xl transition-transform duration-200"
        style={{
          background: 'radial-gradient(closest-side, rgba(99,102,241,0.16), transparent 70%)',
          transform: `translate(calc(-50% + ${(mouse.x * glowFactor).toFixed(1)}px), calc(-50% + ${(
            mouse.y * glowFactor
          ).toFixed(1)}px))`,
        }}
      />
      <motion.div
        variants={
          reduce
            ? undefined
            : {
                hidden: { opacity: 0, y: 40, scale: 0.82 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] } },
              }
        }
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="relative"
      >
        <h2
          style={{ transform: `translate(${(mouse.x * tiltFactor).toFixed(1)}px, ${(mouse.y * tiltFactor).toFixed(1)}px)` }}
          className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 transition-transform duration-200 sm:text-4xl"
        >
          Bring your team into focus.
        </h2>
        <p className="mb-8 text-base text-zinc-500">
          Free for teams up to 10 — no credit card required.
        </p>
        <Link
          href={SIGN_UP_HREF}
          style={{
            transform: `translate(${(mouse.x * btnFactor).toFixed(1)}px, ${(
              mouse.y * btnFactor -
              (hover ? 2 : 0)
            ).toFixed(1)}px)`,
          }}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-sheen bg-[length:220%_100%] bg-[position:0%_0%] px-6 text-[14.5px] font-semibold text-white shadow-glow transition-[background-position,box-shadow] duration-500 hover:bg-[position:100%_0%] hover:shadow-glow-lg"
        >
          Start free
        </Link>
      </motion.div>
    </section>
  );
}

const HERO_AVATARS = [
  { initials: 'JL', color: '#f43f5e' },
  { initials: 'MK', color: '#94a3b8' },
  { initials: 'AS', color: '#334155' },
];

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

const PLANS = [
  {
    name: 'Starter',
    blurb: 'For small teams getting organized.',
    price: '$0',
    period: '/ month',
    cta: 'Start free',
    features: ['Up to 10 members', 'Unlimited issues', '1 workspace', '7-day activity history'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 4.6 4.9.6-3.7 3.4 1 4.8L12 14l-4.1 2.4 1-4.8-3.7-3.4 4.9-.6z" />
      </svg>
    ),
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
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path d="M8.5 12.5l2.3 2.3 4.7-4.7" />
      </svg>
    ),
  },
  {
    name: 'Enterprise',
    blurb: 'For organizations with real scale.',
    price: 'Custom',
    cta: 'Talk to sales',
    features: ['SSO & SCIM provisioning', 'Audit logs', '99.9% uptime SLA', 'Dedicated support'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21V8l8-4 8 4v13" />
        <path d="M9 21v-7h6v7" />
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

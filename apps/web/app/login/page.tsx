'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { cn } from '../../lib/cn';

/* --------------------------------------------------------------------- */
/*  Login / Signup — recreated from the design handoff. A floating white   */
/*  auth card on the left and an animated brand panel on the right.        */
/*  The three handoff "Tweaks" (theme / panelStyle / cardStyle) are real   */
/*  variants: defaults below, overridable via ?theme= / ?panel= / ?card=.  */
/* --------------------------------------------------------------------- */

type Mode = 'login' | 'register';
type ThemeName = 'Indigo Violet' | 'Emerald Teal' | 'Sunset Coral';
type PanelStyle = 'Immersive' | 'Calm';
type CardStyle = 'Floating' | 'Flat';

interface Theme {
  from: string;
  to: string;
  solid: string;
  ring: string;
  shadow: string;
  shadowStrong: string;
  panel: [string, string, string];
  orb1: string;
  orb2: string;
  orb3: string;
  gradientText: string;
}

const THEMES: Record<ThemeName, Theme> = {
  'Indigo Violet': {
    from: '#6366f1',
    to: '#8b5cf6',
    solid: '#6366f1',
    ring: 'rgba(99,102,241,0.12)',
    shadow: 'rgba(99,102,241,0.5)',
    shadowStrong: 'rgba(99,102,241,0.62)',
    panel: ['#4b4fdb', '#6a63d6', '#8a5fcf'],
    orb1: 'rgba(255,255,255,0.16)',
    orb2: 'rgba(216,180,254,0.28)',
    orb3: 'rgba(129,140,248,0.3)',
    gradientText: '#e0d4ff',
  },
  'Emerald Teal': {
    from: '#059669',
    to: '#0d9488',
    solid: '#059669',
    ring: 'rgba(5,150,105,0.14)',
    shadow: 'rgba(5,150,105,0.45)',
    shadowStrong: 'rgba(5,150,105,0.58)',
    panel: ['#047857', '#0d9488', '#0e7490'],
    orb1: 'rgba(255,255,255,0.16)',
    orb2: 'rgba(153,246,228,0.28)',
    orb3: 'rgba(94,234,212,0.28)',
    gradientText: '#c8fbe6',
  },
  'Sunset Coral': {
    from: '#ea580c',
    to: '#db2777',
    solid: '#ea580c',
    ring: 'rgba(234,88,12,0.14)',
    shadow: 'rgba(219,39,119,0.45)',
    shadowStrong: 'rgba(219,39,119,0.58)',
    panel: ['#c2410c', '#dc2626', '#be185d'],
    orb1: 'rgba(255,255,255,0.18)',
    orb2: 'rgba(253,186,116,0.3)',
    orb3: 'rgba(244,114,182,0.3)',
    gradientText: '#ffd9c4',
  },
};

const PHRASES = [
  'Real-time drag-and-drop boards.',
  'Multi-tenant workspaces & RBAC.',
  'Live presence on every board.',
  'Queue-backed notifications.',
  'Stripe billing & an audit trail.',
];

const MARQUEE_LINE =
  'BOARDS · ISSUES · PRESENCE · RBAC · REALTIME · NOTIFICATIONS · BILLING · AUDIT · '.repeat(8);

const EASE = [0.16, 1, 0.3, 1] as const;

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const setAuth = useAuthStore((s) => s.setAuth);
  const reduce = useReducedMotion();

  // Handoff variants — default to the design defaults, overridable via query.
  const theme = THEMES[pick(searchParams.get('theme'), Object.keys(THEMES) as ThemeName[], 'Indigo Violet')];
  const panelStyle = pick<PanelStyle>(searchParams.get('panel'), ['Immersive', 'Calm'], 'Immersive');
  const cardStyle = pick<CardStyle>(searchParams.get('card'), ['Floating', 'Flat'], 'Floating');
  const isCalm = panelStyle === 'Calm';
  const isFlat = cardStyle === 'Flat';

  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('harshit@rolls-royce.com');
  const [password, setPassword] = useState('password123');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setPhraseIndex((i) => (i + 1) % PHRASES.length), 2600);
    return () => clearInterval(t);
  }, [reduce]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const path = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email, password, name, orgName: orgName || undefined }
        : { email, password };
      const res = await api.post<{ accessToken: string; userId?: string }>(path, payload);
      setAuth(res.accessToken, res.userId ?? null);
      // Briefly show the success checkmark before navigating away.
      setSuccess(true);
      setBusy(false);
      setTimeout(() => router.push(next && next.startsWith('/') ? next : '/'), 700);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  const accentVars = {
    '--accent-from': theme.from,
    '--accent-to': theme.to,
    '--accent-solid': theme.solid,
    '--accent-ring': theme.ring,
    '--accent-shadow': theme.shadow,
    '--accent-shadow-strong': theme.shadowStrong,
  } as React.CSSProperties;

  const buttonLabel = busy ? 'Please wait…' : success ? 'Success' : isRegister ? 'Create account' : 'Sign in';

  return (
    <main
      style={{
        ...accentVars,
        background: 'radial-gradient(1200px 800px at 15% 20%, #eef0ff 0%, #f5f6f8 55%)',
      }}
      className="flex min-h-screen w-full"
    >
      {/* Left — form card */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:min-w-[420px] lg:flex-1">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className={cn(
            'w-full max-w-[396px] rounded-3xl bg-white px-9 py-10',
            isFlat
              ? 'border-[1.5px] border-[#e5e7ec]'
              : 'shadow-[0_20px_60px_-20px_rgba(16,24,40,0.18),0_0_0_1px_rgba(255,255,255,0.6)_inset] motion-safe:animate-card-glow',
          )}
        >
          {/* Header: logo + wordmark */}
          <div className="mb-7 flex flex-col items-start">
            <div className="flex items-center gap-[11px]">
              <span
                style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] shadow-[0_10px_26px_-8px_var(--accent-shadow)]"
              >
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="10" rx="1.5" fill="white" fillOpacity="0.95" />
                  <rect x="3" y="15" width="7" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
                  <rect x="14" y="3" width="7" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
                  <rect x="14" y="11" width="7" height="10" rx="1.5" fill="white" fillOpacity="0.95" />
                </svg>
              </span>
              <span className="text-[15px] font-extrabold tracking-[-0.03em] text-[#101828]">
                PM SaaS
              </span>
            </div>

            {/* Segmented tab control */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mt-[22px] flex w-full items-center gap-1 rounded-[11px] bg-[#f2f3f7] p-1"
            >
              <TabButton active={!isRegister} onClick={() => switchMode('login')}>
                Sign in
              </TabButton>
              <TabButton active={isRegister} onClick={() => switchMode('register')}>
                Create account
              </TabButton>
            </div>

            <motion.h1
              key={mode}
              initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-5 text-[20px] font-bold tracking-[-0.02em] text-[#101828]"
            >
              {isRegister ? 'Create your account' : 'Sign in'}
            </motion.h1>
            <motion.p
              key={`${mode}-sub`}
              initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-1.5 text-[13.5px] text-[#667085]"
            >
              {isRegister ? 'Start managing projects in minutes' : 'Sign in to your workspace to continue'}
            </motion.p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {isRegister && (
                <Field
                  key="name"
                  reduce={reduce}
                  icon={<IconPerson />}
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </AnimatePresence>

            <Field
              icon={<IconEnvelope />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Field
              icon={<IconLock />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              paddingRight
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1.5 text-[#98a2b3] transition-colors hover:bg-[#f2f3f5] hover:text-[#667085]"
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              }
            />

            <AnimatePresence initial={false}>
              {isRegister && (
                <Field
                  key="org"
                  reduce={reduce}
                  delay={0.05}
                  icon={<IconBuilding />}
                  placeholder="Organization name (optional)"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={reduce ? false : { x: 0 }}
                animate={reduce ? {} : { x: [0, -6, 6, 0] }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="m-0 rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] text-[#b91c1c]"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
              }}
              className={cn(
                'mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl py-[14px] text-[14.5px] font-semibold tracking-[-0.01em] text-white',
                '[background-size:180%_180%] [background-position:0%_50%] hover:[background-position:100%_50%]',
                'shadow-[0_12px_28px_-8px_var(--accent-shadow)] hover:shadow-[0_14px_32px_-6px_var(--accent-shadow-strong)]',
                'transition-[background-position,box-shadow,transform] duration-[400ms] ease-out',
                'hover:-translate-y-px active:scale-[0.985] disabled:cursor-not-allowed',
              )}
            >
              {busy && (
                <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {success && (
                <motion.svg
                  initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
              <span className="whitespace-nowrap">{buttonLabel}</span>
              {!busy && !success && (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="ml-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#98a2b3]">
            Demo login · harshit@rolls-royce.com / password123
          </p>
        </motion.div>
      </div>

      {/* Right — animated brand panel (hidden below lg) */}
      <div
        style={{
          background: `linear-gradient(160deg, ${theme.panel[0]} 0%, ${theme.panel[1]} 55%, ${theme.panel[2]} 100%)`,
        }}
        className="relative hidden overflow-hidden lg:flex lg:min-w-[420px] lg:flex-1"
      >
        {/* Grid overlay (immersive only) */}
        {!isCalm && (
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] motion-safe:animate-grid-drift" />
        )}

        {/* Floating orbs */}
        <Orb
          reduce={reduce}
          calm={isCalm}
          color={theme.orb1}
          className="-left-[100px] top-[15%] h-[340px] w-[340px] blur-[75px]"
          keyframes={{ x: [0, 50, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          duration={isCalm ? 26 : 15}
        />
        {!isCalm && (
          <>
            <Orb
              reduce={reduce}
              calm={isCalm}
              color={theme.orb2}
              className="-right-[70px] bottom-[5%] h-[400px] w-[400px] blur-[80px]"
              keyframes={{ x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.25, 1] }}
              duration={19}
            />
            <Orb
              reduce={reduce}
              calm={isCalm}
              color={theme.orb3}
              className="right-[15%] top-[8%] h-[220px] w-[220px] blur-[65px]"
              keyframes={{ x: [0, 30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
              duration={12}
            />
          </>
        )}

        {/* Drifting keyword marquee */}
        {!isCalm && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-9 overflow-hidden opacity-[0.08]">
            {[36, 44, 52].map((dur, i) => (
              <Marquee key={dur} reduce={reduce} duration={dur} reverse={i === 1} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-[1] flex w-full flex-col justify-between p-[52px] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[9px] text-[14px] font-semibold tracking-[-0.01em]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              PM SaaS
            </div>
            {!isCalm && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/12 px-[11px] py-1.5 text-[12px] text-white/75 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] motion-safe:animate-pulse-dot" />
                247 teams online
              </div>
            )}
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          >
            <h2 className="m-0 max-w-[440px] text-[44px] font-extrabold leading-[1.12] tracking-[-0.025em]">
              Ship work,
              <br />
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, #ffffff 0%, ${theme.gradientText} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  textShadow: '0 2px 24px rgba(255,255,255,0.35)',
                }}
              >
                together.
              </span>
            </h2>

            {/* Rotating one-line feature copy */}
            <div className="relative mt-3.5 h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phraseIndex}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute inset-x-0 text-[15px] font-medium text-white/90"
                >
                  {PHRASES[phraseIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            <p className="mt-4 max-w-[380px] text-[15px] leading-[1.65] text-white/[0.78]">
              Multi-tenant boards, real-time drag-and-drop, live presence, and notifications — your
              whole team on one calm, fast surface.
            </p>

            {!isCalm && (
              <div className="mt-9 flex gap-7">
                <Stat value="4.5k+" label="Boards shipped" />
                <span className="w-px bg-white/20" />
                <Stat value="98.98%" label="Uptime" />
                <span className="w-px bg-white/20" />
                <Stat value="4.9/5" label="Team rating" />
              </div>
            )}
          </motion.div>

          <p className="m-0 text-[12px] text-white/55">Linear/Jira-lite · built for teams</p>
        </div>
      </div>
    </main>
  );

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setSuccess(false);
  }
}

/* --------------------------------- parts -------------------------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg py-[9px] text-[13.5px] font-semibold transition-[background,color,box-shadow] duration-[250ms]',
        active
          ? 'bg-white text-[#101828] shadow-[0_2px_8px_rgba(16,24,40,0.12)]'
          : 'bg-transparent text-[#667085]',
      )}
    >
      {children}
    </button>
  );
}

const INPUT_CLASS =
  'w-full rounded-[11px] border-[1.5px] border-[#e5e7ec] bg-[#fafafc] py-3 text-[14px] text-[#101828] outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-[#98a2b3] focus:border-[color:var(--accent-solid)] focus:bg-white focus:shadow-[0_0_0_4px_var(--accent-ring)]';

function Field({
  icon,
  trailing,
  paddingRight,
  reduce,
  delay = 0,
  ...inputProps
}: {
  icon: ReactNode;
  trailing?: ReactNode;
  paddingRight?: boolean;
  reduce?: boolean | null;
  delay?: number;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className="relative"
    >
      <span className="pointer-events-none absolute left-[13px] top-1/2 flex -translate-y-1/2 text-[#98a2b3]">
        {icon}
      </span>
      <input className={cn(INPUT_CLASS, paddingRight ? 'pl-[38px] pr-[42px]' : 'pl-[38px] pr-3.5')} {...inputProps} />
      {trailing}
    </motion.div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[26px] font-extrabold tracking-[-0.02em]">{value}</div>
      <div className="mt-0.5 text-[12.5px] text-white/70">{label}</div>
    </div>
  );
}

function Orb({
  color,
  className,
  keyframes,
  duration,
  reduce,
}: {
  color: string;
  className: string;
  keyframes: { x: number[]; y: number[]; scale: number[] };
  duration: number;
  calm: boolean;
  reduce?: boolean | null;
}) {
  return (
    <motion.div
      style={{ background: color }}
      className={cn('absolute rounded-full', className)}
      animate={reduce ? undefined : keyframes}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function Marquee({
  reduce,
  duration,
  reverse,
}: {
  reduce?: boolean | null;
  duration: number;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="whitespace-nowrap text-[64px] font-extrabold uppercase tracking-[-0.03em] text-white"
      animate={reduce ? undefined : { x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {MARQUEE_LINE}
    </motion.div>
  );
}

/* --------------------------------- icons -------------------------------- */

function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconEnvelope() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="m3 6.5 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V7l9-4 9 4v14" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  );
}

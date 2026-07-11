'use client';

import { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Logo } from '../../components/brand';

const inputClass =
  'w-full rounded-lg border border-edge bg-panel px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-500';

type Mode = 'login' | 'register';

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
  // Allow deep-linking straight into sign-up (e.g. the landing "Start free" CTAs).
  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const [form, setForm] = useState({ email: 'harshit@rolls-royce.com', password: 'password123', name: '', orgName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { email: form.email, password: form.password, name: form.name, orgName: form.orgName || undefined };
      const res = await api.post<{ accessToken: string; userId?: string }>(path, payload);
      setAuth(res.accessToken, res.userId ?? null);
      router.push(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo size={44} />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              {mode === 'login' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {mode === 'login'
                ? 'Sign in to your workspace to continue'
                : 'Start managing projects in minutes'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                className={inputClass}
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            )}
            <input
              className={inputClass}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className={inputClass}
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {mode === 'register' && (
              <input
                className={inputClass}
                placeholder="Organization name (optional)"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            )}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 border-t border-edge pt-4 text-center lg:text-left">
            <button
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-800"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? (
                <>
                  Need an account? <span className="font-medium text-indigo-600">Register</span>
                </>
              ) : (
                <>
                  Have an account? <span className="font-medium text-indigo-600">Sign in</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500 lg:text-left">
            Demo login · harshit@rolls-royce.com / password123
          </p>
        </motion.div>
      </div>

      {/* Right — animated gradient panel (hidden on small screens) */}
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        {/* floating blurred orbs */}
        <motion.div
          className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-white/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* drifting keyword marquee */}
        <BackgroundMarquee />

        {/* content */}
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/20 backdrop-blur">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            PM SaaS
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Ship work, together.
            </h2>
            <RotatingText />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">
              Multi-tenant boards, real-time drag-and-drop, live presence, and notifications —
              your whole team on one calm, fast surface.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/90">
              {['Real-time drag-and-drop boards', 'Workspaces, teams & role-based access', 'Live presence, inbox & audit trail'].map(
                (item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-2.5"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 + i * 0.1 }}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </motion.li>
                ),
              )}
            </ul>
          </motion.div>

          <p className="text-xs text-white/60">Linear/Jira-lite · built for teams</p>
        </div>
      </div>
    </main>
  );
}

const PHRASES = [
  'Real-time drag-and-drop boards.',
  'Multi-tenant workspaces & RBAC.',
  'Live presence on every board.',
  'Queue-backed notifications.',
  'Stripe billing & an audit trail.',
];

/** Cycles through one-line descriptions of what the app does. */
function RotatingText() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PHRASES.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative mt-3 block h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          className="absolute inset-x-0 text-[15px] font-medium text-white/90"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {PHRASES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Big, faint keywords drifting across the panel behind the content. */
function BackgroundMarquee() {
  const line = 'BOARDS · ISSUES · PRESENCE · RBAC · REALTIME · NOTIFICATIONS · BILLING · AUDIT · '.repeat(4);
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-8 overflow-hidden opacity-[0.06]">
      {[0, 1, 2].map((row) => (
        <motion.div
          key={row}
          className="whitespace-nowrap text-6xl font-black uppercase tracking-tighter text-white"
          animate={{ x: row % 2 === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
          transition={{ duration: 34 + row * 8, repeat: Infinity, ease: 'linear' }}
        >
          {line + line}
        </motion.div>
      ))}
    </div>
  );
}

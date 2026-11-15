'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { cn } from '../../lib/cn';
import { Logo } from '../../components/brand';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';

/* --------------------------------------------------------------------- */
/*  Login / Signup — a single quiet card. No orbs, no marquees, no        */
/*  invented statistics; the form is the whole page.                      */
/* --------------------------------------------------------------------- */

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
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const path = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email, password, name, orgName: orgName || undefined }
        : { email, password };
      const res = await api.post<{ accessToken: string; userId?: string }>(path, payload);
      setAuth(res.accessToken, res.userId ?? null);
      router.push(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[360px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={28} />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Kairo</span>
        </Link>

        <div className="rounded-lg border border-edge bg-panel p-6">
          {/* Mode tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-6 flex items-center gap-1 rounded-md bg-elevated p-1"
          >
            <TabButton active={!isRegister} onClick={() => switchMode('login')}>
              Sign in
            </TabButton>
            <TabButton active={isRegister} onClick={() => switchMode('register')}>
              Create account
            </TabButton>
          </div>

          <h1 className="mb-1 text-[17px] font-semibold tracking-tight text-ink">
            {isRegister ? 'Create account' : 'Sign in'}
          </h1>
          <p className="mb-5 text-[13px] text-muted">
            {isRegister
              ? 'Set up your account and first workspace.'
              : 'Sign in to your workspace to continue.'}
          </p>

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            {isRegister && (
              <Field label="Full name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email">
              <Input
                type="email"
                data-testid="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  data-testid="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1.5 text-faint transition-colors hover:bg-elevated hover:text-muted"
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </Field>

            {isRegister && (
              <Field label="Organization" hint="Optional — you can create one later.">
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc"
                  autoComplete="organization"
                />
              </Field>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-[13px] text-red-700 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={busy} className="mt-1 w-full">
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] text-faint">
          Demo login · harshit@rolls-royce.com / password123
        </p>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 rounded py-1.5 text-[13px] font-medium transition-colors',
        active ? 'bg-panel text-ink shadow-card' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  );
}

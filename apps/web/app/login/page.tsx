'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { Logo } from '../../components/brand';

const inputClass =
  'w-full rounded-lg border border-edge bg-elevated px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-indigo-500';

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
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ email: 'owner@acme.test', password: 'password123', name: '', orgName: '' });
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
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
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

        <div className="rounded-2xl border border-edge bg-panel p-6 shadow-card">
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
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 border-t border-edge pt-4 text-center">
            <button
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? (
                <>
                  Need an account? <span className="text-indigo-400">Register</span>
                </>
              ) : (
                <>
                  Have an account? <span className="text-indigo-400">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-600">
          Demo login · owner@acme.test / password123
        </p>
      </div>
    </main>
  );
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { api } from './api';
import { useAuthStore } from './auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  const setAuth = useAuthStore((s) => s.setAuth);
  const [ready, setReady] = useState(false);

  // Silent session restore on first load via the refresh cookie.
  useEffect(() => {
    api
      .post<{ accessToken: string }>('/auth/refresh')
      .then((res) => setAuth(res.accessToken))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [setAuth]);

  return (
    <QueryClientProvider client={client}>
      {ready ? children : <SplashScreen />}
      <Toaster
        theme="light"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #e2e5ea',
            color: '#101828',
            boxShadow: '0 8px 24px -8px rgba(16,24,40,0.18)',
          },
        }}
      />
    </QueryClientProvider>
  );
}

/** Brand splash shown while the session is silently restored. */
function SplashScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-brand shadow-glow" />
        <span className="text-sm text-zinc-600">Loading workspace…</span>
      </div>
    </div>
  );
}

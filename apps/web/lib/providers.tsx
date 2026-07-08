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
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#141519',
            border: '1px solid #23262e',
            color: '#e4e4e7',
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

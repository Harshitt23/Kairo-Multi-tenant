'use client';

import { useRouter } from 'next/navigation';
import { api } from './api';
import { useAuthStore } from './auth-store';

/** Revoke the refresh cookie server-side, clear local auth, go to /login. */
export function useSignOut() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  return async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      /* ignore — clear locally regardless */
    }
    clear();
    router.push('/login');
  };
}

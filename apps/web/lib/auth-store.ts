import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  setAuth: (token: string, userId?: string | null) => void;
  clear: () => void;
}

// Access token lives in memory only (XSS-safer than localStorage). The refresh
// token is an httpOnly cookie the browser sends to /auth automatically, so a
// full reload re-hydrates the session via POST /auth/refresh.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  setAuth: (accessToken, userId = null) => set({ accessToken, userId }),
  clear: () => set({ accessToken: null, userId: null }),
}));

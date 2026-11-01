'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '@/lib/api/client';
import { userApi } from '@/lib/api/endpoints';
import { STORAGE_KEYS } from '@/lib/config';
import type { LoginResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  /** false sampai sesi dari localStorage selesai dibaca (hindari redirect prematur). */
  ready: boolean;
  login: (res: LoginResponse) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setAuthToken(null);
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    setUserState(u);
  }, []);

  const login = useCallback(
    (res: LoginResponse) => {
      localStorage.setItem(STORAGE_KEYS.token, res.token);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    },
    [setUser],
  );

  // Pulihkan sesi saat halaman dibuka, lalu segarkan profil dari server.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    const saved = localStorage.getItem(STORAGE_KEYS.token);
    if (saved) {
      setAuthToken(saved);
      setToken(saved);
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.user);
        if (cached) setUserState(JSON.parse(cached) as User);
      } catch {
        /* cache rusak: abaikan */
      }
      userApi
        .getProfile()
        .then(({ user: u }) => setUser(u))
        .catch(() => {
          /* 401 ditangani onUnauthorized; error jaringan: tetap pakai cache */
        });
    }
    setReady(true);
    return () => setUnauthorizedHandler(null);
  }, [logout, setUser]);

  const value = useMemo(() => ({ user, token, ready, login, logout, setUser }), [user, token, ready, login, logout, setUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';
import { adminApi, adminClient, type AdminMe } from '@/lib/api/admin';
import { STORAGE_KEYS } from '@/lib/config';
import type { LoginResponse } from '@/lib/types';

interface AdminSession {
  admin: AdminMe | null;
  /** false sampai sesi tersimpan selesai diperiksa ke backend. */
  ready: boolean;
  login: (res: LoginResponse) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AdminSession | null>(null);

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.adminToken);
  } catch {
    return null;
  }
};
const write = (token: string | null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEYS.adminToken, token);
    else localStorage.removeItem(STORAGE_KEYS.adminToken);
  } catch {
    /* penyimpanan diblokir: sesi hanya bertahan sampai tab ditutup */
  }
};

/**
 * Sesi Admin Pusat, terpisah dari sesi penumpang (kunci localStorage & klien API sendiri).
 * Token baru dianggap sah setelah GET /api/admin/me berhasil: backend memeriksa role admin di database.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    write(null);
    adminClient.setToken(null);
    setAdmin(null);
  }, []);

  const login = useCallback(async (res: LoginResponse) => {
    adminClient.setToken(res.token);
    try {
      setAdmin(await adminApi.me());
      write(res.token);
    } catch (e) {
      adminClient.setToken(null);
      throw e;
    }
  }, []);

  useEffect(() => {
    adminClient.setUnauthorizedHandler(logout);
    const saved = read();
    if (!saved) {
      setReady(true);
      return () => adminClient.setUnauthorizedHandler(null);
    }
    adminClient.setToken(saved);
    adminApi
      .me()
      .then(setAdmin)
      .catch((e) => {
        // 401 sudah ditangani onUnauthorized; 403 = peran admin dicabut
        if (e instanceof ApiError && e.status === 403) logout();
      })
      .finally(() => setReady(true));
    return () => adminClient.setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(() => ({ admin, ready, login, logout }), [admin, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminSession harus dipakai di dalam <AdminSessionProvider>');
  return ctx;
}

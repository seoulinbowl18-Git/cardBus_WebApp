'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

/** Bungkus halaman yang butuh login; arahkan ke /masuk?next=... jika belum masuk. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !token) router.replace(`/masuk?next=${encodeURIComponent(pathname)}`);
  }, [ready, token, router, pathname]);

  if (!ready || !token) return <p className="py-10 text-center text-slate-500">Memuat…</p>;
  return <>{children}</>;
}

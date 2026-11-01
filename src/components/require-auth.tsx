'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

/** Bungkus halaman yang butuh login; arahkan ke /masuk?next=... jika belum masuk. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sertakan query (mis. /checkout?tripId=..) agar kembali ke halaman yang sama setelah login
    if (ready && !token) router.replace(`/masuk?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [ready, token, router]);

  if (!ready || !token) return <p className="py-10 text-center text-slate-500">Memuat…</p>;
  return <>{children}</>;
}

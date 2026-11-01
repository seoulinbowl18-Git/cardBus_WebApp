'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export function SiteHeader() {
  const { user, ready, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold text-brand">
          card<span className="text-slate-900">Bus</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/pesanan" className="hover:text-brand">Tiket Saya</Link>
          {ready && user ? (
            <>
              <Link href="/akun" className="hover:text-brand">{user.name || 'Akun'}</Link>
              <button onClick={logout} className="text-slate-500 hover:text-red-600">Keluar</button>
            </>
          ) : (
            <Link href="/masuk" className="rounded-lg bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">Masuk</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

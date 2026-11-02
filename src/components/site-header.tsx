'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export function SiteHeader() {
  const { user, ready, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="CardBus - Beranda" className="shrink-0">
          <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} priority className="h-6 w-auto min-[400px]:h-7 sm:h-9" />
        </Link>
        <div className="flex min-w-0 items-center gap-3 whitespace-nowrap text-sm font-medium sm:gap-4">
          <Link href="/pesanan" className="hover:text-brand">Tiket Saya</Link>
          {ready && user ? (
            <>
              <Link href="/akun" className="max-w-24 truncate hover:text-brand sm:max-w-48">{user.name || 'Akun'}</Link>
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

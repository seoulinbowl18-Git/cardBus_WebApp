'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useUi } from '@/providers/ui-provider';

export function SiteHeader() {
  const { user, ready } = useAuth();
  const { openCsHelp, confirmLogout } = useUi();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="CardBus - Beranda" className="shrink-0">
          <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} priority className="h-7 w-auto sm:h-9" />
        </Link>
        <div className="flex min-w-0 items-center gap-3 whitespace-nowrap text-sm font-medium sm:gap-4">
          {/* Di HP menu utama ada di bawah (BottomNav); di layar lebar tampil di sini. */}
          <button onClick={openCsHelp} className="font-semibold text-brand hover:underline">Bantuan</button>
          <Link href="/pesanan" className="hidden hover:text-brand sm:inline">Tiket Saya</Link>
          <Link href="/promo" className="hidden hover:text-brand sm:inline">Promo</Link>
          {ready && user ? (
            <>
              <Link href="/akun" className="hidden max-w-48 truncate hover:text-brand sm:inline">{user.name || 'Akun'}</Link>
              <button onClick={confirmLogout} className="hidden text-slate-500 hover:text-red-600 sm:inline">Keluar</button>
            </>
          ) : (
            <Link href="/masuk" className="rounded-lg bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">Masuk</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

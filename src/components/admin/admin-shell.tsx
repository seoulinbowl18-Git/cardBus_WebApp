'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { useAdminSession } from '@/providers/admin-session';

const NAV = [
  { href: '/admin', label: 'Ringkasan', match: (p: string) => p === '/admin' },
  { href: '/admin/jadwal', label: 'Jadwal, Rute & Harga', match: (p: string) => p.startsWith('/admin/jadwal') },
  { href: '/admin/manifest', label: 'Manifest Penumpang', match: (p: string) => p.startsWith('/admin/manifest') },
  { href: '/admin/po', label: 'Mitra PO', match: (p: string) => p.startsWith('/admin/po') },
  { href: '/admin/unggulan', label: 'Produk Unggulan', match: (p: string) => p.startsWith('/admin/unggulan') },
  { href: '/admin/promo', label: 'Promo & Info', match: (p: string) => p.startsWith('/admin/promo') },
  { href: '/admin/ulasan', label: 'Ulasan & Rating', match: (p: string) => p.startsWith('/admin/ulasan') },
];

/**
 * Kerangka panel Admin Pusat: header & navigasi sendiri (tanpa menu penumpang).
 * Halaman selain /admin/masuk hanya tampil untuk admin yang sesinya sudah diperiksa backend.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, ready, logout } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/masuk';

  useEffect(() => {
    if (!isLogin && ready && !admin) router.replace(`/admin/masuk?next=${encodeURIComponent(pathname)}`);
  }, [isLogin, ready, admin, router, pathname]);

  if (isLogin) return <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>;
  if (!ready || !admin) return <p className="py-16 text-center text-muted">Memeriksa sesi admin…</p>;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} priority className="h-6 w-auto" />
            <span className="rounded-md bg-brand-dark px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">Admin Pusat</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{admin.name || admin.phone}</span>
            <button
              onClick={() => {
                logout();
                router.replace('/admin/masuk');
              }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold text-ink hover:bg-teal-soft hover:text-brand"
            >
              <Icon name="logout" className="h-[18px] w-[18px]" />
              Keluar
            </button>
          </div>
        </div>
        <nav aria-label="Menu Admin Pusat" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {NAV.map((n) => {
            const on = n.match(pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-bold ${on ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
    </>
  );
}

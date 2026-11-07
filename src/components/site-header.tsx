'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/icons';
import { useAuth } from '@/providers/auth-provider';
import { useUi } from '@/providers/ui-provider';

/**
 * Header: logo, Bantuan / Tiket Saya / Promo (dengan ikon), dan ikon profil.
 * Keluar akun lewat halaman Akun (ikon profil). Di HP, Tiket Saya / Promo / Akun ada di menu bawah.
 */
export function SiteHeader() {
  const { user, ready } = useAuth();
  const { openCsHelp } = useUi();
  const pathname = usePathname();
  const navCls = (on: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-teal-soft hover:text-brand ${on ? 'text-brand' : 'text-ink'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="CardBus - Beranda" className="shrink-0">
          <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} priority className="h-6 w-auto sm:h-8" />
        </Link>
        <div className="flex min-w-0 items-center gap-1 whitespace-nowrap text-sm font-medium sm:gap-2">
          <button onClick={openCsHelp} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold text-brand transition hover:bg-teal-soft">
            <Icon name="support" className="h-[18px] w-[18px]" />
            Bantuan
          </button>
          <NavLink href="/pesanan" icon="ticket" label="Tiket Saya" on={pathname.startsWith('/pesanan')} cls={navCls} />
          <NavLink href="/promo" icon="gift" label="Promo" on={pathname.startsWith('/promo')} cls={navCls} />
          {ready && user ? (
            <Link
              href="/akun"
              aria-label={`Akun ${user.name || ''}`.trim()}
              title={user.name || 'Akun'}
              className={`ml-1 hidden shrink-0 rounded-full transition hover:ring-4 hover:ring-teal-soft sm:block ${pathname.startsWith('/akun') ? 'ring-2 ring-brand ring-offset-2' : ''}`}
            >
              <Avatar name={user.name} photo={user.photoUrl} />
            </Link>
          ) : (
            <Link href="/masuk" className="ml-1 rounded-lg bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">Masuk</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, icon, label, on, cls }: { href: string; icon: IconName; label: string; on: boolean; cls: (on: boolean) => string }) {
  return (
    <Link href={href} aria-current={on ? 'page' : undefined} className={`${cls(on)} hidden sm:flex`}>
      <Icon name={icon} className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}

/** Foto profil, atau inisial nama, atau ikon orang. */
function Avatar({ name, photo }: { name: string | null; photo: string | null }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL / foto Google
    return <img src={photo} alt="" className="h-9 w-9 rounded-full border border-line object-cover" />;
  }
  const initial = name?.trim()?.[0]?.toUpperCase();
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">
      {initial ?? <Icon name="person" className="h-5 w-5" />}
    </span>
  );
}

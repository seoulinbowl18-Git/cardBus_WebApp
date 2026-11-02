'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icons';

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: '/', label: 'Beranda', icon: 'home', match: (p) => p === '/' || p.startsWith('/cari') },
  { href: '/pesanan', label: 'Tiket Saya', icon: 'ticket', match: (p) => p.startsWith('/pesanan') },
  { href: '/promo', label: 'Promo', icon: 'gift', match: (p) => p.startsWith('/promo') },
  {
    href: '/akun',
    label: 'Akun',
    icon: 'person',
    match: (p) => p.startsWith('/akun') || p.startsWith('/masuk') || p.startsWith('/syarat') || p.startsWith('/kebijakan'),
  },
];

/** Menu bawah khusus HP, sama dengan CardBusBottomNav di aplikasi mobile. */
export function BottomNav() {
  const pathname = usePathname();
  // Saat checkout, tombol bayar lebih penting daripada menu.
  if (pathname.startsWith('/checkout')) return null;
  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-bold ${on ? 'text-brand' : 'text-faint'}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${on ? 'bg-teal-soft' : ''}`}>
                  <Icon name={t.icon} className="h-[22px] w-[22px]" strokeWidth={on ? 2.4 : 2} />
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

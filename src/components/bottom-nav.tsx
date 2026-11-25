'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: { href: string; label: string; icon: string; match: (p: string) => boolean }[] = [
  { href: '/', label: 'Beranda', icon: '/icons/navigation/home_3d.png', match: (p) => p === '/' || p.startsWith('/cari') },
  { href: '/pesanan', label: 'Tiket Saya', icon: '/icons/navigation/ticket_3d.png', match: (p) => p.startsWith('/pesanan') },
  { href: '/promo', label: 'Promo', icon: '/icons/navigation/promo_3d.png', match: (p) => p.startsWith('/promo') },
  {
    href: '/akun',
    label: 'Akun',
    icon: '/icons/navigation/account_3d.png',
    match: (p) => p.startsWith('/akun') || p.startsWith('/masuk') || p.startsWith('/syarat') || p.startsWith('/kebijakan'),
  },
];

/**
 * Menu bawah khusus HP, sama dengan CardBusBottomNav di aplikasi mobile. Ikon 3D berwarna (tetap berwarna
 * saat tidak aktif); tab aktif: ikon lebih besar + memantul ringan, label teal, dan garis teal di bawah.
 */
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
        {TABS.map((t, i) => {
          const on = t.match(pathname);
          return (
            <li key={t.href} className="relative">
              {i > 0 && <span className="absolute left-0 top-1/2 h-7 w-px -translate-y-1/2 bg-line" aria-hidden />}
              <Link
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`group relative flex flex-col items-center pb-2 pt-1.5 text-[11px] font-bold transition-colors duration-200 focus-visible:outline-none ${
                  on ? 'text-brand' : 'text-[#89999a]'
                }`}
              >
                <span className="grid h-11 w-12 place-items-center transition-transform duration-200 ease-out group-active:scale-90">
                  {/* key berganti saat aktif → animasi pantul diputar ulang */}
                  <span key={on ? 'on' : 'off'} className={`block transition-[width,height] duration-200 ease-out ${on ? 'nav-pop h-[42px] w-[42px]' : 'h-9 w-9'}`}>
                    <Image src={t.icon} alt="" width={42} height={42} sizes="42px" className="h-full w-full object-contain drop-shadow-[0_2px_3px_rgba(4,46,49,0.18)]" />
                  </span>
                </span>
                <span className="mt-0.5 leading-none group-focus-visible:underline">{t.label}</span>
                <span
                  className={`mt-1.5 h-[3px] rounded-full bg-brand transition-all duration-200 ease-out ${on ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

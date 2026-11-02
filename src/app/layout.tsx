import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { BottomNav } from '@/components/bottom-nav';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/providers/auth-provider';
import { UiProvider } from '@/providers/ui-provider';
import './globals.css';

// Font yang sama dengan aplikasi mobile (google_fonts: Plus Jakarta Sans)
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: { default: 'CardBus - Tiket Bus, Lebih Mudah', template: '%s | CardBus' },
  description: 'Pesan tiket bus antarkota secara online. Bayar dengan QRIS atau Virtual Account.',
};

export const viewport: Viewport = { themeColor: '#087f78' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <AuthProvider>
          <UiProvider>
            <SiteHeader />
            {/* pb-28 di HP: ruang untuk menu bawah */}
            <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-12">{children}</main>
            <BottomNav />
          </UiProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/providers/auth-provider';
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
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

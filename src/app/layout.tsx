import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import './globals.css';

// Font yang sama dengan aplikasi mobile (google_fonts: Plus Jakarta Sans)
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: { default: 'CardBus - Tiket Bus, Lebih Mudah', template: '%s | CardBus' },
  description: 'Pesan tiket bus antarkota secara online. Bayar dengan QRIS atau Virtual Account.',
  applicationName: 'CardBus',
  // Manifest PWA: app/manifest.ts (/manifest.webmanifest). Ikon tab & Apple: app/icon.png, app/apple-icon.png.
  appleWebApp: { capable: true, title: 'CardBus', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#087f78' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      {/* Tampilan penumpang ada di app/(public)/layout.tsx, panel pemilik di app/admin/layout.tsx */}
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

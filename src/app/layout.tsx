import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
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
      {/* Tampilan penumpang ada di app/(public)/layout.tsx, panel pemilik di app/admin/layout.tsx */}
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import { RetryButton } from './retry-button';

export const metadata: Metadata = {
  title: 'Tidak ada koneksi',
  robots: { index: false, follow: false },
};

/**
 * Halaman fallback offline. Disimpan service worker (public/sw.js) saat dipasang dan ditampilkan
 * ketika navigasi gagal karena tidak ada jaringan. Sengaja di luar (public)/ agar tidak memuat
 * sesi/API: halaman ini harus tampil tanpa backend sama sekali.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      {/* unoptimized: dimuat langsung dari /brand (sudah ada di cache SW), bukan lewat /_next/image */}
      <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} unoptimized priority className="h-8 w-auto" />
      <div className="mt-10 grid h-20 w-20 place-items-center rounded-full bg-teal-soft text-brand" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10 5.1M5 12.5a10 10 0 0 1 4-2.2M19 12.5a10 10 0 0 0-1.6-1.2M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" />
        </svg>
      </div>
      <h1 className="mt-6 text-xl font-extrabold text-ink">Kamu sedang offline</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Koneksi internet terputus. Jadwal, kursi, pembayaran, dan status tiket selalu diambil langsung dari server
        agar datanya akurat, jadi halaman ini perlu koneksi.
      </p>
      <RetryButton />
      <p className="mt-6 text-xs text-faint">Halaman akan dimuat ulang otomatis saat koneksi kembali.</p>
    </main>
  );
}

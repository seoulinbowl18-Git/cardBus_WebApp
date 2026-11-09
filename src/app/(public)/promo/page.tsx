import type { Metadata } from 'next';
import { PromoRow } from '@/components/home/home-sections';
import { loadBanners } from '@/lib/banners';

export const metadata: Metadata = { title: 'Promo & Info' };

// Banner dikelola di Admin Pusat → Promo & Info: halaman diperbarui paling lama tiap 30 detik.
export const revalidate = 30;

/** Padanan PromoScreen mobile: semua banner promo dalam satu halaman. */
export default async function PromoPage() {
  const { top, special } = await loadBanners();
  const all = [...top, ...special];
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Promo & Info</h1>
      <p className="text-muted">Promo rute dan kabar terbaru dari PO mitra CardBus.</p>
      {all.length ? <PromoRow promos={all} tall stacked /> : <p className="py-10 text-center text-muted">Belum ada promo saat ini.</p>}
    </section>
  );
}

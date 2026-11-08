import type { Metadata } from 'next';
import { PromoRow } from '@/components/home/home-sections';
import { SPECIAL_PROMOS, TOP_PROMOS } from '@/lib/home-content';

export const metadata: Metadata = { title: 'Promo & Info' };

/** Padanan PromoScreen mobile: semua banner promo dalam satu halaman. */
export default function PromoPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Promo & Info</h1>
      <p className="text-muted">Promo rute dan kabar terbaru dari PO mitra CardBus.</p>
      <PromoRow promos={[...TOP_PROMOS, ...SPECIAL_PROMOS]} tall stacked />
    </section>
  );
}

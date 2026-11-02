import Link from 'next/link';
import { FeaturedGrid, FeatureStrip, Greeting, PromoRow, SectionTitle } from '@/components/home/home-sections';
import { SearchCard } from '@/components/home/search-card';
import { FEATURED, SPECIAL_PROMOS, TOP_PROMOS } from '@/lib/home-content';

/**
 * Beranda, mengikuti HomeScreen di aplikasi mobile: header teal melengkung + sapaan,
 * kartu cari, Promo & Info, Produk unggulan, Promo spesial, dan keunggulan CardBus.
 */
export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="relative -mx-4 -mt-8 overflow-hidden rounded-b-[28px] bg-[linear-gradient(135deg,#0a8c84_0%,#087f78_35%,#064e52_100%)] px-4 pb-6 pt-6 sm:mx-0 sm:mt-0 sm:rounded-[28px] sm:p-8">
        {/* Jalan melengkung samar, seperti _RoadPainter di mobile */}
        <svg className="pointer-events-none absolute -bottom-6 right-0 h-48 w-80 text-white/10" viewBox="0 0 320 190" fill="none" aria-hidden>
          <path d="M130 210C180 130 240 80 340 60" stroke="currentColor" strokeWidth={34} strokeLinecap="round" />
        </svg>
        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-10">
          <div className="space-y-2">
            <Greeting />
            <p className="text-sm text-white/80 sm:text-base">Tiket Bus, Lebih Mudah. Pilih kursi sendiri, bayar QRIS atau Virtual Account.</p>
          </div>
          <SearchCard />
        </div>
      </section>

      <section>
        <SectionTitle title="Promo & Info" />
        <PromoRow promos={TOP_PROMOS} tall />
      </section>

      <section>
        <SectionTitle title="Produk unggulan" subtitle="Rute favorit dari PO mitra CardBus" trailing={`${FEATURED.length} rute`} />
        <FeaturedGrid products={FEATURED} />
      </section>

      <section>
        <SectionTitle title="Promo spesial" trailing={`${SPECIAL_PROMOS.length} promo`} />
        <PromoRow promos={SPECIAL_PROMOS} />
      </section>

      <section>
        <SectionTitle title="Kenapa CardBus?" />
        <FeatureStrip />
      </section>

      <p className="text-center text-xs text-faint">
        Sudah pesan? <Link href="/pesanan" className="font-semibold text-brand">Lihat Tiket Saya</Link>
      </p>
    </div>
  );
}

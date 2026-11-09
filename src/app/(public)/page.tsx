import Link from 'next/link';
import { FeaturedGrid, FeatureStrip, Greeting, PromoRow, SectionTitle } from '@/components/home/home-sections';
import { SearchCard } from '@/components/home/search-card';
import { loadBanners } from '@/lib/banners';
import { loadFeatured } from '@/lib/featured';

// Banner & produk unggulan dikelola di Admin Pusat: beranda diperbarui paling lama tiap 30 detik.
export const revalidate = 30;

/**
 * Beranda, mengikuti HomeScreen di aplikasi mobile: header teal melengkung + sapaan,
 * kartu cari, Promo & Info, Produk unggulan, Promo spesial, dan keunggulan CardBus.
 */
export default async function HomePage() {
  const [featured, banners] = await Promise.all([loadFeatured(), loadBanners()]);
  return (
    <div className="space-y-8">
      {/* Hero selebar layar: sapaan + bilah cari horizontal */}
      <section className="relative -mt-8 ml-[calc(50%-50vw)] w-screen">
        <div className="relative rounded-b-[28px] bg-[linear-gradient(100deg,#04454a_0%,#0a6c66_32%,#0f857d_58%,#4f968f_100%)] sm:rounded-none">
          {/* Jalan melengkung samar, seperti _RoadPainter di mobile */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[28px] sm:rounded-none" aria-hidden>
            <svg className="absolute -bottom-6 right-0 h-48 w-80 text-white/10" viewBox="0 0 320 190" fill="none">
              <path d="M130 210C180 130 240 80 340 60" stroke="currentColor" strokeWidth={34} strokeLinecap="round" />
            </svg>
          </div>
          <div className="relative mx-auto grid max-w-[1360px] grid-cols-[minmax(0,1fr)] items-center gap-5 px-4 pb-12 pt-6 sm:px-8 sm:pb-16 sm:pt-12 lg:pt-14 2xl:grid-cols-[minmax(0,0.62fr)_minmax(0,2fr)] 2xl:gap-12 2xl:py-20">
            <div className="space-y-2">
              <Greeting />
              <p className="max-w-md text-sm text-white/85 sm:text-base">Tiket Bus, Lebih Mudah. Pilih kursi sendiri, bayar QRIS atau Virtual Account.</p>
            </div>
            <SearchCard />
          </div>
        </div>
        {/* Panah bawah mengambang: lanjut ke Promo & Info */}
        <a
          href="#promo"
          aria-label="Lihat promo dan jadwal pilihan"
          className="absolute bottom-0 left-1/2 grid h-11 w-11 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border border-line bg-white text-muted shadow-md transition hover:text-brand"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </section>

      <section id="promo" className="scroll-mt-24 pt-2">
        {banners.top.length > 0 && (
          <>
            <SectionTitle title="Promo & Info" trailing={<Link href="/promo" className="hover:underline">Lihat semua ›</Link>} />
            <PromoRow promos={banners.top} tall />
          </>
        )}
      </section>

      {featured.length > 0 && (
        <section>
          <SectionTitle title="Produk unggulan" subtitle="Rute favorit dari PO mitra CardBus" trailing={`${featured.length} rute`} />
          <FeaturedGrid products={featured} />
        </section>
      )}

      {banners.special.length > 0 && (
        <section>
          <SectionTitle title="Promo spesial" trailing={`${banners.special.length} promo`} />
          <PromoRow promos={banners.special} />
        </section>
      )}

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

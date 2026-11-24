import Link from 'next/link';
import { FeaturedGrid, FeatureStrip, Greeting, PromoRow, SectionTitle } from '@/components/home/home-sections';
import { HeroBackdrop } from '@/components/home/hero-backdrop';
import { AppBanner } from '@/components/home/app-banner';
import { SearchCard } from '@/components/home/search-card';
import { Faq } from '@/components/home/faq';
import { Testimonials } from '@/components/home/testimonials';
import { loadBanners } from '@/lib/banners';
import { activeAppBannerBackground } from '@/lib/app-banner-background';
import { loadFeatured } from '@/lib/featured';
import { loadTestimonials } from '@/lib/testimonials';

// Banner & produk unggulan dikelola di Admin Pusat: beranda diperbarui paling lama tiap 30 detik.
export const revalidate = 30;

/**
 * Beranda, mengikuti HomeScreen di aplikasi mobile: header teal melengkung + sapaan,
 * kartu cari, Promo & Info, Produk unggulan, Promo spesial, dan keunggulan CardBus.
 */
export default async function HomePage() {
  const [featured, banners] = await Promise.all([loadFeatured(), loadBanners()]);
  // Ulasan asli penumpang dari PO yang tampil di Produk unggulan (kosong = seksi disembunyikan)
  const testimonials = await loadTestimonials(featured);
  return (
    <div className="space-y-8">
      {/* Hero selebar layar: sapaan + bilah cari horizontal */}
      {/* pb = bagian kartu cari yang menjuntai di bawah hero (tombol Cari Tiket), agar konten berikutnya tidak tertimpa */}
      <section className="relative -mt-8 ml-[calc(50%-50vw)] w-screen pb-[76px] sm:pb-[84px]">
        <div className="relative rounded-b-[28px] bg-brand-dark sm:rounded-none">
          {/* Latar teal + ornamen perjalanan (tiket, bus, pin, rute, gelombang), di belakang konten */}
          <HeroBackdrop className="rounded-b-[28px] sm:rounded-none" />
          {/* pt memberi ruang pita ornamen atas; tanpa pb: hero berakhir sejajar bagian bawah kolom isian kartu */}
          <div className="relative mx-auto grid max-w-[1360px] grid-cols-[minmax(0,1fr)] items-center gap-5 px-4 pt-12 sm:px-8 sm:pt-[88px] lg:pt-[92px]">
            <div className="space-y-2">
              <Greeting />
              <p className="max-w-md text-sm text-white/85 sm:text-base">Tiket Bus, Lebih Mudah. Pilih kursi sendiri, bayar QRIS atau Virtual Account.</p>
            </div>
            {/* Kartu menjuntai keluar hero sebesar baris tombol (margin negatif = pb section di atas) */}
            <div className="relative -mb-[76px] min-w-0 sm:-mb-[84px]">
              <SearchCard />
            </div>
          </div>
        </div>
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

      <AppBanner background={activeAppBannerBackground()} />

      <Testimonials items={testimonials} />

      <Faq />

      <p className="text-center text-xs text-faint">
        Sudah pesan? <Link href="/pesanan" className="font-semibold text-brand">Lihat Tiket Saya</Link>
      </p>
    </div>
  );
}

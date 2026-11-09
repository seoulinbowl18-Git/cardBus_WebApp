/**
 * Konten Beranda, disalin dari MockData aplikasi mobile (lib/data/mock_data.dart)
 * agar web dan mobile menampilkan promo & produk unggulan yang sama.
 * Gambar ada di public/images/home/.
 */

const img = (f: string) => `/images/home/${f}`;

export interface Promo {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  from?: string;
  to?: string;
  /** Diisi = belum bisa dipesan; tombol menampilkan info ini. */
  soonMessage?: string;
}

/** Kartu "Produk unggulan": dari GET /api/featured (dikelola Admin Pusat), cadangan [FEATURED]. */
export interface FeaturedProduct {
  id: string;
  poName: string;
  logo?: string | null;
  image?: string | null;
  busClass: string;
  from: string;
  to: string;
  boardPoint?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  tag: string;
  comingSoon?: boolean;
}

/** Rute awal kartu cari (default TicketSearchModel di mobile). */
export const DEFAULT_ROUTE = { from: 'Solo', to: 'Jakarta' };

/** "Promo & Info" (MockData.topPromos). */
export const TOP_PROMOS: Promo[] = [
  {
    image: img('garudamas_dd2.jpg'), tag: 'RUTE BARU · GARUDA MAS', title: 'Poris ↔ Malang Double Decker Sleeper',
    subtitle: 'Poris 14.00 WIB', from: 'Tangerang', to: 'Malang', ctaLabel: 'Cek Sekarang',
  },
  {
    image: img('raya_promo.jpg'), tag: 'PROMO PO RAYA', title: 'Solo → Bogor makin hoki',
    subtitle: 'Rp 230.000 (normal Rp 260.000) · S&K berlaku', from: 'Solo', to: 'Bogor', ctaLabel: 'Cek Sekarang',
  },
  {
    image: img('agramas_dd.jpg'), tag: 'MITRA PO', title: 'Agra Mas kini bisa dipesan di sini',
    subtitle: 'Pilih kursi langsung, tanpa ke agen', from: 'Tangerang', to: 'Solo', ctaLabel: 'Cek Sekarang',
  },
];

/**
 * "Promo spesial" (MockData.midPromos). Banner "Hemat [X%] kelas Super Top" di mobile
 * masih berisi placeholder, jadi sengaja belum ditampilkan di web.
 */
export const SPECIAL_PROMOS: Promo[] = [
  {
    image: img('san_jetbus5.jpg'), tag: 'SEGERA HADIR', title: 'Solo → Sumatera bareng PO SAN',
    subtitle: 'Pekanbaru · Bengkulu · Jetbus 5 SHD', ctaLabel: 'Info',
    soonMessage: 'PO SAN Solo → Sumatera: jadwal segera hadir di CardBus',
  },
  {
    image: img('mahardhika_suite.jpg'), tag: 'KELAS BARU', title: 'Suite Combi Mahardhika',
    subtitle: 'Exe Plus + Sleeper · Wonogiri → Tangerang', from: 'Wonogiri', to: 'Tangerang', ctaLabel: 'Cek Sekarang',
  },
];

/**
 * "Produk unggulan" cadangan, dipakai hanya bila backend tidak bisa dihubungi. Isi aslinya dikelola di
 * Admin Pusat → Produk Unggulan (tabel featured_products, awalnya diisi dengan daftar ini).
 */
export const FEATURED: FeaturedProduct[] = [
  {
    id: 'san-pku', poName: 'SAN', image: img('san_jetbus5.jpg'), busClass: 'Jetbus 5 SHD · Madar Class',
    from: 'Solo', to: 'Pekanbaru', boardPoint: 'Solo', tag: 'BARU', comingSoon: true,
  },
  {
    id: 'san-bkl', poName: 'SAN', image: img('san_silver.jpg'), busClass: 'Bus Malam',
    from: 'Solo', to: 'Bengkulu', boardPoint: 'Solo', tag: 'BARU', comingSoon: true,
  },
  {
    id: 'mh-dd', poName: 'Mahardhika', logo: img('logo_mahardhika.png'), image: img('mahardhika_dd.jpg'),
    busClass: 'Double Decker', from: 'Wonogiri', to: 'Jakarta', boardPoint: 'Pasar Wonogiri', price: 300000, tag: 'TERLARIS',
  },
  {
    id: 'ry-junior', poName: 'Raya', logo: img('logo_raya.png'), image: img('raya_promo.jpg'), busClass: 'Junior',
    from: 'Solo', to: 'Bogor', boardPoint: 'Terminal Tirtonadi', price: 230000, oldPrice: 260000, tag: 'PROMO',
  },
  {
    id: 'gr-dd', poName: 'Garuda Mas', image: img('garudamas_dd.jpg'), busClass: 'Double Decker Sleeper',
    from: 'Tangerang', to: 'Malang', boardPoint: 'Terminal Poris Plawad', price: 400000, tag: 'SLEEPER',
  },
  {
    id: 'am-exe', poName: 'Agra Mas', logo: img('logo_agramas.png'), image: img('agramas_red.jpg'), busClass: 'Executive',
    from: 'Tangerang', to: 'Solo', boardPoint: 'Terminal Poris Plawad', price: 255000, tag: 'FAVORIT',
  },
];

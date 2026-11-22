import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (disajikan Next.js di /manifest.webmanifest dan otomatis ditautkan di <head>).
 * Ikon dibuat dari public/icon.png: "any" = ikon sudut membulat, "maskable" = latar penuh dengan
 * ikon di zona aman 80% agar tidak terpotong oleh bentuk ikon launcher Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CardBus - Tiket Bus, Lebih Mudah',
    short_name: 'CardBus',
    description: 'Pesan tiket bus antarkota secara online. Pilih kursi sendiri, bayar QRIS atau Virtual Account.',
    lang: 'id',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Selaras dengan palet di globals.css: brand #087f78, latar #f4f7f7
    theme_color: '#087f78',
    background_color: '#f4f7f7',
    categories: ['travel', 'shopping'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Tiket Saya', short_name: 'Tiket', url: '/pesanan', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Promo', url: '/promo', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}

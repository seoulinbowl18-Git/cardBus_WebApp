/*
 * Service worker CardBus (PWA).
 *
 * Prinsip: hanya aset yang aman yang di-cache. Data dinamis (jadwal, kursi, pembayaran, status
 * pesanan) TIDAK pernah dilayani dari cache:
 *  - Request ke origin lain (backend API cardbus_backend, Firebase/Google login, foto backend)
 *    tidak disentuh sama sekali -> selalu langsung ke jaringan, header Authorization tetap utuh.
 *  - /admin, /api, payload RSC Next.js (header RSC / ?_rsc), dan semua request non-GET dilewati.
 *  - Halaman dinamis (/cari, /checkout, /pesanan, /ulasan, ...) = network-only; saat offline
 *    ditampilkan halaman /offline.
 *  - Hanya halaman statis publik (beranda, promo, teks legal) yang disimpan, network-first,
 *    dan baru dipakai bila jaringan gagal.
 *  - /_next/static/* (nama file ber-hash, immutable) = cache-first.
 *  - Gambar/ikon lokal = stale-while-revalidate.
 *
 * Naikkan VERSION bila strategi cache berubah; cache lama dihapus saat activate.
 * Darurat (mis. SW bermasalah di produksi): ganti isi file ini dengan versi yang memanggil
 * self.registration.unregister() lalu deploy.
 */
const VERSION = 'v1';
const PREFIX = 'cardbus-';
const STATIC_CACHE = `${PREFIX}static-${VERSION}`;
const ASSET_CACHE = `${PREFIX}assets-${VERSION}`;
const PAGE_CACHE = `${PREFIX}pages-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, ASSET_CACHE, PAGE_CACHE];

const OFFLINE_URL = '/offline';
const PRECACHE_ASSETS = ['/icons/icon-192.png', '/brand/cardbus-header.png'];
/** Halaman statis tanpa data pribadi yang boleh dibuka saat offline (dari salinan terakhir). */
const OFFLINE_PAGES = new Set(['/', '/promo', '/syarat-ketentuan', '/kebijakan-privasi', '/akun/pembatalan']);
/** Awalan path yang tidak pernah ditangani SW. */
const BYPASS_PREFIXES = ['/admin', '/api/', '/sw.js', '/manifest.webmanifest'];

const MAX_STATIC_ENTRIES = 200;
const MAX_ASSET_ENTRIES = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGE_CACHE);
      const res = await fetch(OFFLINE_URL, { cache: 'reload' });
      if (!res.ok) throw new Error(`Gagal memuat ${OFFLINE_URL}: ${res.status}`);
      const html = await res.clone().text();
      await pages.put(OFFLINE_URL, res);

      // CSS/JS/font yang dipakai halaman offline ikut disimpan agar tampil rapi tanpa jaringan.
      const staticUrls = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
      const statics = await caches.open(STATIC_CACHE);
      await Promise.all(staticUrls.map((u) => statics.add(u).catch(() => {})));

      const assets = await caches.open(ASSET_CACHE);
      await Promise.all(PRECACHE_ASSETS.map((u) => assets.add(u).catch(() => {})));

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Backend API, Firebase, Google, CDN: biarkan browser menangani langsung.
  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  // Payload RSC / prefetch App Router: selalu dari jaringan (bila gagal, Next.js melakukan
  // navigasi penuh yang lalu ditangani handler navigasi di bawah).
  if (request.headers.has('RSC') || request.headers.has('Next-Router-Prefetch') || url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, url));
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC_ENTRIES));
    return;
  }
  if (isLocalImage(url)) {
    event.respondWith(staleWhileRevalidate(event, request, ASSET_CACHE, MAX_ASSET_ENTRIES));
  }
  // Selain itu: tidak ditangani (langsung ke jaringan).
});

function isLocalImage(url) {
  if (url.pathname === '/_next/image') {
    // Hanya gambar lokal; foto profil Google (URL eksternal) tidak disimpan.
    const src = url.searchParams.get('url') || '';
    return src.startsWith('/') && !src.startsWith('//');
  }
  return /\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname);
}

async function handleNavigation(event, url) {
  const keepCopy = OFFLINE_PAGES.has(url.pathname) && url.search === '';
  try {
    const preloaded = await event.preloadResponse;
    const res = preloaded || (await fetch(event.request));
    if (keepCopy && res.ok && res.type === 'basic' && !res.redirected) {
      const copy = res.clone();
      event.waitUntil(caches.open(PAGE_CACHE).then((c) => c.put(url.pathname, copy)));
    }
    return res;
  } catch {
    if (keepCopy) {
      const cached = await caches.match(url.pathname, { cacheName: PAGE_CACHE });
      if (cached) return cached;
    }
    const offline = await caches.match(OFFLINE_URL, { cacheName: PAGE_CACHE });
    return (
      offline ||
      new Response('<h1>Tidak ada koneksi internet</h1><p>Periksa koneksi lalu muat ulang halaman.</p>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') {
    await cache.put(request, res.clone());
    trimCache(cacheName, maxEntries);
  }
  return res;
}

async function staleWhileRevalidate(event, request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok && res.type === 'basic') {
        await cache.put(request, res.clone());
        trimCache(cacheName, maxEntries);
      }
      return res;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // keys() berurutan sesuai waktu simpan: hapus yang paling lama.
  for (let i = 0; i < keys.length - maxEntries; i++) await cache.delete(keys[i]);
}

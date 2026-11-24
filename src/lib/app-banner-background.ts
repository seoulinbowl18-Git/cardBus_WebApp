import data from '@/data/app-banner-background.json';

/**
 * Gambar latar musiman untuk banner "Get the CardBus App" (src/data/app-banner-background.json).
 *
 * - image : path gambar di folder public, mis. "/banners/hut-ri.webp" (kosong = ilustrasi bus bawaan).
 * - alt   : deskripsi singkat gambar untuk pembaca layar (boleh kosong bila gambar hanya dekorasi).
 * - from / until : tanggal tampil "YYYY-MM-DD" (WIB, inklusif); kosong = tanpa batas.
 *
 * Pakai hanya gambar yang hak pakainya dimiliki CardBus (tanpa watermark pihak lain).
 */
export interface AppBannerBackground {
  src: string;
  alt: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Tanggal hari ini di WIB (Asia/Jakarta) dalam format YYYY-MM-DD. */
function todayWib(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function activeAppBannerBackground(now: Date = new Date()): AppBannerBackground | null {
  const src = typeof data.image === 'string' ? data.image.trim() : '';
  if (!src.startsWith('/')) return null; // hanya file lokal di folder public
  const today = todayWib(now);
  const from = typeof data.from === 'string' && DATE_RE.test(data.from) ? data.from : '';
  const until = typeof data.until === 'string' && DATE_RE.test(data.until) ? data.until : '';
  if ((from && today < from) || (until && today > until)) return null;
  return { src, alt: typeof data.alt === 'string' ? data.alt.trim() : '' };
}

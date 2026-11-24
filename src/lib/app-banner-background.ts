import data from '@/data/app-banner-background.json';

/**
 * Gambar latar musiman untuk banner "Get the CardBus App" (src/data/app-banner-background.json).
 *
 * - image : path gambar di folder public, mis. "/banners/hut-ri.webp" (kosong = ilustrasi bus bawaan).
 * - alt   : deskripsi singkat gambar untuk pembaca layar (boleh kosong bila gambar hanya dekorasi).
 * - caption : teks besar opsional di area ilustrasi (mis. "INDONESIA"), tampil di ruang kosong
 *            antara judul dan panel unduh pada semua ukuran layar.
 * - position : titik fokus potongan gambar (CSS object-position), mis. "center 30%". Kosong = tengah.
 * - from / until : tanggal tampil "YYYY-MM-DD" (WIB, inklusif); kosong = tanpa batas.
 *
 * Pakai hanya gambar yang hak pakainya dimiliki CardBus (tanpa watermark pihak lain).
 */
export interface AppBannerBackground {
  src: string;
  alt: string;
  caption: string;
  position: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** object-position sederhana: kata kunci posisi dan/atau persentase, tanpa karakter lain. */
const POSITION_RE = /^((left|right|center|top|bottom|\d{1,3}%)\s*){1,2}$/;
const field = (k: string) => {
  const v = (data as Record<string, unknown>)[k];
  return typeof v === 'string' ? v.trim() : '';
};

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
  const position = field('position');
  return {
    src,
    alt: field('alt'),
    caption: field('caption').slice(0, 24),
    position: POSITION_RE.test(position) ? position : 'center',
  };
}

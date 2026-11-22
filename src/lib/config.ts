/**
 * Konfigurasi web app dari environment variable (lihat .env.example).
 * Default-nya backend produksi yang sama dengan aplikasi mobile (ApiService.defaultBaseUrl).
 */
const DEFAULT_API_BASE_URL = 'https://cardbusbackend-production.up.railway.app';

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, ''),
  apiTimeoutMs: num(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15_000),
  paymentPollMs: num(process.env.NEXT_PUBLIC_PAYMENT_POLL_MS, 5_000),
  csWhatsapp: process.env.NEXT_PUBLIC_CS_WHATSAPP || '',
  /** Tautan aplikasi di toko. Kosong = tombol tampil "Segera hadir" (belum ada listing resmi). */
  playStoreUrl: process.env.NEXT_PUBLIC_PLAY_STORE_URL || '',
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL || '',
} as const;

/** Kunci localStorage untuk sesi login (JWT dari backend). */
export const STORAGE_KEYS = {
  token: 'cardbus.token',
  user: 'cardbus.user',
  /** Sesi Admin Pusat (/admin), terpisah dari sesi penumpang. */
  adminToken: 'cardbus.admin.token',
} as const;

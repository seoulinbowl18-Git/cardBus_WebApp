import { config } from '@/lib/config';
import { FEATURED, type FeaturedProduct } from '@/lib/home-content';

/** Beranda mengambil ulang kartu paling lama tiap 30 detik (sama dengan cache GET /api/featured). */
export const FEATURED_REVALIDATE_SECONDS = 30;

/**
 * Kartu "Produk unggulan" untuk beranda, dari Admin Pusat (GET /api/featured). Dijalankan di server.
 * Daftar kosong = admin menonaktifkan semua kartu (bagian disembunyikan). Backend tidak bisa dihubungi =
 * daftar cadangan [FEATURED], agar beranda tidak pernah kosong karena gangguan sementara.
 */
export async function loadFeatured(): Promise<FeaturedProduct[]> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/api/featured`, {
      next: { revalidate: FEATURED_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error('bukan daftar');
    return data as FeaturedProduct[];
  } catch (e) {
    console.error('[beranda] gagal memuat produk unggulan, pakai daftar cadangan:', (e as Error).message);
    return FEATURED;
  }
}

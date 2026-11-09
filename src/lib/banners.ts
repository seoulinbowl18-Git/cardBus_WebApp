import { config } from '@/lib/config';
import { SPECIAL_PROMOS, TOP_PROMOS, type Promo } from '@/lib/home-content';

/** Beranda mengambil ulang banner paling lama tiap 30 detik (sama dengan cache GET /api/banners). */
export const BANNERS_REVALIDATE_SECONDS = 30;

interface BannerJson {
  id: string;
  placement: 'top' | 'special';
  tag: string;
  title: string;
  subtitle: string;
  image: string | null;
  ctaLabel: string;
  link: string | null;
  from: string | null;
  to: string | null;
}

const toPromo = (b: BannerJson): Promo => ({
  id: b.id, image: b.image, tag: b.tag, title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel,
  from: b.from, to: b.to, link: b.link?.startsWith('https://') ? b.link : null,
});

/**
 * Banner "Promo & Info" (top) dan "Promo spesial" (special) dari Admin Pusat (GET /api/banners). Dijalankan
 * di server. Daftar kosong = admin menonaktifkan semua banner tempat itu (bagian disembunyikan). Backend tidak
 * bisa dihubungi = daftar cadangan, agar beranda tidak pernah kosong karena gangguan sementara.
 */
export async function loadBanners(): Promise<{ top: Promo[]; special: Promo[] }> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/api/banners`, {
      next: { revalidate: BANNERS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error('bukan daftar');
    const list = data as BannerJson[];
    return {
      top: list.filter((b) => b.placement === 'top').map(toPromo),
      special: list.filter((b) => b.placement === 'special').map(toPromo),
    };
  } catch (e) {
    console.error('[beranda] gagal memuat banner, pakai daftar cadangan:', (e as Error).message);
    return { top: TOP_PROMOS, special: SPECIAL_PROMOS };
  }
}

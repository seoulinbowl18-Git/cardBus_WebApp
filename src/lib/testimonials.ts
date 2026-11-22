import { config } from '@/lib/config';
import type { FeaturedProduct } from '@/lib/home-content';
import type { Review, ReviewPage } from '@/lib/types';

/** Ulasan beranda diperbarui paling lama tiap 5 menit. */
const REVALIDATE_SECONDS = 300;
const MAX_ITEMS = 8;

export interface Testimonial extends Review {
  poName: string;
}

/**
 * Testimoni beranda dari ulasan ASLI penumpang (GET /api/reviews per PO, publik). Dijalankan di server.
 * PO diambil dari kartu Produk unggulan (GET /api/featured mengirim poId). Hanya ulasan tayang dari
 * penumpang CardBus (source "passenger") dengan bintang ≥ 4 dan komentar berisi, terbaru di depan.
 * Gagal / tidak ada ulasan = daftar kosong → bagian testimoni disembunyikan (tidak ada ulasan contoh).
 */
export async function loadTestimonials(featured: FeaturedProduct[]): Promise<Testimonial[]> {
  const poIds = [...new Set(featured.map((f) => f.poId).filter((id): id is string => !!id))].slice(0, 6);
  if (!poIds.length) return [];
  const pages = await Promise.all(
    poIds.map(async (poId) => {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/reviews?${new URLSearchParams({ poId, limit: '6' })}`, {
          next: { revalidate: REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return (await res.json()) as ReviewPage;
      } catch {
        return null;
      }
    }),
  );
  const items: Testimonial[] = [];
  for (const page of pages) {
    if (!page || !Array.isArray(page.items)) continue;
    for (const r of page.items) {
      if (r.source !== 'passenger' || r.rating < 4 || (r.comment ?? '').trim().length < 12) continue;
      items.push({ ...r, poName: page.poName });
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ITEMS);
}

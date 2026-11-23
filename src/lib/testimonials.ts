import { config } from '@/lib/config';
import type { FeaturedProduct } from '@/lib/home-content';

/** Ulasan beranda diperbarui paling lama tiap 5 menit. */
const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 5000;
const MAX_POS = 6;
const PER_PO = 20;
const MAX_ITEMS = 8;
const MIN_RATING = 4;
const MIN_COMMENT = 12;

/** Data tampilan satu kartu testimoni (sudah dibersihkan, semua field aman dirender). */
export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  poName: string;
  trip: { from: string | null; to: string | null } | null;
  createdAt: string;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');

/** Satu ulasan mentah → Testimonial, atau null bila bukan ulasan penumpang asli yang layak tampil. */
function toTestimonial(raw: unknown, poName: string): Testimonial | null {
  if (!isObj(raw)) return null;
  // Hanya ulasan dari penumpang CardBus; ulasan yang dicatat admin (atau tanpa sumber) tidak ditampilkan.
  if (raw.source !== 'passenger') return null;
  const rating = typeof raw.rating === 'number' ? raw.rating : typeof raw.rating === 'string' && raw.rating.trim() ? Number(raw.rating) : NaN;
  if (!Number.isFinite(rating) || rating < MIN_RATING || rating > 5) return null;
  const comment = str(raw.comment);
  if (comment.length < MIN_COMMENT) return null;
  const id = str(raw.id);
  if (!id) return null;
  const createdAt = str(raw.createdAt);
  const t = isObj(raw.trip) ? raw.trip : null;
  const from = t ? str(t.from) || null : null;
  const to = t ? str(t.to) || null : null;
  return {
    id,
    name: (typeof raw.name === 'string' && raw.name.trim()) || 'Penumpang CardBus',
    rating: Math.round(rating),
    comment,
    poName,
    trip: from && to ? { from, to } : null,
    createdAt: Number.isNaN(Date.parse(createdAt)) ? '' : createdAt,
  };
}

/** GET /api/reviews untuk satu PO; error jaringan / HTTP / JSON / bentuk tak dikenal = daftar kosong. */
async function fetchPoReviews(poId: string, fallbackPoName: string): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/api/reviews?${new URLSearchParams({ poId, limit: String(PER_PO) })}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const page: unknown = await res.json();
    if (!isObj(page) || !Array.isArray(page.items)) return [];
    const poName = str(page.poName) || fallbackPoName;
    return page.items.map((r) => toTestimonial(r, poName)).filter((t): t is Testimonial => t !== null);
  } catch {
    return [];
  }
}

/**
 * Testimoni beranda dari ulasan ASLI penumpang (GET /api/reviews per PO, publik). Dijalankan di server.
 * PO diambil dari kartu Produk unggulan (GET /api/featured mengirim poId). Hanya ulasan tayang dari
 * penumpang CardBus (source "passenger") dengan bintang ≥ 4 dan komentar memadai, terbaru di depan.
 * Respons tak lengkap/berbeda bentuk, gagal jaringan, atau tidak ada ulasan = daftar kosong → bagian
 * testimoni disembunyikan (tidak pernah ada ulasan contoh). Fungsi ini tidak pernah melempar error.
 */
export async function loadTestimonials(featured: unknown): Promise<Testimonial[]> {
  try {
    if (!Array.isArray(featured)) return [];
    const pos = new Map<string, string>();
    for (const f of featured as unknown[]) {
      if (!isObj(f)) continue;
      const poId = str((f as Partial<FeaturedProduct> & Obj).poId);
      if (poId && !pos.has(poId)) pos.set(poId, str(f.poName));
      if (pos.size >= MAX_POS) break;
    }
    if (!pos.size) return [];

    const lists = await Promise.all([...pos].map(([poId, poName]) => fetchPoReviews(poId, poName)));
    const seen = new Set<string>();
    const items: Testimonial[] = [];
    for (const t of lists.flat()) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      items.push(t);
    }
    // Terbaru di depan; tanggal tak valid ('') di belakang.
    return items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0)).slice(0, MAX_ITEMS);
  } catch (e) {
    console.error('[beranda] gagal memuat testimoni:', (e as Error).message);
    return [];
  }
}

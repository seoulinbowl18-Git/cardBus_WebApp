import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiError } from '@/lib/api/client';
import { reviewApi } from '@/lib/api/endpoints';
import type { ReviewPage } from '@/lib/types';
import { ReviewsView } from './reviews-view';

type Params = Promise<{ poId: string }>;

// Ulasan baru / moderasi Admin Pusat tampil paling lama 60 detik kemudian (halaman pertama).
export const revalidate = 60;

async function load(poId: string): Promise<{ page: ReviewPage | null; error: string | null }> {
  try {
    return { page: await reviewApi.list(poId), error: null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { page: null, error: 'PO tidak ditemukan.' };
    return { page: null, error: e instanceof ApiError ? e.message : 'Gagal memuat ulasan.' };
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { poId } = await params;
  const { page } = await load(poId);
  if (!page) return { title: 'Ulasan PO' };
  const avg = page.summary.average;
  return {
    title: `Ulasan PO ${page.poName}`,
    description:
      avg == null
        ? `Ulasan penumpang PO ${page.poName} di CardBus.`
        : `PO ${page.poName}: rating ${avg.toFixed(1)}/5 dari ${page.summary.total} penilaian penumpang.`,
  };
}

/** Rating & ulasan satu PO (padanan ReviewScreen di aplikasi mobile). */
export default async function PoReviewsPage({ params }: { params: Params }) {
  const { poId } = await params;
  const { page, error } = await load(poId);
  if (!page) {
    return (
      <section className="py-16 text-center">
        <p className="text-muted">{error}</p>
        <Link href="/" className="mt-3 inline-block font-bold text-brand hover:underline">
          Kembali ke beranda
        </Link>
      </section>
    );
  }
  return <ReviewsView poId={poId} initial={page} />;
}

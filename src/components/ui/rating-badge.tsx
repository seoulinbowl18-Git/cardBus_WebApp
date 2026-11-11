import Link from 'next/link';
import type { Trip, TripRating } from '@/lib/types';

/** Rating PO dari jadwal: `rating: { average, total }`, atau kolom datar average_rating / total_reviews. */
export function tripRating(trip: Trip): TripRating | null {
  if (trip.rating && trip.rating.average != null) {
    return { average: Number(trip.rating.average), total: Number(trip.rating.total) || 0 };
  }
  if (trip.average_rating != null && trip.average_rating !== '') {
    const average = Number(trip.average_rating);
    if (Number.isFinite(average)) return { average, total: Number(trip.total_reviews) || 0 };
  }
  return null;
}

/** 86 → "86", 1250 → "1,2rb", 15400 → "15rb" (sama dengan aplikasi mobile). */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n >= 10000) return `${Math.floor(n / 1000)}rb`;
  const tenths = Math.floor(n / 100);
  return `${Math.floor(tenths / 10)}${tenths % 10 ? `,${tenths % 10}` : ''}rb`;
}

/** Hijau ≥ 4, oranye ≥ 3, merah di bawahnya (sama dengan aplikasi mobile). */
const color = (v: number) => (v >= 4 ? 'bg-[#1f8a4c]' : v >= 3 ? 'bg-[#e08a00]' : 'bg-[#d64545]');

/** Kotak rating "★ 4.7" dengan jumlah penilaian di bawahnya, seperti RatingBadge di aplikasi Flutter. */
/** `href` = badge jadi tautan ke halaman ulasan PO. */
export function RatingBadge({ rating, href, className = '' }: { rating: TripRating; href?: string; className?: string }) {
  const avg = rating.average.toFixed(1);
  const label = `Rating ${avg} dari 5, ${rating.total} penilaian`;
  const body = (
    <>
      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-extrabold leading-none text-white ${color(rating.average)}`}>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
          <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7z" />
        </svg>
        {avg}
      </span>
      <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold leading-none text-muted">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-faint" fill="currentColor" aria-hidden>
          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5Z" />
        </svg>
        {compactCount(rating.total)}
      </span>
    </>
  );
  const cls = `flex shrink-0 flex-col items-center gap-0.5 ${className}`;
  return href ? (
    // relative z-10: di atas tautan checkout yang menutupi seluruh kartu jadwal
    <Link href={href} aria-label={`${label}. Lihat ulasan`} title="Lihat ulasan" className={`${cls} relative z-10 rounded-md hover:opacity-85`}>
      {body}
    </Link>
  ) : (
    <div className={cls} role="img" aria-label={label} title={label}>
      {body}
    </div>
  );
}

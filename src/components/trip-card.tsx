import Link from 'next/link';
import { BusPhotoGrid } from '@/components/bus-gallery';
import { BusPhoto } from '@/components/bus-photo';
import { PoBadge } from '@/components/ui/po-badge';
import { RatingBadge, tripRating } from '@/components/ui/rating-badge';
import { formatDuration, formatRupiah } from '@/lib/format';
import type { Trip } from '@/lib/types';

export const cheapestTier = (trip: Trip) =>
  trip.tiers.filter((t) => t.freeSeats.length > 0).sort((a, b) => a.price - b.price)[0] ?? trip.tiers[0];
export const seatsLeft = (trip: Trip) => trip.tiers.reduce((n, t) => n + t.freeSeats.length, 0);

/**
 * Kartu jadwal di hasil pencarian, mengikuti TripCardWidget di aplikasi mobile. `href` = seluruh kartu jadi
 * tautan ke checkout (tautan di lapisan bawah, agar kisi foto galeri tetap bisa diklik sendiri).
 */
export function TripCard({ trip, href }: { trip: Trip; href?: string }) {
  const tier = cheapestTier(trip);
  const left = seatsLeft(trip);
  const promo = !!tier?.oldPrice;
  const hasGallery = (trip.photos?.length ?? 0) > 0 || trip.photosPending;
  const rating = tripRating(trip);
  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border border-line bg-white p-3.5 sm:flex-row sm:gap-4 ${left === 0 ? 'opacity-60' : ''} ${href ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      {href && <Link href={href} aria-label={`Pilih jadwal PO ${trip.poName} ${trip.busClass} ${trip.depart}`} className="absolute inset-0 rounded-2xl" />}
      {hasGallery ? (
        // Galeri foto armada: di bawah info jadwal (HP), di kiri (layar lebar)
        <BusPhotoGrid trip={trip} className="order-last sm:order-first sm:w-56 sm:self-center" />
      ) : (
        <BusPhoto src={trip.image} alt={trip.poName} className="hidden h-auto w-40 shrink-0 rounded-xl sm:block" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <PoBadge name={trip.poName} logo={trip.logo} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 min-w-0 break-words text-[15px] font-extrabold leading-tight">PO {trip.poName}</h3>
              {/* Rating PO (ulasan penumpang + rating awal dari Admin Pusat), seperti di aplikasi mobile */}
              {rating && <RatingBadge rating={rating} />}
            </div>
            <p className="truncate text-xs text-muted">{trip.busClass}</p>
          </div>
          {tier && (
            <div className="text-right">
              {promo && <p className="text-[11px] text-faint line-through">{formatRupiah(tier.oldPrice!)}</p>}
              <p className={`text-base font-extrabold ${promo ? 'text-promo' : 'text-brand'}`}>{formatRupiah(tier.price)}</p>
              <p className="text-[10px] text-faint">/kursi</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Time time={trip.depart} place={trip.boardPoint} />
          <div className="flex-1 text-center">
            <p className="text-[11px] text-muted">{formatDuration(trip.durationMinutes)}</p>
            <div className="mx-2 border-t border-line" />
          </div>
          <Time time={trip.arrive} place={trip.dropPoint} end />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold">
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${left < 6 ? 'text-[#9b1c1c]' : 'text-brand'}`} fill="currentColor" aria-hidden>
            <path d="M5 11V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a2 2 0 0 1 2 2v4h-2v3h-2v-3H7v3H5v-3H3v-4a2 2 0 0 1 2-2Zm2 0h10V6a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1Z" />
          </svg>
          <span className={left < 6 ? 'text-[#9b1c1c]' : ''}>{left > 0 ? `Sisa ${left} kursi` : 'Kursi habis'}</span>
          {trip.tiers.length > 1 && <span className="font-medium text-faint">· {trip.tiers.length} varian kursi</span>}
          <span className="ml-auto text-[13px] font-extrabold text-brand">{left > 0 ? 'Pilih →' : ''}</span>
        </div>
      </div>
    </article>
  );
}

function Time({ time, place, end }: { time: string; place: string; end?: boolean }) {
  return (
    <div className={`w-[110px] min-w-0 ${end ? 'text-right' : ''}`}>
      <p className="text-[17px] font-extrabold leading-tight">{time}</p>
      <p className="truncate text-[11px] text-muted">{place}</p>
    </div>
  );
}

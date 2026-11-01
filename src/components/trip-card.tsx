import { BusPhoto, PoLogo } from '@/components/bus-photo';
import { FacilityChips } from '@/components/facility-chips';
import { formatDuration, formatRupiah } from '@/lib/format';
import type { Trip } from '@/lib/types';

export function TripCard({ trip }: { trip: Trip }) {
  const cheapest = trip.tiers.reduce<number | null>((min, t) => (min === null || t.price < min ? t.price : min), null);
  const oldPrice = trip.tiers[0]?.oldPrice;
  const free = trip.tiers.reduce((n, t) => n + t.freeSeats.length, 0);
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
      <BusPhoto src={trip.image} alt={trip.poName} className="h-36 w-full shrink-0 rounded-xl sm:h-auto sm:w-44" />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PoLogo src={trip.logo} alt={trip.poName} />
              <h3 className="font-bold">{trip.poName}</h3>
            </div>
            <p className="text-sm text-slate-500">{trip.busClass}</p>
          </div>
          {cheapest !== null && (
            <div className="text-right">
              {oldPrice ? <p className="text-xs text-slate-400 line-through">{formatRupiah(oldPrice)}</p> : null}
              <p className="text-lg font-extrabold text-brand">{formatRupiah(cheapest)}</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <div>
            <p className="text-base font-bold">{trip.depart}</p>
            <p className="text-slate-500">{trip.boardPoint}</p>
          </div>
          <span className="flex-1 border-t border-dashed border-slate-300 text-center text-xs text-slate-400">
            {formatDuration(trip.durationMinutes)}
          </span>
          <div className="text-right">
            <p className="text-base font-bold">{trip.arrive}</p>
            <p className="text-slate-500">{trip.dropPoint}</p>
          </div>
        </div>
        <div className="mt-3">
          <FacilityChips codes={trip.facilities} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">{free > 0 ? `${free} kursi tersedia` : 'Kursi habis'}</p>
          {free > 0 && <span className="text-sm font-semibold text-brand">Pilih kursi →</span>}
        </div>
      </div>
    </article>
  );
}

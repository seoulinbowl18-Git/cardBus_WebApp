import { formatDuration, formatRupiah } from '@/lib/format';
import type { Trip } from '@/lib/types';

export function TripCard({ trip }: { trip: Trip }) {
  const cheapest = trip.tiers.reduce<number | null>((min, t) => (min === null || t.price < min ? t.price : min), null);
  const free = trip.tiers.reduce((n, t) => n + t.freeSeats.length, 0);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">{trip.poName}</h3>
          <p className="text-sm text-slate-500">{trip.busClass}</p>
        </div>
        {cheapest !== null && <p className="text-lg font-extrabold text-brand">{formatRupiah(cheapest)}</p>}
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
      <p className="mt-3 text-xs text-slate-500">{free} kursi tersedia</p>
    </article>
  );
}

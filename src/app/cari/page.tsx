import type { Metadata } from 'next';
import Link from 'next/link';
import { TripCard, cheapestTier, seatsLeft } from '@/components/trip-card';
import { ApiError } from '@/lib/api/client';
import { tripApi } from '@/lib/api/endpoints';
import { addDays, dateParts, shortDate, todayWib } from '@/lib/format';
import type { Trip } from '@/lib/types';

export const metadata: Metadata = { title: 'Hasil Pencarian' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const SORTS = {
  cheapest: { label: 'Termurah', fn: (a: Trip, b: Trip) => (cheapestTier(a)?.price ?? 0) - (cheapestTier(b)?.price ?? 0) },
  earliest: { label: 'Paling awal', fn: (a: Trip, b: Trip) => a.depart.localeCompare(b.depart) },
  mostSeats: { label: 'Kursi terbanyak', fn: (a: Trip, b: Trip) => seatsLeft(b) - seatsLeft(a) },
} as const;
type SortKey = keyof typeof SORTS;

/**
 * Hasil pencarian, mengikuti ResultsScreen mobile: judul rute + tanggal, pilihan 7 hari,
 * urutan (Termurah / Paling awal / Kursi terbanyak), dan kartu jadwal.
 * Server Component: jadwal diambil langsung dari backend saat render (GET /api/trips).
 */
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const from = one(sp.from).trim();
  const to = one(sp.to).trim();
  const today = todayWib();
  // Tanpa tanggal (mis. dari banner promo di Beranda) = hari ini.
  const date = one(sp.date) || today;
  const sort: SortKey = one(sp.sort) in SORTS ? (one(sp.sort) as SortKey) : 'cheapest';
  const href = (q: Record<string, string>) => `/cari?${new URLSearchParams({ from, to, date, sort, ...q })}`;

  let trips: Trip[] = [];
  let error: string | null = null;
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    error = 'Lengkapi kota asal, tujuan, dan tanggal.';
  } else {
    try {
      trips = await tripApi.search({ from, to, date });
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Gagal memuat jadwal';
    }
  }
  // Yang masih ada kursinya di atas, lalu sesuai urutan yang dipilih
  trips = [...trips].sort((a, b) => Number(seatsLeft(b) > 0) - Number(seatsLeft(a) > 0) || SORTS[sort].fn(a, b));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  if (date >= today && !days.includes(date)) days.push(date);

  return (
    <section className="space-y-4">
      <div className="-mx-4 -mt-8 space-y-3 rounded-b-[24px] bg-[linear-gradient(135deg,#0a8c84_0%,#087f78_35%,#064e52_100%)] px-4 pb-4 pt-5 text-white sm:mx-0 sm:mt-0 sm:rounded-[24px] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold sm:text-2xl">
              {from || '…'} → {to || '…'}
            </h1>
            <p className="text-sm text-[#cfe9e6]">{shortDate(date)} · {trips.length} jadwal</p>
          </div>
          <Link href="/" className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">
            Ubah
          </Link>
        </div>
        {from && to && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {days.map((d) => {
              const p = dateParts(d);
              const on = d === date;
              return (
                <Link
                  key={d}
                  href={href({ date: d })}
                  aria-current={on ? 'date' : undefined}
                  className={`flex h-[62px] w-[58px] shrink-0 flex-col items-center justify-center rounded-[14px] text-[11px] transition ${on ? 'bg-white text-brand' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <span className="font-semibold">{d === today ? 'Hari ini' : p.dow}</span>
                  <span className="text-[17px] font-extrabold leading-tight">{p.day}</span>
                  <span>{p.mon}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {!error && trips.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {(Object.keys(SORTS) as SortKey[]).map((k) => (
            <Link
              key={k}
              href={href({ sort: k })}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${k === sort ? 'border-brand bg-teal-soft text-brand' : 'border-line bg-white text-ink'}`}
            >
              {SORTS[k].label}
            </Link>
          ))}
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {!error && trips.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="font-bold">Belum ada jadwal untuk rute & tanggal ini.</p>
          <p className="mt-1 text-sm text-muted">Coba pilih tanggal lain di atas, atau ubah rute.</p>
        </div>
      )}
      <div className="grid gap-2.5">
        {trips.map((t) =>
          seatsLeft(t) > 0 ? (
            <Link
              key={`${t.id}-${t.date}`}
              href={`/checkout?${new URLSearchParams({ tripId: t.id, from, to, date })}`}
              className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <TripCard trip={t} />
            </Link>
          ) : (
            <TripCard key={`${t.id}-${t.date}`} trip={t} />
          ),
        )}
      </div>
    </section>
  );
}

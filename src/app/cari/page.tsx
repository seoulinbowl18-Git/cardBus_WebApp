import type { Metadata } from 'next';
import Link from 'next/link';
import { TripCard } from '@/components/trip-card';
import { ApiError } from '@/lib/api/client';
import { tripApi } from '@/lib/api/endpoints';
import { formatDate } from '@/lib/format';
import type { Trip } from '@/lib/types';

export const metadata: Metadata = { title: 'Hasil Pencarian' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// Server Component: jadwal diambil langsung dari backend saat render (GET /api/trips).
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const from = one(sp.from).trim();
  const to = one(sp.to).trim();
  const date = one(sp.date);

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

  return (
    <section className="space-y-4">
      <Link href="/" className="text-sm text-brand">← Ubah pencarian</Link>
      <h1 className="text-2xl font-bold">
        {from || '…'} → {to || '…'}
      </h1>
      {date && !error && <p className="text-slate-600">{formatDate(date)}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!error && trips.length === 0 && <p className="text-slate-500">Belum ada jadwal untuk rute dan tanggal ini.</p>}
      <div className="grid gap-3">
        {trips.map((t) => (
          // TODO: halaman checkout (pilih kursi, penumpang, metode bayar -> orderApi.create)
          <TripCard key={`${t.id}-${t.date}`} trip={t} />
        ))}
      </div>
    </section>
  );
}

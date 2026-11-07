import type { Metadata } from 'next';
import Link from 'next/link';
import { RequireAuth } from '@/components/require-auth';
import { CheckoutForm } from './checkout-form';

export const metadata: Metadata = { title: 'Checkout' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// /checkout?tripId=..&from=..&to=..&date=YYYY-MM-DD[&tier=..] — dibuka dari kartu jadwal di /cari.
export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const params = {
    tripId: one(sp.tripId),
    from: one(sp.from),
    to: one(sp.to),
    date: one(sp.date),
    tier: one(sp.tier) || undefined,
    boardPoint: one(sp.boardPoint) || undefined,
    dropPoint: one(sp.dropPoint) || undefined,
  };
  const valid = /^[a-f0-9]{24}$/i.test(params.tripId) && params.from && params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.date);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">Pesan Tiket</h1>
      {valid ? (
        <RequireAuth>
          <CheckoutForm {...params} />
        </RequireAuth>
      ) : (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">
          Data jadwal tidak lengkap. <Link href="/" className="underline">Cari jadwal lagi</Link>.
        </p>
      )}
    </section>
  );
}

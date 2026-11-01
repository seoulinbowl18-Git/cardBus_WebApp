'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { ApiError } from '@/lib/api/client';
import { orderApi } from '@/lib/api/endpoints';
import { formatDate, formatRupiah } from '@/lib/format';
import type { Order } from '@/lib/types';

function OrderList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderApi
      .list()
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat tiket'));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>;
  if (!orders) return <p className="text-slate-500">Memuat…</p>;
  if (orders.length === 0) return <p className="text-slate-500">Belum ada tiket.</p>;

  return (
    <ul className="grid gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/pesanan/${o.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand">
            <div className="flex justify-between">
              <span className="font-bold">{o.from} → {o.to}</span>
              <span className="text-sm font-semibold">{o.ticketStatusLabel ?? o.statusLabel}</span>
            </div>
            <p className="text-sm text-slate-500">
              {o.poName} · {formatDate(o.date)} {o.depart ?? ''} · Kursi {o.seats.join(', ')}
            </p>
            <p className="mt-1 text-sm font-semibold">{formatRupiah(o.total)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Tiket Saya</h1>
      <RequireAuth>
        <OrderList />
      </RequireAuth>
    </section>
  );
}

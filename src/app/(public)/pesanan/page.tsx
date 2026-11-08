'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { RequireAuth } from '@/components/require-auth';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError } from '@/lib/api/client';
import { orderApi } from '@/lib/api/endpoints';
import { csWhatsappUrl } from '@/lib/cs';
import { formatRupiah, shortDate } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Tiket Saya, mengikuti OrdersScreen di aplikasi mobile. */
function OrderList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderApi
      .list()
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat tiket'));
  }, []);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!orders) return <p className="py-10 text-center text-muted">Memuat…</p>;
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-soft text-brand"><Icon name="ticket" className="h-7 w-7" /></span>
        <p className="mt-3 font-bold">Belum ada tiket</p>
        <p className="mt-1 text-sm text-muted">Tiket yang sudah dibayar akan muncul di sini.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-gold px-6 py-2.5 font-extrabold text-ink hover:brightness-95">Cari tiket</Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {orders.map((o) => {
        const again = `/cari?${new URLSearchParams({ from: o.from, to: o.to })}`;
        return (
          <li key={o.id} className="rounded-2xl border border-line bg-white transition hover:border-brand">
            <Link href={`/pesanan/${o.id}`} className="block p-3.5 pb-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-extrabold">{o.from} → {o.to}</span>
                <StatusBadge order={o} />
              </div>
              <p className="text-xs text-muted">PO {o.poName ?? '-'} · {o.busClass}</p>
              <p className="text-xs text-muted">{shortDate(o.date)}{o.depart ? ` · ${o.depart}` : ''} · kursi {o.seats.join(', ')}</p>
              <p className="mt-1 text-sm font-bold">{formatRupiah(o.total)}</p>
            </Link>
            <div className="flex items-center gap-1 border-t border-line px-3.5 py-2">
              <span className="text-sm font-extrabold">Kode {o.code}</span>
              <span className="flex-1" />
              {o.ticketStatus === 'active' && (
                <a
                  href={csWhatsappUrl(`Halo CS CardBus, saya ingin membatalkan tiket dengan kode ${o.code}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#9b1c1c] hover:bg-red-50"
                >
                  Batalkan
                </a>
              )}
              <Link href={again} className="rounded-lg px-2.5 py-1.5 text-sm font-extrabold text-brand hover:bg-teal-soft">Beli Lagi</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">Tiket Saya</h1>
      <RequireAuth>
        <OrderList />
      </RequireAuth>
      <p className="text-center text-xs text-faint">
        Pembatalan tiket lewat CS sesuai <Link href="/akun/pembatalan" className="font-semibold text-brand">ketentuan pengembalian dana</Link>.
      </p>
    </section>
  );
}

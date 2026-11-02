'use client';

import { use, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RequireAuth } from '@/components/require-auth';
import { ApiError } from '@/lib/api/client';
import { orderApi } from '@/lib/api/endpoints';
import { config } from '@/lib/config';
import { formatDate, formatDateTimeWib, formatRupiah } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Detail pesanan: tampilkan QRIS / VA saat pending dan pantau status (sama dengan PaymentRepository.get di mobile). */
function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const o = await orderApi.get(id);
        if (stop) return;
        setOrder(o);
        setError(null);
        if (o.status === 'pending') timer = setTimeout(load, config.paymentPollMs);
      } catch (e) {
        if (stop) return;
        setError(e instanceof ApiError ? e.message : 'Gagal memuat pesanan');
        if (!(e instanceof ApiError) || e.status === 0) timer = setTimeout(load, config.paymentPollMs);
      }
    };
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!order) return error ? <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : <p className="text-slate-500">Memuat…</p>;
  const p = order.payment;

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex justify-between">
        <span className="font-mono text-lg font-bold">{order.code}</span>
        <span className="font-semibold">{order.ticketStatusLabel ?? order.statusLabel}</span>
      </div>
      <p>
        {order.from} → {order.to} · {formatDate(order.date)} {order.depart ?? ''}
      </p>
      <p className="text-sm text-slate-600">
        {order.poName} {order.busClass} · Naik di {order.boardPoint} · Turun di {order.dropPoint}
      </p>
      <p className="text-sm text-slate-600">Kursi {order.seats.join(', ')} · {order.passengers.join(', ')}</p>
      <p className="text-lg font-bold">{formatRupiah(order.total)}</p>

      {order.status === 'pending' && (
        <div className="space-y-2 rounded-xl border border-dashed border-brand p-4 text-center">
          {p.qrString && <QRCodeSVG value={p.qrString} size={220} className="mx-auto" />}
          {p.vaNumber && (
            <p>
              {p.bankName ?? p.bankCode}: <span className="font-mono text-xl font-bold">{p.vaNumber}</span>
            </p>
          )}
          {p.expiredAt && <p className="text-sm text-slate-500">Bayar sebelum {formatDateTimeWib(p.expiredAt)}</p>}
          <p className="text-xs text-slate-400">Status diperbarui otomatis.</p>
        </div>
      )}

      {order.status === 'paid' && order.ticketStatus === 'active' && (
        <div className="text-center">
          {/* QR e-tiket = kode booking, dipindai PO saat check-in */}
          <QRCodeSVG value={order.code} size={180} className="mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Tunjukkan QR ini saat naik bus.</p>
        </div>
      )}
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Detail Pesanan</h1>
      <RequireAuth>
        <OrderDetail id={id} />
      </RequireAuth>
    </section>
  );
}

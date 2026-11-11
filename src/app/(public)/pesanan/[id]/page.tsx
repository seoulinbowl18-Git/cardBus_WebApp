'use client';

import Link from 'next/link';
import { use, useEffect, useState, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '@/components/icons';
import { RequireAuth } from '@/components/require-auth';
import { ReviewAction } from '@/components/review-dialog';
import { ApiError } from '@/lib/api/client';
import { orderApi } from '@/lib/api/endpoints';
import { config } from '@/lib/config';
import { countdown, formatDateTimeWib, formatRupiah, shortDate } from '@/lib/format';
import { PAYMENT_METHODS, type Order } from '@/lib/types';
import { useUi } from '@/providers/ui-provider';

const methodLabel = (o: Order) => PAYMENT_METHODS.find((m) => m.value === o.payment.method)?.label ?? o.payment.method;
/** 8277123456789012 → "8277 1234 5678 9012" */
const groupDigits = (s: string) => s.replace(/(.{4})(?=.)/g, '$1 ');

/** Status pesanan dipantau berkala selama menunggu pembayaran (PaymentRepository.get di mobile). */
function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0); // naik setelah ulasan terkirim → ambil ulang pesanan

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
  }, [id, reload]);

  if (!order) return error ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : <p className="py-10 text-center text-muted">Memuat…</p>;
  if (order.status === 'pending') return <Payment order={order} />;
  if (order.status === 'paid')
    return (
      <ETicket
        order={order}
        onReviewed={() => {
          setOrder({ ...order, reviewed: true, canReview: false });
          setReload((n) => n + 1);
        }}
      />
    );
  return <Closed order={order} />;
}

/** Menunggu pembayaran: QRIS / VA + hitung mundur (PaymentScreen mobile). */
function Payment({ order: o }: { order: Order }) {
  const { toast } = useUi();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = o.payment;
  const until = p.expiredAt ?? o.expiresAt;
  const left = until ? countdown(new Date(until).getTime(), now) : null;
  const isQris = !!p.qrString;

  async function copyVa() {
    try {
      await navigator.clipboard.writeText(p.vaNumber!);
      toast('Nomor VA disalin');
    } catch {
      toast('Gagal menyalin. Salin manual nomor VA di atas.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">Pembayaran</h1>
      <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
        <div>
          <p className="font-bold">Total bayar</p>
          <p className="text-xs text-muted">{methodLabel(o)}</p>
          {o.discount ? <p className="text-xs font-semibold text-brand">Termasuk voucher − {formatRupiah(o.discount)}</p> : null}
        </div>
        <p className="text-xl font-extrabold text-brand-dark">{formatRupiah(o.total)}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-white p-5 text-center">
        <span className="inline-block rounded-full bg-[#fff4d6] px-3 py-1 text-[11px] font-extrabold tracking-wide text-[#8a5a00]">
          {o.statusLabel.toUpperCase()}
        </span>
        {isQris && (
          <div className="mx-auto w-fit rounded-2xl border border-line bg-white p-3">
            <QRCodeSVG value={p.qrString!} size={220} />
          </div>
        )}
        {!isQris && p.vaNumber && (
          <div className="rounded-2xl border border-line p-4">
            <p className="font-bold">{p.bankName ?? p.bankCode ?? 'Virtual Account'}</p>
            <p className="my-1 select-all font-mono text-2xl font-extrabold tracking-wider">{groupDigits(p.vaNumber)}</p>
            <button onClick={copyVa} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand">
              <Icon name="doc" className="h-4 w-4" /> Salin nomor VA
            </button>
          </div>
        )}
        <p className="text-muted">{isQris ? 'Scan QR di atas pakai e-wallet / m-banking.' : 'Transfer tepat sesuai total ke nomor VA di atas.'}</p>
        {until && (
          <p className="text-sm font-bold text-[#9b1c1c]">
            {left ? `Bayar dalam ${left}` : 'Batas bayar habis, memeriksa status…'}
            <span className="block text-xs font-medium text-faint">Batas: {formatDateTimeWib(until)}</span>
          </p>
        )}
        <p className="text-xs text-faint">Kode pesanan {o.code} · status diperbarui otomatis</p>
        {p.paymentUrl && (
          <a href={p.paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-bold text-brand underline">
            Buka halaman pembayaran Komerce
          </a>
        )}
      </div>

      <TripSummary order={o} />
      <p className="text-center text-xs text-muted">
        Tagihan tetap berlaku sampai batas waktu. Jika sudah membayar, e-tiket terbit otomatis setelah pembayaran diterima.
      </p>
    </div>
  );
}

/** E-tiket setelah lunas (TicketScreen mobile). */
function ETicket({ order: o, onReviewed }: { order: Order; onReviewed: () => void }) {
  const { openCsHelp, toast } = useUi();
  const active = o.ticketStatus === 'active';
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">E-tiket</h1>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white">
        <div className="bg-[linear-gradient(135deg,#0a8c84_0%,#087f78_35%,#064e52_100%)] p-4 text-white">
          <p className="text-lg font-extrabold">PO {o.poName ?? '-'}</p>
          <p className="text-[#cfe9e6]">{o.busClass}</p>
          <p className="mt-1.5 text-xs font-extrabold text-gold">
            {active ? 'LUNAS · AKTIF' : (o.ticketStatusLabel ?? o.statusLabel).toUpperCase()}
          </p>
        </div>
        <div className="p-4">
          <div className={`text-center ${active ? '' : 'opacity-40'}`}>
            {/* QR e-tiket = kode booking, dipindai PO saat check-in */}
            <QRCodeSVG value={o.code} size={170} className="mx-auto" />
            <p className="mt-2 font-extrabold tracking-wider">Kode booking: {o.code}</p>
          </div>
          {/* Sobekan tiket */}
          <div className="relative my-4 border-t-2 border-dashed border-line">
            <span className="absolute -left-7 -top-3 h-6 w-6 rounded-full bg-[#f4f7f7]" />
            <span className="absolute -right-7 -top-3 h-6 w-6 rounded-full bg-[#f4f7f7]" />
          </div>
          <dl className="space-y-1.5">
            <Row k="Rute" v={`${o.from} → ${o.to}`} />
            <Row k="Tanggal" v={shortDate(o.date)} />
            <Row k="Berangkat" v={`${o.depart ?? '-'} · ${o.boardPoint}`} />
            <Row k="Turun di" v={o.dropPoint} />
            <Row k="Kursi" v={o.seats.join(', ')} />
            <Row k="Penumpang" v={o.passengers.join(', ')} />
            <Row k="Dibayar" v={`${formatRupiah(o.total)} · ${methodLabel(o)}`} />
            {o.discount ? <Row k="Voucher" v={`− ${formatRupiah(o.discount)}`} /> : null}
            {o.checkedInAt && <Row k="Check-in" v={formatDateTimeWib(o.checkedInAt)} />}
          </dl>
        </div>
      </div>
      {(o.canReview || o.reviewed) && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{o.reviewed ? 'Terima kasih atas ulasanmu!' : 'Bagaimana perjalananmu?'}</p>
            <p className="text-xs text-muted">
              {o.reviewed ? 'Ulasanmu membantu penumpang lain memilih bus.' : `Beri rating & ulasan untuk PO ${o.poName ?? ''}.`}
            </p>
          </div>
          <ReviewAction order={o} onReviewed={onReviewed} onToast={toast} className="shrink-0" />
        </div>
      )}
      {active && <p className="text-center text-muted">Tunjukkan QR ini ke kru / agen saat naik bus. Datang paling lambat 30 menit sebelum berangkat.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/" className="rounded-xl border border-brand py-3 text-center font-bold text-brand hover:bg-teal-soft">Kembali ke beranda</Link>
        <button onClick={openCsHelp} className="rounded-xl border border-line bg-white py-3 font-bold text-ink hover:border-brand">Hubungi CS</button>
      </div>
    </div>
  );
}

/** Kedaluwarsa / dibatalkan sebelum dibayar. */
function Closed({ order: o }: { order: Order }) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-line bg-white p-6 text-center">
        <p className="text-lg font-extrabold">{o.status === 'expired' ? 'Waktu pembayaran habis' : 'Pesanan dibatalkan'}</p>
        <p className="mt-1 text-muted">Kursi sudah dilepas. Silakan pilih kursi dan buat pesanan baru.</p>
        <Link
          href={`/cari?${new URLSearchParams({ from: o.from, to: o.to, date: o.date })}`}
          className="mt-4 inline-block rounded-xl bg-gold px-6 py-3 font-extrabold text-ink hover:brightness-95"
        >
          Pilih kursi lagi
        </Link>
      </div>
      <TripSummary order={o} />
    </div>
  );
}

function TripSummary({ order: o }: { order: Order }) {
  return (
    <Box>
      <p className="font-extrabold">PO {o.poName ?? '-'} · {o.busClass}</p>
      <p className="text-sm text-muted">{o.from} → {o.to} · {shortDate(o.date)}{o.depart ? `, ${o.depart}` : ''}</p>
      <p className="text-sm text-muted">Naik di {o.boardPoint} · Turun di {o.dropPoint}</p>
      <p className="text-sm text-muted">Kursi {o.seats.join(', ')} · {o.passengers.join(', ')}</p>
    </Box>
  );
}

const Box = ({ children }: { children: ReactNode }) => <div className="space-y-0.5 rounded-2xl border border-line bg-white p-4">{children}</div>;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 text-[13px]">
      <dt className="w-[92px] shrink-0 text-muted">{k}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <OrderDetail id={id} />
    </RequireAuth>
  );
}

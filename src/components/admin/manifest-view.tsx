'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { adminApi, type Manifest, type ManifestFilter, type ManifestRow, type ManifestStatus, type Partner } from '@/lib/api/admin';
import { formatRupiah } from '@/lib/format';
import { Card, ErrorBox, btnSecondary, inputCls } from './ui';

/** Tanggal hari ini (WIB) YYYY-MM-DD */
export const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const shiftDate = (d: string, days: number) => new Date(Date.parse(`${d}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
const longDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const STATUS: Record<ManifestStatus, { label: string; cls: string }> = {
  pending: { label: 'Menunggu bayar', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Lunas · e-tiket', cls: 'bg-emerald-100 text-emerald-800' },
  boarded: { label: 'Sudah naik', cls: 'bg-teal-soft text-brand-dark' },
  completed: { label: 'Selesai', cls: 'bg-slate-100 text-slate-700' },
  expired: { label: 'Kedaluwarsa', cls: 'bg-slate-100 text-faint' },
  cancelled: { label: 'Batal', cls: 'bg-red-100 text-red-700' },
};
const FILTERS: [ManifestFilter, string][] = [['active', 'Aktif (lunas + menunggu)'], ['paid', 'Lunas saja'], ['pending', 'Menunggu bayar'], ['all', 'Semua status']];

/** Urut kursi alami: awalan, nomor baris, huruf (1A, 1B, 2C, … 10A; SS1, SS2) */
function seatKey(seat: string): [string, number, string] {
  const m = /^(\D*)(\d+)(\D*)$/.exec(seat);
  return m ? [m[1], Number(m[2]), m[3]] : [seat, 0, ''];
}
function bySeat(a: ManifestRow, b: ManifestRow) {
  const [pa, na, la] = seatKey(a.seat);
  const [pb, nb, lb] = seatKey(b.seat);
  return pa.localeCompare(pb) || na - nb || la.localeCompare(lb);
}
const waLink = (phone: string) => `https://wa.me/62${phone.replace(/\D/g, '').replace(/^(62|0)/, '')}`;

function toCsv(rows: ManifestRow[]) {
  const head = ['Jadwal', 'Jam', 'Kursi', 'Dek', 'Kelas', 'Nama penumpang', 'WhatsApp', 'Email', 'Status', 'Kode booking', 'Naik', 'Turun', 'Harga'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    `${r.poName ?? ''} ${r.busClass ?? ''}`.trim(), r.depart, r.seat, r.deck ?? '', r.tierName ?? '', r.passenger ?? '', r.phone ?? '', r.email ?? '',
    STATUS[r.status].label, r.code, `${r.from ?? ''} · ${r.boardPoint ?? ''}`, `${r.to ?? ''} · ${r.dropPoint ?? ''}`, r.unitPrice,
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...lines].join('\r\n');
}

/**
 * Manifest penumpang Admin Pusat. Dengan `tripId`: satu jadwal (tab Manifest di detail jadwal).
 * Tanpa `tripId`: rekap global harian semua jadwal, dengan filter PO & jadwal.
 */
export function ManifestView({ tripId, initialDate }: { tripId?: string; initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? todayWib());
  const [status, setStatus] = useState<ManifestFilter>('active');
  const [poId, setPoId] = useState('');
  const [pickedTrip, setPickedTrip] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);

  const load = useCallback(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError(null);
    adminApi
      .manifest({ date, status, tripId: tripId || pickedTrip || undefined, poId: tripId ? undefined : poId || undefined }, ctl.signal)
      .then((m) => setData(m))
      .catch((e) => {
        if (!ctl.signal.aborted) setError(e instanceof ApiError ? e.message : 'Gagal memuat manifest');
      })
      .finally(() => !ctl.signal.aborted && setLoading(false));
    return () => ctl.abort();
  }, [date, status, tripId, pickedTrip, poId]);
  useEffect(load, [load]);
  useEffect(() => {
    if (!tripId) adminApi.partners().then(setPartners).catch(() => {});
  }, [tripId]);

  const rows = useMemo(() => {
    if (!data) return [];
    const n = q.trim().toLowerCase();
    const order = new Map(data.trips.map((t, i) => [t.tripId, i]));
    return data.rows
      .filter((r) => !n || [r.passenger, r.phone, r.code, r.seat, r.email].some((x) => x?.toLowerCase().includes(n)))
      .sort((a, b) => (order.get(a.tripId) ?? 0) - (order.get(b.tripId) ?? 0) || (a.deckNo ?? 0) - (b.deckNo ?? 0) || bySeat(a, b));
  }, [data, q]);

  const download = () => {
    const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `manifest-${tripId ? `jadwal-${tripId}-` : ''}${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const showTrip = !tripId && !pickedTrip;
  const hasDeck = rows.some((r) => r.deck);

  return (
    <div className="space-y-4">
      <Card className="print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Tanggal berangkat
            <span className="flex items-center gap-1">
              <button type="button" className={`${btnSecondary} px-2.5`} onClick={() => setDate((d) => shiftDate(d, -1))} aria-label="Hari sebelumnya">‹</button>
              <input type="date" className={`${inputCls} w-40`} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              <button type="button" className={`${btnSecondary} px-2.5`} onClick={() => setDate((d) => shiftDate(d, 1))} aria-label="Hari berikutnya">›</button>
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Status
            <select className={`${inputCls} w-52`} value={status} onChange={(e) => setStatus(e.target.value as ManifestFilter)}>
              {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {!tripId && (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium">
                PO mitra
                <select className={`${inputCls} w-48`} value={poId} onChange={(e) => { setPoId(e.target.value); setPickedTrip(''); }}>
                  <option value="">Semua PO</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Jadwal
                <select className={`${inputCls} w-64`} value={pickedTrip} onChange={(e) => setPickedTrip(e.target.value)}>
                  <option value="">Semua jadwal ({data?.trips.length ?? 0})</option>
                  {(data?.trips ?? []).map((t) => (
                    <option key={t.tripId} value={t.tripId}>{t.depart.replace(':', '.')} · {t.poName} · {t.busClass}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Cari
            <input className={`${inputCls} min-w-44`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama, WhatsApp, kode booking, kursi" />
          </label>
          <div className="flex gap-2">
            <button type="button" className={btnSecondary} onClick={download} disabled={!rows.length}>Unduh CSV</button>
            <button type="button" className={btnSecondary} onClick={() => window.print()} disabled={!rows.length}>Cetak</button>
          </div>
        </div>

        <h2 className="mt-4 font-bold print:mt-0">Manifest penumpang · {longDate(date)}</h2>
        {data && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ['Penumpang', data.totals.passengers],
              ['Lunas', data.totals.paid],
              ['Menunggu bayar', data.totals.pending],
              ['Sudah naik', data.totals.boarded],
            ] as const).map(([l, v]) => (
              <div key={l} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-muted">{l}</p>
                <p className="text-lg font-bold">{v}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : (
        <>
          {showTrip && data && data.trips.length > 0 && (
            <Card className="print:hidden">
              <h3 className="mb-2 font-bold">Rekap per jadwal</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs text-faint">
                    <tr><th className="pb-2">Jam</th><th className="pb-2">Jadwal</th><th className="pb-2">Terisi</th><th className="pb-2">Lunas</th><th className="pb-2">Menunggu</th><th className="pb-2">Sudah naik</th><th /></tr>
                  </thead>
                  <tbody>
                    {data.trips.map((t) => (
                      <tr key={t.tripId} className="border-t border-line">
                        <td className="py-2 font-semibold">{t.depart.replace(':', '.')}</td>
                        <td className="py-2">{t.poName} · {t.busClass}{t.deleted && <span className="ml-1 text-xs text-red-700">(dihapus)</span>}</td>
                        <td className="py-2">{t.paid + t.pending}/{t.capacity || '–'}</td>
                        <td className="py-2">{t.paid}</td>
                        <td className="py-2">{t.pending}</td>
                        <td className="py-2">{t.boarded}</td>
                        <td className="py-2 text-right">
                          <button type="button" className="text-xs font-semibold text-brand" onClick={() => setPickedTrip(t.tripId)}>Lihat manifest</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="print:border-0 print:p-0 print:shadow-none">
            {pickedTrip && !tripId && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <p className="text-sm font-semibold">
                  {(() => {
                    const t = data?.trips.find((x) => x.tripId === pickedTrip);
                    return t ? `${t.depart.replace(':', '.')} · ${t.poName} · ${t.busClass}` : 'Jadwal terpilih';
                  })()}
                </p>
                <span className="flex gap-3 text-sm font-semibold">
                  <Link href={`/admin/jadwal/${pickedTrip}`} className="text-brand">Buka jadwal →</Link>
                  <button type="button" className="text-muted" onClick={() => setPickedTrip('')}>Semua jadwal</button>
                </span>
              </div>
            )}
            {loading && !data ? (
              <p className="py-8 text-center text-sm text-muted">Memuat manifest…</p>
            ) : rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-muted">
                Belum ada penumpang {status === 'all' ? '' : 'aktif '}pada tanggal ini{q ? ' yang cocok dengan pencarian' : ''}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${showTrip ? 'min-w-[1060px]' : 'min-w-[900px]'}`} aria-label="Manifest penumpang">
                  <thead className="text-left text-xs text-faint">
                    <tr>
                      <th className="pb-2 pr-2">#</th>
                      {showTrip && <th className="pb-2 pr-2">Jadwal</th>}
                      <th className="pb-2 pr-2">Kursi</th>
                      <th className="pb-2 pr-2">Nama penumpang</th>
                      <th className="pb-2 pr-2">Kelas</th>
                      <th className="pb-2 pr-2">WhatsApp</th>
                      <th className="pb-2 pr-2">Status</th>
                      <th className="pb-2 pr-2">Kode</th>
                      <th className="pb-2">Naik → Turun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.bookingId}-${r.seat}`} className={`border-t border-line align-top ${r.status === 'expired' || r.status === 'cancelled' ? 'text-faint' : ''}`}>
                        <td className="py-2 pr-2 text-xs text-faint">{i + 1}</td>
                        {showTrip && (
                          <td className="py-2 pr-2">
                            <span className="font-semibold">{r.depart.replace(':', '.')}</span> {r.poName}
                            <span className="block text-xs text-muted">{r.busClass}</span>
                          </td>
                        )}
                        <td className="py-2 pr-2">
                          <span className="text-base font-extrabold text-ink">{r.seat}</span>
                          {hasDeck && r.deck && <span className="mt-0.5 block text-[11px] font-semibold text-brand-dark">{r.deck}</span>}
                        </td>
                        <td className="py-2 pr-2 font-semibold">{r.passenger ?? '—'}</td>
                        <td className="py-2 pr-2">
                          {r.tierName ?? '—'}
                          <span className="block text-xs text-muted">{formatRupiah(r.unitPrice)}</span>
                        </td>
                        <td className="py-2 pr-2">
                          {r.phone ? (
                            <a href={waLink(r.phone)} target="_blank" rel="noreferrer" className="font-semibold text-brand print:text-ink">{r.phone}</a>
                          ) : '—'}
                          {r.email && <span className="block max-w-[180px] truncate text-xs text-muted">{r.email}</span>}
                        </td>
                        <td className="py-2 pr-2">
                          <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                        </td>
                        <td className="py-2 pr-2 font-mono text-xs">{r.code}</td>
                        <td className="py-2 text-xs">
                          {r.boardPoint ?? r.from} → {r.dropPoint ?? r.to}
                          <span className="block text-muted">{r.from} → {r.to}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

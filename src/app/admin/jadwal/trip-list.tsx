'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ErrorBox, PageHead, StatusPill, btnPrimary, inputCls } from '@/components/admin/ui';
import { BusPhoto } from '@/components/bus-photo';
import { ApiError } from '@/lib/api/client';
import { TRIP_STATUS, adminApi, daysText, type Partner, type TripStatus, type TripSummary } from '@/lib/api/admin';
import { formatRupiah } from '@/lib/format';

/** Daftar jadwal semua PO (GET /api/admin/trips), filter PO & status lewat URL agar bisa dibagikan. */
export function TripList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const poId = params.get('poId') ?? '';
  const status = params.get('status') ?? '';

  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [removing, setRemoving] = useState<TripSummary | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(params.has('dihapus') ? 'Jadwal dihapus dan ditarik dari aplikasi penumpang.' : null);

  const load = useCallback(() => {
    setError(null);
    adminApi
      .trips({ poId: poId || undefined, status: status || undefined })
      .then(setTrips)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat jadwal'));
  }, [poId, status]);
  useEffect(load, [load]);
  useEffect(() => {
    adminApi.partners().then(setPartners).catch(() => {});
  }, []);

  const setFilter = (k: 'poId' | 'status', v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`);
  };

  async function toggle(t: TripSummary) {
    const to = t.status === 'live' ? 'draft' : 'live';
    setBusyId(t.id);
    setError(null);
    try {
      const updated = await adminApi.setTripStatus(t.id, to);
      setTrips((list) => list?.map((x) => (x.id === t.id ? updated : x)) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengubah status');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(t: TripSummary) {
    setBusyId(t.id);
    setRemoveError(null);
    try {
      const r = await adminApi.deleteTrip(t.id);
      setTrips((list) => list?.filter((x) => x.id !== t.id) ?? null);
      setRemoving(null);
      setNotice(`${t.poName} · ${t.busClass} ${t.depart.replace(':', '.')} dihapus${r.bookings ? `; ${r.bookings} pesanan tetap tersimpan` : ''}.`);
    } catch (e) {
      setRemoveError(e instanceof ApiError ? e.message : 'Gagal menghapus');
    } finally {
      setBusyId(null);
    }
  }

  const inactive = new Set(partners.filter((p) => !p.active).map((p) => p.id));
  const needle = q.trim().toLowerCase();
  const shown = (trips ?? []).filter(
    (t) => !needle || [t.poName, t.busClass, t.busType, t.depart, ...t.cities].some((s) => s?.toLowerCase().includes(needle)),
  );

  return (
    <>
      <PageHead
        title="Jadwal, Rute & Harga"
        sub="Jadwal Tayang langsung tampil di aplikasi penumpang; Draf disembunyikan."
        action={
          <Link href="/admin/jadwal/baru" className={btnPrimary}>
            + Jadwal baru
          </Link>
        }
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_200px]">
        <input className={inputCls} placeholder="Cari kota, kelas, jam…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari jadwal" />
        <select className={inputCls} value={poId} onChange={(e) => setFilter('poId', e.target.value)} aria-label="Filter PO">
          <option value="">Semua PO</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter status">
          <option value="">Semua status</option>
          {(Object.keys(TRIP_STATUS) as TripStatus[]).map((s) => (
            <option key={s} value={s}>{TRIP_STATUS[s].label}</option>
          ))}
        </select>
      </div>
      {error && <div className="mb-3"><ErrorBox message={error} onRetry={load} /></div>}
      {notice && <p role="status" className="mb-3 rounded-lg bg-[#e5f4ea] p-3 text-sm font-semibold text-[#1f6a3a]">{notice}</p>}
      {removing && (
        <ConfirmDialog
          title="Hapus jadwal ini?"
          confirmLabel="Hapus jadwal"
          confirmText={removing.status === 'live' ? 'HAPUS' : undefined}
          busy={busyId === removing.id}
          error={removeError}
          onConfirm={() => remove(removing)}
          onCancel={() => {
            setRemoving(null);
            setRemoveError(null);
          }}
        >
          <p>
            <b className="text-ink">{removing.poName} · {removing.busClass} {removing.depart.replace(':', '.')}</b>
            {removing.status === 'live' ? ' sedang tayang dan' : ''} langsung hilang dari aplikasi penumpang dan dari daftar ini.
          </p>
          <p>Pesanan yang sudah ada tetap tersimpan: tiket penumpang tetap berlaku dan omzet tetap tercatat.</p>
          <p>Kalau hanya ingin menyembunyikan sementara, pakai <b>Sembunyikan</b>.</p>
        </ConfirmDialog>
      )}
      {!trips && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {trips && !shown.length && <p className="py-10 text-center text-muted">Tidak ada jadwal di filter ini.</p>}
      {trips && shown.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">PO · Kelas</th>
                <th className="px-3 py-2.5 font-semibold">Jam · Hari</th>
                <th className="px-3 py-2.5 font-semibold">Kota dilayani</th>
                <th className="px-3 py-2.5 text-right font-semibold">Harga mulai</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <BusPhoto src={t.imageUrl} alt={t.poName ?? t.poId} className="h-11 w-16 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <Link href={`/admin/jadwal/${t.id}`} className="font-bold hover:text-brand">
                          {t.poName} · {t.busClass}
                        </Link>
                        <p className="text-xs text-faint">
                          {t.busType ?? ''} {t.seats} kursi · {t.photos} foto
                          {inactive.has(t.poId) && <span className="ml-1 font-semibold text-red-700">· PO nonaktif</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {t.depart.replace(':', '.')}
                    <p className="text-xs text-faint">{daysText(t.days)}</p>
                  </td>
                  <td className="max-w-[260px] px-3 py-3">
                    <span className="line-clamp-2">{t.cities.join(', ')}</span>
                    <p className="text-xs text-faint">{t.routes} rute</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.minPrice ? formatRupiah(t.minPrice) : '–'}</td>
                  <td className="px-3 py-3"><StatusPill status={t.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(t)}
                      disabled={busyId === t.id}
                      className="mr-3 font-semibold text-brand hover:underline disabled:opacity-50"
                    >
                      {t.status === 'live' ? 'Sembunyikan' : 'Tayangkan'}
                    </button>
                    <Link href={`/admin/jadwal/${t.id}`} className="mr-3 font-semibold text-ink hover:underline">Ubah</Link>
                    <button onClick={() => setRemoving(t)} disabled={busyId === t.id} className="font-semibold text-red-700 hover:underline disabled:opacity-50">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

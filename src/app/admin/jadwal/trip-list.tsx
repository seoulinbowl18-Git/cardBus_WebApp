'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBox, PageHead, StatusPill, btnPrimary, inputCls } from '@/components/admin/ui';
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
      {!trips && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {trips && !shown.length && <p className="py-10 text-center text-muted">Tidak ada jadwal di filter ini.</p>}
      {trips && shown.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[820px] text-sm">
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
                    <Link href={`/admin/jadwal/${t.id}`} className="font-bold hover:text-brand">
                      {t.poName} · {t.busClass}
                    </Link>
                    <p className="text-xs text-faint">
                      {t.busType ?? ''} {t.seats} kursi
                      {inactive.has(t.poId) && <span className="ml-1 font-semibold text-red-700">· PO nonaktif</span>}
                    </p>
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
                    <Link href={`/admin/jadwal/${t.id}`} className="font-semibold text-ink hover:underline">Ubah</Link>
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

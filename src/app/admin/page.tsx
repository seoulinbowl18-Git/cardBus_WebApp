'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Card, ErrorBox, PageHead } from '@/components/admin/ui';
import { PoBadge } from '@/components/ui/po-badge';
import { ApiError } from '@/lib/api/client';
import { adminApi, type Stats } from '@/lib/api/admin';
import { formatRupiah } from '@/lib/format';

const PERIODS = [7, 30, 90];

/** Ringkasan omzet & komisi dari pesanan lunas (GET /api/admin/stats). */
export default function AdminSummaryPage() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi
      .stats(days)
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat ringkasan'));
  }, [days]);
  useEffect(load, [load]);

  const t = stats?.totals;
  const maxGross = Math.max(1, ...(stats?.partners.map((p) => p.gross) ?? [0]));

  return (
    <>
      <PageHead
        title="Ringkasan"
        sub="Penjualan lewat aplikasi & web (pesanan lunas). Omzet = nilai tiket sebelum voucher."
        action={
          <div role="group" aria-label="Periode" className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm font-semibold">
            {PERIODS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`rounded-md px-3 py-1.5 ${days === d ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
              >
                {d} hari
              </button>
            ))}
          </div>
        }
      />
      {error && <ErrorBox message={error} onRetry={load} />}
      {!stats && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {stats && t && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Omzet" value={formatRupiah(t.gross)} sub={`${t.orders} pesanan`} />
            <Tile label="Tiket terjual" value={String(t.tickets)} sub="kursi lunas" />
            <Tile label="Komisi CardBus" value={formatRupiah(t.commission)} sub="omzet × tarif komisi PO" accent />
            <Tile label="Diskon voucher" value={formatRupiah(t.discount)} sub="ditanggung CardBus" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <Card>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Omzet harian</h2>
              <DailyChart daily={stats.daily} />
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Jadwal</h2>
              <ul className="space-y-2 text-sm">
                {(
                  [
                    ['live', 'Tayang di aplikasi'],
                    ['draft', 'Draf (tersembunyi)'],
                    ['review', 'Menunggu validasi PO'],
                    ['fix', 'Perlu koreksi'],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k}>
                    <Link href={`/admin/jadwal?status=${k}`} className="flex justify-between rounded-lg px-2 py-1.5 hover:bg-teal-soft">
                      <span>{label}</span>
                      <b className="tabular-nums">{stats.trips[k] ?? 0}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="overflow-x-auto">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Per mitra PO</h2>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-faint">
                <tr>
                  <th className="pb-2 font-semibold">PO</th>
                  <th className="pb-2 text-right font-semibold">Tiket</th>
                  <th className="pb-2 pl-6 font-semibold">Omzet</th>
                  <th className="pb-2 text-right font-semibold">Komisi</th>
                </tr>
              </thead>
              <tbody>
                {stats.partners.map((p) => (
                  <tr key={p.poId} className="border-t border-line">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2.5">
                        <PoBadge name={p.short} logo={p.logo} size={30} />
                        <span className="font-semibold">{p.name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{p.tickets}</td>
                    <td className="py-2.5 pl-6">
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-32 overflow-hidden rounded bg-teal-soft">
                          <span className="block h-full rounded bg-brand" style={{ width: `${(p.gross / maxGross) * 100}%` }} />
                        </span>
                        <span className="tabular-nums">{formatRupiah(p.gross)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <b className="text-brand-dark">{formatRupiah(p.commission)}</b>
                      <span className="ml-1 text-xs text-faint">({Math.round(p.commissionRate * 1000) / 10}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-brand bg-teal-soft' : 'border-line bg-white'}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${accent ? 'text-brand-dark' : ''}`}>{value}</p>
      <p className="mt-0.5 text-xs text-faint">{sub}</p>
    </div>
  );
}

/** Batang omzet per hari (WIB). Label tanggal dijarangkan agar terbaca pada periode panjang. */
function DailyChart({ daily }: { daily: Stats['daily'] }) {
  const max = Math.max(...daily.map((d) => d.gross));
  if (!max) return <p className="py-8 text-center text-sm text-muted">Belum ada pesanan lunas di periode ini.</p>;
  const every = Math.ceil(daily.length / 10);
  return (
    <div className="flex h-44 items-end gap-[3px]" role="img" aria-label="Grafik omzet harian">
      {daily.map((d, i) => (
        <div key={d.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
          <div
            className="rounded-t bg-brand/80 group-hover:bg-brand"
            style={{ height: `${Math.max(2, (d.gross / max) * 100)}%` }}
            title={`${d.date}: ${formatRupiah(d.gross)} · ${d.tickets} tiket`}
          />
          <span className="mt-1 h-3 text-center text-[10px] text-faint">{i % every === 0 ? d.date.slice(8) : ''}</span>
        </div>
      ))}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, ErrorBox, Field, StatusPill, btnDanger, btnPrimary, btnSecondary, inputCls } from '@/components/admin/ui';
import { ApiError } from '@/lib/api/client';
import {
  DAY_ORDER, adminApi, dowName, type Partner, type TripDetail, type TripInput, type TripPromo, type TripRoute, type TripStatus, type TripTier,
} from '@/lib/api/admin';
import { formatDuration, formatRupiah } from '@/lib/format';

type Tab = 'jadwal' | 'rute' | 'harga';
const PAGE = 60;

interface Form {
  poId: string;
  busClass: string;
  busType: string;
  seatType: string;
  depart: string;
  days: number[];
  facilities: string;
  routes: TripRoute[];
  tiers: TripTier[];
  promos: TripPromo[];
  status: TripStatus;
}

const NEW_FORM: Form = {
  poId: '', busClass: 'Executive', busType: '', seatType: '', depart: '19:00', days: [0, 1, 2, 3, 4, 5, 6], facilities: '',
  routes: [{ from: '', to: '', boardPoint: '', dropPoint: '', minutes: 480 }],
  tiers: [{ key: 'base', name: 'Executive', price: 0, seats: [] }],
  promos: [],
  status: 'draft',
};

const fromDetail = (t: TripDetail): Form => ({
  poId: t.poId, busClass: t.busClass ?? '', busType: t.busType ?? '', seatType: t.seatType ?? '', depart: t.depart, days: t.days,
  facilities: t.facilities.join(', '), routes: t.routes, tiers: t.tiers, promos: t.promos, status: t.status,
});

const savedText = (status: TripStatus) =>
  status === 'live' ? 'Tersimpan dan tayang di aplikasi penumpang.' : 'Tersimpan. Jadwal belum tayang (draf).';

const routeLabel = (r: Pick<TripRoute, 'from' | 'to'>) => `${r.from || '?'} → ${r.to || '?'}`;
const seatList = (s: string) => s.toUpperCase().split(/[\s,]+/).filter(Boolean);

/** "routes.3.minutes" → "Rute #4 (minutes)" agar pesan validasi backend menunjuk baris yang tepat. */
function issuePlace(path: string) {
  const [k, i, f] = path.split('.');
  const name = { routes: 'Rute', tiers: 'Varian', promos: 'Promo' }[k];
  return name && i ? `${name} #${Number(i) + 1}${f ? ` (${f})` : ''}` : path;
}

/** Editor jadwal Admin Pusat: data jadwal, rute (titik naik/turun & durasi), varian kursi & harga, promo. */
export default function TripEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'baru';
  const router = useRouter();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [form, setForm] = useState<Form | null>(isNew ? NEW_FORM : null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tab, setTab] = useState<Tab>('jadwal');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ message: string; issues?: string[] } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    if (isNew) return;
    setLoadError(null);
    adminApi
      .trip(id)
      .then((t) => {
        setTrip(t);
        setForm(fromDetail(t));
        // Baru dibuat di /admin/jadwal/baru: halaman ini dimuat ulang, jadi pesan tersimpan dibawa lewat ?dibuat=1
        if (new URLSearchParams(window.location.search).has('dibuat')) {
          setSaved(savedText(t.status));
          window.history.replaceState(null, '', window.location.pathname);
        }
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat jadwal'));
  }, [id, isNew]);
  useEffect(load, [load]);
  useEffect(() => {
    adminApi.partners().then(setPartners).catch(() => {});
  }, []);

  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K] | ((old: Form[K]) => Form[K])) => {
    setSaved(null);
    setForm((f) => (f ? { ...f, [k]: typeof v === 'function' ? (v as (o: Form[K]) => Form[K])(f[k]) : v } : f));
  }, []);

  async function save() {
    if (!form) return;
    setBusy(true);
    setSaveError(null);
    setSaved(null);
    const body: TripInput = {
      ...(isNew && { poId: form.poId }),
      busClass: form.busClass, busType: form.busType || null, seatType: form.seatType || null, depart: form.depart, days: form.days,
      facilities: form.facilities.split(',').map((s) => s.trim()).filter(Boolean),
      routes: form.routes, tiers: form.tiers, promos: form.promos,
      // Status menunggu validasi / perlu koreksi dari aplikasi Mitra dibiarkan kecuali admin memilih Draf / Tayang.
      ...((form.status === 'draft' || form.status === 'live') && { status: form.status }),
    };
    try {
      const t = isNew ? await adminApi.createTrip(body) : await adminApi.updateTrip(id, body);
      if (isNew) {
        router.replace(`/admin/jadwal/${t.id}?dibuat=1`);
        return;
      }
      setTrip(t);
      setForm(fromDetail(t));
      setSaved(savedText(t.status));
    } catch (e) {
      if (e instanceof ApiError) {
        const issues = (e.body as { issues?: { path: string; message: string }[] } | undefined)?.issues;
        setSaveError({ message: e.message, issues: issues?.slice(0, 5).map((i) => `${issuePlace(i.path)}: ${i.message}`) });
      } else setSaveError({ message: 'Gagal menyimpan' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await adminApi.deleteTrip(id);
      router.replace('/admin/jadwal');
    } catch (e) {
      setSaveError({ message: e instanceof ApiError ? e.message : 'Gagal menghapus' });
      setConfirmDelete(false);
      setBusy(false);
    }
  }

  if (loadError) return <ErrorBox message={loadError} onRetry={load} />;
  if (!form) return <p className="py-10 text-center text-muted">Memuat…</p>;

  const po = partners.find((p) => p.id === form.poId);
  const hasLayout = Boolean(trip?.hasLayout);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/jadwal" className="text-sm font-semibold text-brand">← Semua jadwal</Link>
          <h1 className="mt-1 text-2xl font-bold">
            {isNew ? 'Jadwal baru' : `${trip?.poName ?? ''} · ${trip?.busClass ?? ''} ${trip?.depart.replace(':', '.') ?? ''}`}
          </h1>
          {trip && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <StatusPill status={trip.status} /> {trip.routes.length} rute · {trip.bookings} pesanan
              {po && !po.active && <span className="font-semibold text-red-700">· PO nonaktif: jadwal tidak tampil walau Tayang</span>}
            </p>
          )}
        </div>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-line">
        {([['jadwal', 'Jadwal'], ['rute', `Rute (${form.routes.length})`], ['harga', 'Harga & Promo']] as const).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`border-b-2 px-4 pb-2.5 pt-1 text-sm font-bold ${tab === k ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'jadwal' && <ScheduleTab form={form} set={set} isNew={isNew} partners={partners} />}
      {tab === 'rute' && <RoutesTab routes={form.routes} setRoutes={(f) => set('routes', f)} />}
      {tab === 'harga' && <PricesTab form={form} set={set} hasLayout={hasLayout} />}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
        <button className={btnPrimary} onClick={save} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        {saved && <span role="status" className="text-sm font-semibold text-[#1f6a3a]">{saved}</span>}
        {!isNew && trip && trip.bookings === 0 && (
          <span className="ml-auto">
            {confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Hapus permanen?
                <button className={btnDanger} onClick={remove} disabled={busy}>Ya, hapus</button>
                <button className={btnSecondary} onClick={() => setConfirmDelete(false)}>Batal</button>
              </span>
            ) : (
              <button className={btnDanger} onClick={() => setConfirmDelete(true)}>Hapus jadwal</button>
            )}
          </span>
        )}
        {saveError && (
          <div className="w-full">
            <ErrorBox message={saveError.message} />
            {saveError.issues && saveError.issues.length > 1 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-red-700">{saveError.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type SetField = <K extends keyof Form>(k: K, v: Form[K] | ((old: Form[K]) => Form[K])) => void;

function ScheduleTab({ form, set, isNew, partners }: { form: Form; set: SetField; isNew: boolean; partners: Partner[] }) {
  const kuota = partners.filter((p) => p.level < 2);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="PO mitra" hint={isNew ? 'Hanya PO Mode Kuota. PO tidak bisa diganti setelah disimpan.' : 'PO tidak bisa diganti.'}>
          <select className={inputCls} value={form.poId} disabled={!isNew} onChange={(e) => set('poId', e.target.value)}>
            <option value="">Pilih PO</option>
            {(isNew ? kuota : partners).map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.active ? '' : ' (nonaktif)'}</option>
            ))}
          </select>
        </Field>
        <Field label="Kelas bus">
          <input className={inputCls} value={form.busClass} onChange={(e) => set('busClass', e.target.value)} placeholder="Executive, VIP, Sleeper…" />
        </Field>
        <Field label="Jam berangkat (WIB)" hint="Dari titik naik pertama">
          <input type="time" className={inputCls} value={form.depart} onChange={(e) => set('depart', e.target.value)} />
        </Field>
        <Field label="Tipe armada (opsional)">
          <input className={inputCls} value={form.busType} onChange={(e) => set('busType', e.target.value)} placeholder="Double Decker" />
        </Field>
        <Field label="Format kursi (opsional)">
          <input className={inputCls} value={form.seatType} onChange={(e) => set('seatType', e.target.value)} placeholder="2-1 · 21 kursi" />
        </Field>
        <Field label="Fasilitas" hint="Pisahkan dengan koma, mis. wifi, toilet, usb">
          <input className={inputCls} value={form.facilities} onChange={(e) => set('facilities', e.target.value)} />
        </Field>
      </div>
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Hari jalan</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_ORDER.map((d) => {
            const on = form.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => set('days', (old) => (on ? old.filter((x) => x !== d) : [...old, d]))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${on ? 'border-brand bg-teal-soft text-brand-dark' : 'border-slate-300 text-muted'}`}
              >
                {dowName(d)}
              </button>
            );
          })}
          <button type="button" onClick={() => set('days', [0, 1, 2, 3, 4, 5, 6])} className="px-2 text-sm font-semibold text-brand">Setiap hari</button>
        </div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-2 text-sm">
          {([['draft', 'Draf', 'Disembunyikan dari penumpang'], ['live', 'Tayang', 'Langsung tampil di aplikasi penumpang']] as const).map(([s, label, hint]) => (
            <label key={s} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${form.status === s ? 'border-brand bg-teal-soft' : 'border-slate-300'}`}>
              <input type="radio" name="status" className="mt-1" checked={form.status === s} onChange={() => set('status', s)} />
              <span className="font-medium">{label}<span className="block text-xs font-normal text-faint">{hint}</span></span>
            </label>
          ))}
          {(form.status === 'review' || form.status === 'fix') && (
            <span className="self-center text-xs text-muted">Sekarang: <StatusPill status={form.status} /> (tidak berubah kecuali dipilih)</span>
          )}
        </div>
      </fieldset>
    </Card>
  );
}

/** Saring baris rute + batasi tampilan (jadwal data armada bisa punya ratusan rute). Kembalikan indeks asli. */
function useRouteFilter(routes: TripRoute[]) {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    return routes
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !n || [r.from, r.to, r.boardPoint, r.dropPoint].some((s) => s.toLowerCase().includes(n)));
  }, [routes, q]);
  const search = (
    <input
      className={`${inputCls} max-w-xs`}
      placeholder="Saring kota / titik…"
      aria-label="Saring rute"
      value={q}
      onChange={(e) => {
        setQ(e.target.value);
        setLimit(PAGE);
      }}
    />
  );
  const more =
    matches.length > limit ? (
      <button className="mt-3 text-sm font-semibold text-brand" onClick={() => setLimit((l) => l + PAGE)}>
        Tampilkan lebih banyak ({matches.length - limit} lagi)
      </button>
    ) : null;
  return { shown: matches.slice(0, limit), total: matches.length, search, more, clear: () => setQ('') };
}

function RoutesTab({ routes, setRoutes }: { routes: TripRoute[]; setRoutes: (f: (old: TripRoute[]) => TripRoute[]) => void }) {
  const { shown, total, search, more, clear } = useRouteFilter(routes);
  const edit = (i: number, patch: Partial<TripRoute>) => setRoutes((old) => old.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRoutes((old) => old.filter((_, j) => j !== i));
  const add = (r: TripRoute) => {
    clear();
    setRoutes((old) => [r, ...old]);
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Setiap pasangan kota yang bisa dipesan penumpang, dengan titik naik/turun dan lama perjalanan.</p>
        <div className="flex gap-2">
          {search}
          <button className={btnSecondary} onClick={() => add({ from: '', to: '', boardPoint: '', dropPoint: '', minutes: 480 })}>+ Rute</button>
        </div>
      </div>
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Tidak ada rute yang cocok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-semibold">Dari</th>
                <th className="pb-2 font-semibold">Titik naik</th>
                <th className="pb-2 font-semibold">Ke</th>
                <th className="pb-2 font-semibold">Titik turun</th>
                <th className="pb-2 font-semibold">Durasi (menit)</th>
                <th className="pb-2 font-semibold">Jam khusus</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map(({ r, i }) => (
                <tr key={i} className="border-t border-line">
                  <Cell><input className={inputCls} value={r.from} onChange={(e) => edit(i, { from: e.target.value })} aria-label="Kota asal" /></Cell>
                  <Cell><input className={inputCls} value={r.boardPoint} onChange={(e) => edit(i, { boardPoint: e.target.value })} aria-label="Titik naik" /></Cell>
                  <Cell><input className={inputCls} value={r.to} onChange={(e) => edit(i, { to: e.target.value })} aria-label="Kota tujuan" /></Cell>
                  <Cell><input className={inputCls} value={r.dropPoint} onChange={(e) => edit(i, { dropPoint: e.target.value })} aria-label="Titik turun" /></Cell>
                  <Cell>
                    <input
                      className={`${inputCls} w-24`}
                      inputMode="numeric"
                      value={r.minutes || ''}
                      onChange={(e) => edit(i, { minutes: Number(e.target.value.replace(/\D/g, '')) })}
                      aria-label="Durasi menit"
                    />
                    <span className="mt-0.5 block text-[11px] text-faint">{r.minutes ? formatDuration(r.minutes) : ''}</span>
                  </Cell>
                  <Cell>
                    <input
                      type="time"
                      className={`${inputCls} w-28`}
                      value={r.depart ?? ''}
                      onChange={(e) => edit(i, { depart: e.target.value || undefined })}
                      aria-label="Jam berangkat khusus"
                    />
                  </Cell>
                  <Cell>
                    <span className="flex gap-2 whitespace-nowrap">
                      <button
                        className="text-xs font-semibold text-brand"
                        title="Tambah rute arah sebaliknya"
                        onClick={() => add({ from: r.to, to: r.from, boardPoint: r.dropPoint, dropPoint: r.boardPoint, minutes: r.minutes })}
                      >
                        ⇄ Balik
                      </button>
                      <button className="text-xs font-semibold text-red-700" onClick={() => remove(i)} aria-label={`Hapus rute ${routeLabel(r)}`}>Hapus</button>
                    </span>
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {more}
    </Card>
  );
}

const Cell = ({ children }: { children: ReactNode }) => <td className="py-2 pr-2 align-top">{children}</td>;

function PricesTab({ form, set, hasLayout }: { form: Form; set: SetField; hasLayout: boolean }) {
  const { shown, total, search, more } = useRouteFilter(form.routes);
  const editTier = (i: number, patch: Partial<TripTier>) => set('tiers', (old) => old.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setRoutePrice = (ri: number, key: string, value: string) =>
    set('routes', (old) =>
      old.map((r, j) => {
        if (j !== ri) return r;
        const prices = { ...r.prices };
        const n = Number(value.replace(/\D/g, ''));
        if (n) prices[key] = n;
        else delete prices[key];
        return { ...r, prices: Object.keys(prices).length ? prices : undefined };
      }),
    );
  const pairs = useMemo(() => [...new Map(form.routes.map((r) => [`${r.from}>${r.to}`, r])).values()], [form.routes]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Varian kursi & harga dasar</h2>
          {!hasLayout && (
            <button className={btnSecondary} onClick={() => set('tiers', (old) => [...old, { key: `v${old.length + 1}`, name: '', price: 0, seats: [] }])}>
              + Varian
            </button>
          )}
        </div>
        {hasLayout && (
          <p className="mb-3 rounded-lg bg-teal-soft p-2.5 text-xs text-brand-dark">
            Jadwal ini memakai denah kursi tetap dari data armada: nama dan harga varian bisa diubah, nomor kursinya mengikuti denah.
          </p>
        )}
        <div className="space-y-3">
          {form.tiers.map((t, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[120px_1fr_160px]">
              <Field label="Kode" hint="huruf kecil">
                <input className={inputCls} value={t.key} disabled={hasLayout} onChange={(e) => editTier(i, { key: e.target.value.toLowerCase() })} />
              </Field>
              <Field label="Nama varian">
                <input className={inputCls} value={t.name} onChange={(e) => editTier(i, { name: e.target.value })} placeholder="Executive" />
              </Field>
              <Field label="Harga per kursi (Rp)" hint={t.price ? formatRupiah(t.price) : 'minimal Rp 10.000'}>
                <input className={inputCls} inputMode="numeric" value={t.price || ''} onChange={(e) => editTier(i, { price: Number(e.target.value.replace(/\D/g, '')) })} />
              </Field>
              <Field label={`Nomor kursi (${t.seats.length})`} hint={hasLayout ? 'Mengikuti denah' : 'Pisahkan dengan koma, mis. 1A, 1B, 2A'} className="sm:col-span-3">
                <SeatInput seats={t.seats} disabled={hasLayout} onChange={(seats) => editTier(i, { seats })} />
              </Field>
              {!hasLayout && form.tiers.length > 1 && (
                <button className="justify-self-start text-xs font-semibold text-red-700" onClick={() => set('tiers', (old) => old.filter((_, j) => j !== i))}>
                  Hapus varian
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold">Harga khusus per rute</h2>
            <p className="text-xs text-muted">Kosong = memakai harga dasar varian.</p>
          </div>
          {search}
        </div>
        {total === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Belum ada rute.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 260 + form.tiers.length * 150 }}>
              <thead className="text-left text-xs text-faint">
                <tr>
                  <th className="pb-2 font-semibold">Rute</th>
                  {form.tiers.map((t) => <th key={t.key} className="pb-2 font-semibold">{t.name || t.key}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map(({ r, i }) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-2 pr-3">{routeLabel(r)}<span className="block text-[11px] text-faint">{r.boardPoint}</span></td>
                    {form.tiers.map((t) => (
                      <td key={t.key} className="py-2 pr-2">
                        <input
                          className={inputCls}
                          inputMode="numeric"
                          placeholder={t.price ? String(t.price) : ''}
                          value={r.prices?.[t.key] ?? ''}
                          onChange={(e) => setRoutePrice(i, t.key, e.target.value)}
                          aria-label={`Harga ${t.name || t.key} ${routeLabel(r)}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {more}
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold">Promo</h2>
            <p className="text-xs text-muted">Harga coret untuk varian pertama ({form.tiers[0]?.name || '–'}) pada rute tertentu.</p>
          </div>
          <button
            className={btnSecondary}
            disabled={!pairs.length}
            onClick={() => set('promos', (old) => [...old, { from: pairs[0].from, to: pairs[0].to, price: 0 }])}
          >
            + Promo
          </button>
        </div>
        {form.promos.length === 0 && <p className="text-sm text-muted">Belum ada promo.</p>}
        <div className="space-y-2">
          {form.promos.map((p, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <Field label="Rute" className="min-w-[220px] flex-1">
                <select
                  className={inputCls}
                  value={`${p.from}>${p.to}`}
                  onChange={(e) => {
                    const [from, to] = e.target.value.split('>');
                    set('promos', (old) => old.map((x, j) => (j === i ? { ...x, from, to } : x)));
                  }}
                >
                  {!pairs.some((r) => r.from === p.from && r.to === p.to) && <option value={`${p.from}>${p.to}`}>{routeLabel(p)} (rute tidak ada)</option>}
                  {pairs.map((r) => <option key={`${r.from}>${r.to}`} value={`${r.from}>${r.to}`}>{routeLabel(r)}</option>)}
                </select>
              </Field>
              <Field label="Harga promo (Rp)" className="w-44">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={p.price || ''}
                  onChange={(e) => set('promos', (old) => old.map((x, j) => (j === i ? { ...x, price: Number(e.target.value.replace(/\D/g, '')) } : x)))}
                />
              </Field>
              <button className="pb-2 text-xs font-semibold text-red-700" onClick={() => set('promos', (old) => old.filter((_, j) => j !== i))}>Hapus</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Kursi diketik bebas lalu dirapikan saat kolom ditinggalkan (agar koma/spasi tidak hilang saat mengetik). */
function SeatInput({ seats, disabled, onChange }: { seats: string[]; disabled: boolean; onChange: (s: string[]) => void }) {
  const [text, setText] = useState(seats.join(', '));
  useEffect(() => setText(seats.join(', ')), [seats]);
  return (
    <textarea
      className={`${inputCls} font-mono`}
      rows={2}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(seatList(text))}
    />
  );
}

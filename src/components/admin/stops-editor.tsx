'use client';

import { useEffect, useMemo, useState } from 'react';
import { locationApi } from '@/lib/api/endpoints';
import { STOP_TYPES, routesFromStops, stopsProblem, type TripStop } from '@/lib/api/admin';
import { formatDuration } from '@/lib/format';
import { Card, btnSecondary, inputCls } from './ui';

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const toClock = (min: number) => {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * Editor perhentian satu jadwal. Waktu diisi sebagai jam (WIB) + hari ke-, disimpan sebagai menit sejak jam
 * berangkat jadwal. Rute (kota Naik × kota Turun sesudahnya) dibangkitkan di backend saat disimpan; pratinjaunya
 * tampil di bawah daftar.
 */
export function StopsEditor({
  stops, depart, onChange,
}: {
  stops: TripStop[];
  depart: string;
  onChange: (f: (old: TripStop[]) => TripStop[]) => void;
}) {
  const base = toMin(depart);
  const [places, setPlaces] = useState<{ cities: string[]; points: string[] }>({ cities: [], points: [] });
  useEffect(() => {
    const ctl = new AbortController();
    locationApi
      .list(ctl.signal)
      .then((l) => setPlaces({ cities: l.cities.map((c) => c.name), points: [...new Set(l.points.map((p) => p.name))] }))
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  const edit = (i: number, patch: Partial<TripStop>) => onChange((old) => old.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    onChange((old) => {
      const next = [...old];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const add = () =>
    onChange((old) => {
      const last = old[old.length - 1];
      return [...old, { city: '', point: '', minutes: last ? last.minutes + 60 : 0, type: old.length ? 'drop' : 'board' }];
    });
  /** Jam / hari diubah → menit sejak berangkat (boleh negatif sementara; ditandai sebagai kesalahan). */
  const setTime = (i: number, clock: string, day: number) => edit(i, { minutes: day * 1440 + toMin(clock) - base });

  const problem = stopsProblem(stops);
  const preview = useMemo(() => routesFromStops(stops), [stops]);

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl text-sm text-muted">
          <p>
            Urutan perhentian bus dari berangkat sampai tiba. Penumpang melihatnya lewat tombol <b className="text-ink">Lihat rute &amp; N perhentian</b> di
            web dan aplikasi mobile (tanpa perlu APK baru).
          </p>
          <p className="mt-1">
            Setiap kota <b className="text-ink">Naik</b> dengan kota <b className="text-ink">Turun</b> sesudahnya otomatis menjadi rute yang bisa dipesan; harga per
            rute diatur di tab Harga &amp; Promo.
          </p>
          <p className="mt-1">
            Jam berangkat jadwal: <b className="text-ink">{depart.replace(':', '.')} WIB</b> (tab Jadwal). Perhentian pertama biasanya pada jam ini.
          </p>
        </div>
        <button type="button" className={btnSecondary} onClick={add}>+ Perhentian</button>
      </div>

      {stops.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-muted">
          Belum ada perhentian. Jadwal ini memakai rute di tab Rute saja (tanpa tombol &quot;Lihat rute&quot;).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-semibold">#</th>
                <th className="pb-2 font-semibold">Tipe</th>
                <th className="pb-2 font-semibold">Kota</th>
                <th className="pb-2 font-semibold">Titik / terminal</th>
                <th className="pb-2 font-semibold">Jam (WIB)</th>
                <th className="pb-2 font-semibold">Hari</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stops.map((s, i) => {
                const abs = base + s.minutes;
                const day = Math.max(0, Math.floor(abs / 1440));
                const wrong = s.minutes < 0 || (i > 0 && s.minutes < stops[i - 1].minutes);
                return (
                  <tr key={i} className="border-t border-line">
                    <td className="py-2 pr-2 align-top text-xs font-bold text-faint">{i + 1}</td>
                    <td className="py-2 pr-2 align-top">
                      <select
                        className={`${inputCls} w-32`}
                        value={s.type}
                        onChange={(e) => edit(i, { type: e.target.value as TripStop['type'] })}
                        aria-label={`Tipe perhentian ${i + 1}`}
                      >
                        {STOP_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input className={inputCls} list="stop-cities" value={s.city} placeholder="Solo" onChange={(e) => edit(i, { city: e.target.value })} aria-label={`Kota perhentian ${i + 1}`} />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input className={inputCls} list="stop-points" value={s.point} placeholder="Terminal Tirtonadi" onChange={(e) => edit(i, { point: e.target.value })} aria-label={`Titik perhentian ${i + 1}`} />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="time"
                        className={`${inputCls} w-28 ${wrong ? 'border-red-400' : ''}`}
                        value={toClock(abs)}
                        onChange={(e) => e.target.value && setTime(i, e.target.value, day)}
                        aria-label={`Jam perhentian ${i + 1}`}
                      />
                      <span className="mt-0.5 block text-[11px] text-faint">{s.minutes >= 0 ? `+${formatDuration(s.minutes)}` : 'sebelum berangkat'}</span>
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <select className={`${inputCls} w-24`} value={day} onChange={(e) => setTime(i, toClock(abs), Number(e.target.value))} aria-label={`Hari perhentian ${i + 1}`}>
                        <option value={0}>H</option>
                        <option value={1}>H+1</option>
                        <option value={2}>H+2</option>
                        <option value={3}>H+3</option>
                      </select>
                    </td>
                    <td className="py-2 align-top">
                      <span className="flex gap-3 whitespace-nowrap pt-2 text-xs font-semibold">
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="text-ink disabled:text-slate-300" aria-label={`Naikkan perhentian ${i + 1}`}>↑</button>
                        <button type="button" disabled={i === stops.length - 1} onClick={() => move(i, 1)} className="text-ink disabled:text-slate-300" aria-label={`Turunkan perhentian ${i + 1}`}>↓</button>
                        <button type="button" className="text-red-700" onClick={() => onChange((old) => old.filter((_, j) => j !== i))} aria-label={`Hapus perhentian ${i + 1}`}>Hapus</button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <datalist id="stop-cities">{places.cities.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="stop-points">{places.points.map((p) => <option key={p} value={p} />)}</datalist>

      {stops.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          {problem ? (
            <p role="alert" className="font-semibold text-red-700">{problem}</p>
          ) : (
            <>
              <p className="mb-1.5 font-semibold">Rute dari perhentian ({preview.length})</p>
              <ul className="space-y-0.5 text-xs text-muted">
                {preview.map((r) => (
                  <li key={`${r.from}>${r.to}`}>
                    <b className="text-ink">{r.from} → {r.to}</b> · {r.boardPoint} → {r.dropPoint} · berangkat {toClock(base + r.offset)} · {formatDuration(r.minutes)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

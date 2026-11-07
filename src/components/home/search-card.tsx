'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_ROUTE } from '@/lib/home-content';
import { addDays, dateParts as parts, todayWib } from '@/lib/format';
import { pointAllowed, useLocations, type Place } from '@/lib/locations';
import { LocationField } from './location-picker';

/**
 * Kartu cari tiket, padanan SearchCardWidget di mobile: Dari / Ke (kota atau titik naik/turun
 * tertentu, dari GET /api/locations) dengan tombol tukar, pilihan 7 hari ke depan (+ tanggal lain),
 * dan tombol emas "Cari tiket". Hasilnya link /cari?from&to&date[&boardPoint][&dropPoint].
 */
export function SearchCard() {
  const router = useRouter();
  const today = todayWib();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const locations = useLocations();
  const [from, setFrom] = useState<Place>({ city: DEFAULT_ROUTE.from, point: null });
  const [to, setTo] = useState<Place>({ city: DEFAULT_ROUTE.to, point: null });
  const [date, setDate] = useState(today);
  const sameCity = from.city === to.city;
  const customDate = !days.includes(date);

  /** Tukar asal & tujuan; titik yang tidak melayani arah sebaliknya dikembalikan ke "semua titik". */
  function swap() {
    setFrom({ city: to.city, point: pointAllowed(locations, to, 'board') });
    setTo({ city: from.city, point: pointAllowed(locations, from, 'drop') });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sameCity) return;
    const q = new URLSearchParams({ from: from.city, to: to.city, date });
    if (from.point) q.set('boardPoint', from.point);
    if (to.point) q.set('dropPoint', to.point);
    router.push(`/cari?${q}`);
  }

  return (
    <form action="/cari" onSubmit={submit} className="min-w-0 space-y-4 rounded-[22px] bg-white p-4 shadow-[0_12px_32px_rgba(6,78,82,0.14)] sm:p-5">
      <div className="relative space-y-2.5">
        <LocationField label="Dari" value={from} onChange={setFrom} pin="bg-brand" locations={locations} />
        <LocationField label="Ke" value={to} onChange={setTo} pin="bg-gold" locations={locations} />
        {/* Tanpa JavaScript, form GET tetap mengirim pilihan ini */}
        <input type="hidden" name="from" value={from.city} />
        <input type="hidden" name="to" value={to.city} />
        {from.point && <input type="hidden" name="boardPoint" value={from.point} />}
        {to.point && <input type="hidden" name="dropPoint" value={to.point} />}
        <button
          type="button"
          onClick={swap}
          aria-label="Tukar asal dan tujuan"
          title="Tukar asal dan tujuan"
          className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-[#d9f0ee] text-brand shadow transition hover:bg-brand hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 4v16M8 4 4.5 7.5M8 4l3.5 3.5M16 20V4m0 16-3.5-3.5M16 20l3.5-3.5" />
          </svg>
        </button>
      </div>
      {sameCity && <p className="text-xs font-semibold text-red-700">Kota asal dan tujuan tidak boleh sama.</p>}

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span className="text-muted">Tanggal berangkat ·</span>
          <span>{(() => { const p = parts(date); return `${p.dow}, ${p.day} ${p.mon}`; })()}</span>
        </div>
        <input type="hidden" name="date" value={date} />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {days.map((d, i) => {
            const p = parts(d);
            const on = d === date;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                aria-pressed={on}
                className={`flex h-[68px] w-16 shrink-0 flex-col items-center justify-center rounded-[14px] border text-xs transition ${on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'}`}
              >
                <span className="font-semibold">{i === 0 ? 'Hari ini' : p.dow}</span>
                <span className="text-[17px] font-extrabold leading-tight">{p.day}</span>
                <span>{p.mon}</span>
              </button>
            );
          })}
          <label
            className={`relative flex h-[68px] w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-[14px] border text-center text-[11px] font-semibold leading-tight ${customDate ? 'border-brand bg-brand text-white' : 'border-dashed border-line text-muted hover:border-brand'}`}
          >
            {customDate ? (<><span className="text-[17px] font-extrabold">{parts(date).day}</span>{parts(date).mon}</>) : (<>Tanggal<br />lain</>)}
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Pilih tanggal lain"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      <button
        disabled={sameCity}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-base font-extrabold text-ink shadow-sm transition hover:brightness-95 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        Cari tiket
      </button>
    </form>
  );
}

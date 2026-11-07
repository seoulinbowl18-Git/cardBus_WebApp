'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_ROUTE } from '@/lib/home-content';
import { dateParts, todayWib } from '@/lib/format';
import { pointAllowed, useLocations, type Place } from '@/lib/locations';
import { LocationField } from './location-picker';

/** "2026-11-02" → "02/11/2026" */
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('/');

/**
 * Bilah cari tiket horizontal: DARI · tukar · KE · TANGGAL PERJALANAN · Cari Tiket.
 * Di layar kecil menumpuk menjadi kartu. Dari/Ke memakai daftar kota & titik naik/turun dari
 * GET /api/locations; hasilnya link /cari?from&to&date[&boardPoint][&dropPoint].
 */
export function SearchCard() {
  const router = useRouter();
  const today = todayWib();
  const locations = useLocations();
  const [from, setFrom] = useState<Place>({ city: DEFAULT_ROUTE.from, point: null });
  const [to, setTo] = useState<Place>({ city: DEFAULT_ROUTE.to, point: null });
  const [date, setDate] = useState(today);
  const dateRef = useRef<HTMLInputElement>(null);
  const sameCity = from.city === to.city;
  const p = dateParts(date);

  /** Tukar asal & tujuan; titik yang tidak melayani arah sebaliknya dikembalikan ke "semua titik". */
  function swap() {
    setFrom({ city: to.city, point: pointAllowed(locations, to, 'board') });
    setTo({ city: from.city, point: pointAllowed(locations, from, 'drop') });
  }

  function openDatePicker() {
    const el = dateRef.current;
    if (!el) return;
    try {
      el.showPicker(); // Chrome, Edge, Safari 16+, Firefox
    } catch {
      el.focus();
      el.click();
    }
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
    <form
      action="/cari"
      onSubmit={submit}
      className="relative min-w-0 rounded-[22px] bg-white p-3 shadow-[0_18px_40px_-12px_rgba(4,46,49,0.45)] sm:p-4"
    >
      {/* Tanpa JavaScript, form GET tetap mengirim pilihan ini */}
      <input type="hidden" name="from" value={from.city} />
      <input type="hidden" name="to" value={to.city} />
      {from.point && <input type="hidden" name="boardPoint" value={from.point} />}
      {to.point && <input type="hidden" name="dropPoint" value={to.point} />}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-3">
        {/* DARI · tukar · KE */}
        <div className="relative flex min-w-0 flex-col gap-2 lg:flex-[2.1] lg:flex-row lg:items-center lg:gap-0">
          <LocationField label="Dari" value={from} onChange={setFrom} locations={locations} className="h-[78px] lg:flex-1" />
          <button
            type="button"
            onClick={swap}
            aria-label="Tukar asal dan tujuan"
            title="Tukar asal dan tujuan"
            className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-muted shadow-sm transition hover:border-brand hover:text-brand lg:static lg:mx-2 lg:shrink-0 lg:translate-y-0"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] rotate-90 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8h15m0 0-3.5-3.5M19 8l-3.5 3.5M20 16H5m0 0 3.5-3.5M5 16l3.5 3.5" />
            </svg>
          </button>
          <LocationField label="Ke" value={to} onChange={setTo} locations={locations} className="h-[78px] lg:flex-1" />
        </div>

        {/* TANGGAL PERJALANAN */}
        <div
          role="button"
          tabIndex={0}
          onClick={openDatePicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openDatePicker())}
          aria-label={`Tanggal perjalanan: ${p.dow}, ${p.day} ${p.mon}. Ubah`}
          className="relative flex h-[78px] min-w-0 cursor-pointer flex-col justify-center rounded-2xl border border-line bg-white px-4 py-2.5 transition hover:border-brand focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 lg:flex-1"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-faint">Tanggal perjalanan</span>
          <span className="mt-0.5 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand" fill="currentColor" aria-hidden>
              <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9ZM7 12h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-8 4h2v2H7v-2Zm4 0h2v2h-2v-2Z" />
            </svg>
            <span className="flex-1 truncate text-lg font-semibold leading-tight text-ink">{ddmmyyyy(date)}</span>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <rect x="3.5" y="5" width="17" height="15" rx="2" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4" />
            </svg>
          </span>
          <span className="mt-0.5 block truncate pl-7 text-xs text-faint">
            {date === today ? 'Hari ini' : `${p.dow === 'Min' ? 'Minggu' : p.dow}, ${p.day} ${p.mon}`}
          </span>
          {/* Input asli: pemilih tanggal bawaan browser, tetap terkirim di form GET */}
          <input
            ref={dateRef}
            type="date"
            name="date"
            min={today}
            value={date}
            onChange={(e) => e.target.value && e.target.value >= today && setDate(e.target.value)}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
          />
        </div>

        {/* Cari Tiket */}
        <button
          disabled={sameCity}
          className="flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-base font-bold text-white shadow-[0_10px_20px_-8px_rgba(8,127,120,0.8)] transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 lg:h-auto lg:self-stretch"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          Cari Tiket
        </button>
      </div>
      {sameCity && <p className="mt-2 px-1 text-xs font-semibold text-red-700">Kota asal dan tujuan tidak boleh sama.</p>}
    </form>
  );
}

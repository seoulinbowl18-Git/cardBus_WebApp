'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_ROUTE } from '@/lib/home-content';
import { dateParts, todayWib } from '@/lib/format';
import { pointAllowed, useLocations, type Place } from '@/lib/locations';
import { DatePicker } from './date-picker';
import { LocationField, SearchRow } from './location-picker';

/** "2026-11-02" → "02/11/2026" */
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('/');

/** Tanggal ISO (YYYY-MM-DD) + n hari, dihitung di UTC agar tidak bergeser zona waktu. */
const addDaysIso = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

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
  const [pickingDate, setPickingDate] = useState(false);
  const sameCity = from.city === to.city;
  const p = dateParts(date);
  // Hanya untuk tampilan tombol (memuat) selama halaman /cari disiapkan; logika cari tidak berubah.
  const [searching, startSearch] = useTransition();
  const dateHint =
    date === today ? 'Hari ini' : date === addDaysIso(today, 1) ? 'Besok' : `${p.dow === 'Min' ? 'Minggu' : p.dow}, ${p.day} ${p.mon}`;

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
    startSearch(() => router.push(`/cari?${q}`));
  }

  return (
    <form
      action="/cari"
      onSubmit={submit}
      className="relative min-w-0 rounded-[24px] bg-white p-2 shadow-[0_28px_56px_-24px_rgba(4,46,49,0.6),0_2px_8px_rgba(4,46,49,0.08)] sm:p-3"
    >
      {/* Tanpa JavaScript, form GET tetap mengirim pilihan ini */}
      <input type="hidden" name="from" value={from.city} />
      <input type="hidden" name="to" value={to.city} />
      {from.point && <input type="hidden" name="boardPoint" value={from.point} />}
      {to.point && <input type="hidden" name="dropPoint" value={to.point} />}
      <input type="hidden" name="date" value={date} />

      {/* HP: baris bertumpuk dengan garis pemisah. Desktop (lg): satu bilah dengan pemisah vertikal. */}
      <div className="flex flex-col lg:flex-row lg:items-center">
        <LocationField label="Dari" value={from} onChange={setFrom} locations={locations} className="lg:flex-1 lg:pr-8" />

        {/* Garis pemisah + tombol tukar yang menempel di atasnya. Di HP tombol sejajar kolom chevron
            (chevron ada di tengah baris, jadi tidak bertabrakan) sehingga teks tidak tertutup. */}
        <div className="relative mx-3 h-px shrink-0 bg-line lg:mx-1 lg:h-12 lg:w-px">
          <button
            type="button"
            onClick={swap}
            aria-label="Tukar asal dan tujuan"
            title="Tukar asal dan tujuan"
            className="absolute -right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-brand shadow-[0_4px_12px_-4px_rgba(4,46,49,0.25)] transition hover:border-brand/40 hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-95 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 lg:rotate-90" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 4v16m0-16L4.5 7.5M8 4l3.5 3.5M16 20V4m0 16-3.5-3.5M16 20l3.5-3.5" />
            </svg>
          </button>
        </div>

        <LocationField label="Ke" value={to} onChange={setTo} locations={locations} className="lg:flex-1 lg:pl-8" />

        <div className="mx-3 h-px shrink-0 bg-line lg:mx-1 lg:h-12 lg:w-px" aria-hidden />

        {/* TANGGAL PERJALANAN: kalender CardBus (tanggal lampau gelap & tidak bisa dipilih) */}
        <div className="relative min-w-0 lg:flex-1">
          <SearchRow
            onClick={() => setPickingDate((o) => !o)}
            ariaHasPopup="dialog"
            ariaExpanded={pickingDate}
            ariaLabel={`Tanggal perjalanan: ${p.dow}, ${p.day} ${p.mon}. Ubah`}
            active={pickingDate}
            icon={
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
                <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9ZM7 12h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-8 4h2v2H7v-2Zm4 0h2v2h-2v-2Z" />
              </svg>
            }
            label="Tanggal perjalanan"
            value={ddmmyyyy(date)}
            detail={<span className="font-semibold text-brand">{dateHint}</span>}
          />
          {pickingDate && <DatePicker value={date} min={today} onChange={setDate} onClose={() => setPickingDate(false)} />}
        </div>
      </div>

      {/* Cari Tiket: emas, teks dark teal; status tekan, nonaktif, dan memuat */}
      <div className="mt-2 flex justify-center px-1 pb-1 sm:mt-3">
        <button
          disabled={sameCity || searching}
          aria-busy={searching}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[18px] bg-gold px-10 text-[17px] font-extrabold text-brand-dark shadow-[0_12px_24px_-12px_rgba(186,128,0,0.8)] transition duration-150 hover:bg-[#ffb92e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/50 focus-visible:ring-offset-2 active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 sm:w-auto sm:min-w-[300px] [&:disabled:not([aria-busy=true])]:opacity-50"
        >
          {searching ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin motion-reduce:animate-none" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          )}
          {searching ? 'Mencari jadwal…' : 'Cari Tiket'}
        </button>
      </div>
      {sameCity && <p className="mt-1 px-3 pb-1 text-xs font-semibold text-red-700">Kota asal dan tujuan tidak boleh sama.</p>}
    </form>
  );
}

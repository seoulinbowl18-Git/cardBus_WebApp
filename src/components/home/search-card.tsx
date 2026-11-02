'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, DEFAULT_ROUTE } from '@/lib/home-content';
import { addDays, todayWib } from '@/lib/format';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Bagian tanggal dari "YYYY-MM-DD" tanpa terpengaruh zona waktu perangkat. */
function parts(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return { dow: DOW[d.getUTCDay()], day: d.getUTCDate(), mon: MON[d.getUTCMonth()] };
}

/**
 * Kartu cari tiket, padanan SearchCardWidget di mobile: Dari / Ke dengan tombol tukar,
 * pilihan 7 hari ke depan (+ tanggal lain), dan tombol emas "Cari tiket".
 * Tetap berupa <form method=GET> ke /cari, jadi hasilnya bisa dibagikan sebagai link.
 */
export function SearchCard() {
  const router = useRouter();
  const today = todayWib();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const [from, setFrom] = useState(DEFAULT_ROUTE.from);
  const [to, setTo] = useState(DEFAULT_ROUTE.to);
  const [date, setDate] = useState(today);
  const sameCity = from.trim() !== '' && from.trim().toLowerCase() === to.trim().toLowerCase();
  const customDate = !days.includes(date);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sameCity || !from.trim() || !to.trim()) return;
    router.push(`/cari?${new URLSearchParams({ from: from.trim(), to: to.trim(), date })}`);
  }

  return (
    <form action="/cari" onSubmit={submit} className="min-w-0 space-y-4 rounded-[22px] bg-white p-4 shadow-[0_12px_32px_rgba(6,78,82,0.14)] sm:p-5">
      <div className="relative space-y-2.5">
        <CityField label="Dari" name="from" value={from} onChange={setFrom} pin="bg-brand" hint={`Semua titik naik di ${from || '…'}`} />
        <CityField label="Ke" name="to" value={to} onChange={setTo} pin="bg-gold" hint={`Semua titik turun di ${to || '…'}`} />
        <button
          type="button"
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label="Tukar asal dan tujuan"
          title="Tukar asal dan tujuan"
          className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-[#d9f0ee] text-brand shadow transition hover:bg-brand hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 4v16M8 4 4.5 7.5M8 4l3.5 3.5M16 20V4m0 16-3.5-3.5M16 20l3.5-3.5" />
          </svg>
        </button>
        <datalist id="cardbus-cities">
          {CITIES.map((c) => <option key={c} value={c} />)}
        </datalist>
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

function CityField(props: { label: string; name: string; value: string; onChange: (v: string) => void; pin: string; hint: string }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-line bg-[#f8fbfb] py-2.5 pl-3 pr-16 focus-within:border-brand">
      <span className={`h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${props.pin}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{props.label}</span>
        <input
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          list="cardbus-cities"
          required
          minLength={2}
          autoComplete="off"
          className="w-full bg-transparent text-base font-extrabold text-ink outline-none"
        />
        <span className="block truncate text-xs text-faint">{props.hint}</span>
      </span>
    </label>
  );
}

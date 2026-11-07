'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays } from '@/lib/format';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']; // minggu dimulai Senin

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const ym = (s: string) => ({ y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)) - 1 });

interface Props {
  value: string; // YYYY-MM-DD
  min: string; // tanggal hari ini (WIB): sebelum ini gelap & tidak bisa dipilih
  onChange: (v: string) => void;
  onClose: () => void;
}

/**
 * Kalender CardBus (pengganti pemilih tanggal bawaan browser, yang di Safari iPad tidak
 * menggelapkan tanggal lampau). Tanggal yang sudah lewat tampil gelap dan tidak bisa dipilih.
 * HP: lembar dari bawah; layar lebar: panel di bawah kotak tanggal.
 */
export function DatePicker({ value, min, onChange, onClose }: Props) {
  const [view, setView] = useState(() => ym(value));
  const panel = useRef<HTMLDivElement>(null);
  const minView = ym(min);
  const atMinMonth = view.y === minView.y && view.m === minView.m;

  // Klik di luar / Esc menutup
  useEffect(() => {
    const onDown = (e: PointerEvent) => panel.current && !panel.current.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown)); // abaikan ketukan pembuka
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1));
    const lead = (first.getUTCDay() + 6) % 7; // Senin = 0
    const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    return [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(view.y, view.m, i + 1))];
  }, [view]);

  const move = (n: number) =>
    setView(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + n, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const pick = (d: string) => {
    onChange(d);
    onClose();
  };

  return (
    <>
      {/* Latar gelap hanya di HP (lembar dari bawah) */}
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal
        aria-label="Pilih tanggal perjalanan"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[22px] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[340px] sm:rounded-2xl sm:border sm:border-line"
      >
        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={atMinMonth}
            aria-label="Bulan sebelumnya"
            className="grid h-9 w-9 place-items-center rounded-full text-brand hover:bg-teal-soft disabled:text-line disabled:hover:bg-transparent"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
          </button>
          <p className="flex-1 text-center font-extrabold" aria-live="polite">{MONTHS[view.m]} {view.y}</p>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Bulan berikutnya"
            className="grid h-9 w-9 place-items-center rounded-full text-brand hover:bg-teal-soft"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DOW.map((d) => (
            <span key={d} className={`pb-1 text-[11px] font-bold ${d === 'Min' ? 'text-promo' : 'text-faint'}`}>{d}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`x${i}`} />;
            const past = d < min;
            const on = d === value;
            const today = d === min;
            return (
              <button
                key={d}
                type="button"
                disabled={past}
                onClick={() => pick(d)}
                aria-pressed={on}
                aria-label={`${Number(d.slice(8))} ${MONTHS[view.m]} ${view.y}${past ? ', sudah lewat' : ''}${today ? ', hari ini' : ''}`}
                className={[
                  'relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition',
                  on
                    ? 'bg-brand text-white'
                    : past
                      ? 'cursor-not-allowed bg-[#eef1f1] text-[#b4bebf]'
                      : 'text-ink hover:bg-teal-soft focus-visible:bg-teal-soft focus-visible:outline-none',
                  today && !on ? 'ring-2 ring-inset ring-brand' : '',
                ].join(' ')}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
          <button type="button" onClick={() => pick(min)} className="font-bold text-brand">Hari ini</button>
          <button type="button" onClick={() => pick(addDays(min, 1))} className="font-bold text-brand">Besok</button>
          <button type="button" onClick={onClose} className="font-semibold text-muted">Tutup</button>
        </div>
      </div>
    </>
  );
}

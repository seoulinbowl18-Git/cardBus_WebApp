'use client';

import { parseLayout } from '@/lib/seats';
import type { SeatTier } from '@/lib/types';

interface Props {
  tier: SeatTier;
  selected: string[];
  max: number;
  onToggle: (seat: string) => void;
}

/**
 * Denah kursi satu varian, susunannya sama dengan SeatMap di aplikasi mobile:
 * kode "<baris><huruf>" per baris, huruf A–B di kiri lorong, C dst. di kanan;
 * kode lain (mis. K1 sleeper privat) berjajar di atas. Tanpa denah dari backend
 * (tier.seats kosong), hanya kursi kosong yang tampil.
 */
export function SeatPicker({ tier, selected, max, onToggle }: Props) {
  const free = new Set(tier.freeSeats);
  const hasLayout = !!tier.seats?.length;
  const { others, rows, left, right } = parseLayout(hasLayout ? tier.seats! : tier.freeSeats);
  const full = selected.length >= max;

  const seat = (code: string, wide = false) => {
    const isFree = free.has(code);
    const isSel = selected.includes(code);
    return (
      <button
        key={code}
        type="button"
        disabled={!isFree || (!isSel && full)}
        onClick={() => onToggle(code)}
        aria-pressed={isSel}
        aria-label={`Kursi ${code}${isFree ? '' : ', terisi'}`}
        className={[
          'h-10 rounded-[10px] border-[1.4px] text-xs font-extrabold transition',
          wide ? 'w-16' : 'w-10',
          isSel
            ? 'border-brand bg-brand text-white'
            : isFree
              ? 'border-brand bg-white text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-40'
              : 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400',
        ].join(' ')}
      >
        {code}
      </button>
    );
  };
  const slot = (code: string | undefined, key: string) => (code ? seat(code) : <span key={key} className="inline-block h-10 w-10" />);

  if (tier.freeSeats.length === 0) return <p className="text-sm text-slate-500">Kursi untuk varian ini sudah habis.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <Legend className="border-brand bg-white" label="Tersedia" />
        <Legend className="border-brand bg-brand" label="Dipilih" />
        {hasLayout && <Legend className="border-slate-200 bg-slate-200" label="Terisi" />}
      </div>
      <div className="inline-block min-w-[240px] rounded-b-xl rounded-t-[28px] border-[1.4px] border-slate-200 bg-white px-4 pb-4 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Depan</span>
          <span aria-hidden className="text-lg">◎</span>
        </div>
        <hr className="my-3 border-slate-200" />
        {others.length > 0 && <div className="mb-3 flex flex-wrap justify-center gap-2">{others.map((c) => seat(c, true))}</div>}
        <div className="space-y-2">
          {rows.map(({ row, byLetter }) => (
            <div key={row} className="flex justify-center gap-2">
              {left.map((l) => slot(byLetter[l], `${row}${l}`))}
              <span className="inline-block w-6" aria-hidden />
              {right.map((l) => slot(byLetter[l], `${row}${l}`))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Dipilih {selected.length}/{max} kursi{full ? ' — batas maksimal per pesanan' : ''}.
      </p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3.5 w-3.5 rounded border-[1.4px] ${className}`} />
      {label}
    </span>
  );
}

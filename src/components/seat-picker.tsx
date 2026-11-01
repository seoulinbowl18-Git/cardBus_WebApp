'use client';

import { groupSeatRows } from '@/lib/seats';
import type { SeatTier } from '@/lib/types';

interface Props {
  tier: SeatTier;
  selected: string[];
  max: number;
  onToggle: (seat: string) => void;
}

/**
 * Pilih kursi. Jika backend mengirim denah lengkap (tier.seats), kursi terisi tampil abu-abu;
 * saat ini backend hanya mengirim freeSeats, jadi yang tampil hanya kursi yang masih kosong.
 */
export function SeatPicker({ tier, selected, max, onToggle }: Props) {
  const free = new Set(tier.freeSeats);
  const all = tier.seats?.length ? tier.seats : tier.freeSeats;
  const rows = groupSeatRows(all);
  const full = selected.length >= max;

  if (tier.freeSeats.length === 0) return <p className="text-sm text-slate-500">Kursi untuk varian ini sudah habis.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <Legend className="border-slate-300 bg-white" label="Tersedia" />
        <Legend className="border-brand bg-brand" label="Dipilih" />
        {tier.seats?.length ? <Legend className="border-slate-200 bg-slate-200" label="Terisi" /> : null}
      </div>
      <div className="inline-block space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-right text-xs text-slate-400">Depan / Sopir ↑</p>
        {rows.map(({ row, seats }) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-slate-400">{row === 'Lainnya' ? row : `Baris ${row}`}</span>
            <div className="flex flex-wrap gap-2">
              {seats.map((s) => {
                const isFree = free.has(s);
                const isSel = selected.includes(s);
                const disabled = !isFree || (!isSel && full);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(s)}
                    aria-pressed={isSel}
                    aria-label={`Kursi ${s}${isFree ? '' : ' (terisi)'}`}
                    className={[
                      'h-11 w-11 rounded-lg border text-sm font-semibold transition',
                      isSel
                        ? 'border-brand bg-brand text-white'
                        : isFree
                          ? 'border-slate-300 bg-white hover:border-brand disabled:cursor-not-allowed disabled:opacity-40'
                          : 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
      <span className={`inline-block h-4 w-4 rounded border ${className}`} />
      {label}
    </span>
  );
}

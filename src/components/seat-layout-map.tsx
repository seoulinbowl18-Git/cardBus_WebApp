'use client';

import { useMemo, useState } from 'react';
import { formatRupiah } from '@/lib/format';
import type { SeatCell, SeatDeck, SeatTier } from '@/lib/types';

interface Props {
  layout: SeatDeck[];
  tiers: SeatTier[];
  /** Varian yang sedang dipilih: hanya kursinya yang bisa diketuk. */
  tierKey: string;
  selected: string[];
  max: number;
  onToggle: (seat: string) => void;
  /** Ketuk kursi varian lain → pindah ke varian itu dan langsung pilih kursinya. */
  onTierChange?: (key: string, seat: string) => void;
}

const SEAT_W = 40; // lebar kursi standar (px); lebar lain dari data `w` prototipe
const isSeat = (c: SeatCell): c is Extract<SeatCell, { code: string }> => 'code' in c;
const isAisle = (c: SeatCell): c is Extract<SeatCell, { aisle: true }> => 'aisle' in c;
const isSection = (c: SeatCell): c is Extract<SeatCell, { section: string }> => 'section' in c;
const isColHead = (c: SeatCell): c is Extract<SeatCell, { kind: 'col' }> => 'kind' in c && c.kind === 'col';
type Facility = 'toilet' | 'door' | 'stairs';
const isFacility = (c: SeatCell): c is { kind: Facility; w?: number } =>
  'kind' in c && (c.kind === 'toilet' || c.kind === 'door' || c.kind === 'stairs');

/**
 * Denah kursi per lantai (format prototipe CardBus, padanan SeatLayoutMap di mobile):
 * tab Lantai Bawah / Atas, kepala denah (pintu · nama · sopir), judul bagian + harga,
 * kursi 2-2 / 2-1 / Grand Captain, dan sleeper. Kursi varian lain tampil samar. Denah dari template Admin Pusat
 * juga membawa kepala kolom (A B | C), nomor baris, dan penanda toilet / pintu / tangga selebar kursi.
 */
export function SeatLayoutMap({ layout, tiers, tierKey, selected, max, onToggle, onTierChange }: Props) {
  const free = useMemo(() => new Set(tiers.flatMap((t) => t.freeSeats)), [tiers]);
  const tierOf = useMemo(() => new Map(tiers.map((t) => [t.key, t])), [tiers]);
  const mine = useMemo(() => new Set(tierOf.get(tierKey)?.freeSeats ?? []), [tierOf, tierKey]);
  // Lantai awal: yang punya kursi kosong varian terpilih
  const firstDeck = Math.max(0, layout.findIndex((d) => d.rows.some((r) => r.some((c) => isSeat(c) && mine.has(c.code)))));
  const [deckIdx, setDeckIdx] = useState(firstDeck);
  const deck = layout[Math.min(deckIdx, layout.length - 1)];
  const full = selected.length >= max;
  const hasBeds = layout.some((d) => d.rows.some((r) => r.some((c) => isSeat(c) && c.kind === 'bed')));
  const multiTier = tiers.length > 1;

  const deckStats = (d: SeatDeck) => {
    const codes = d.rows.flat().filter(isSeat).map((c) => c.code);
    return { free: codes.filter((c) => mine.has(c)).length, picked: codes.filter((c) => selected.includes(c)).length };
  };

  return (
    <div className="space-y-3">
      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <Legend className="border-brand bg-white" label="Tersedia" />
        <Legend className="border-brand bg-brand" label="Dipilih" />
        <Legend className="border-line bg-[#e9eeee]" label="Terisi" />
        {multiTier && <Legend className="border-dashed border-line bg-white opacity-60" label="Varian lain" />}
        {hasBeds && <Legend className="h-4 w-3 border-brand bg-white" label="Sleeper / kompartemen" />}
      </div>

      {/* Tab lantai */}
      {layout.length > 1 && (
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-[#eef3f3] p-1">
          {layout.map((d, i) => {
            const s = deckStats(d);
            const on = d === deck;
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setDeckIdx(i)}
                className={`rounded-lg px-3 py-2 text-left transition ${on ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
              >
                <span className={`block text-[13px] font-extrabold ${on ? 'text-ink' : 'text-muted'}`}>{d.name}</span>
                <span className="block text-[11px] text-muted">
                  {s.free} tersedia{s.picked ? ` · ${s.picked} dipilih` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Denah lantai aktif */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="mx-auto w-fit min-w-[240px] rounded-b-xl rounded-t-[28px] border-[1.4px] border-line bg-white px-4 pb-4 pt-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 21V4h10v17M3 21h14M12 12h.01M15 4l4 2v15" />
              </svg>
              {deck.door ?? 'Pintu'}
            </span>
            <span className="flex-1 text-center font-extrabold text-ink">{layout.length > 1 ? deck.name : 'Denah kursi'}</span>
            <span className="flex items-center gap-1">
              {deck.driver ?? 'Sopir'}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="2" />
                <path d="M3.5 12h6.5M14 12h6.5M12 14v6.5" />
              </svg>
            </span>
          </div>
          <hr className="my-3 border-line" />
          <div className="space-y-2">
            {deck.rows.map((row, ri) => {
              const labels = deck.rowLabels;
              const head = row.length === 1 && isSection(row[0]) ? row[0] : null;
              if (head) {
                const keys = head.tiers ?? (head.tier ? [head.tier] : []);
                const prices = keys.map((k) => tierOf.get(k)).filter(Boolean).map((t) => formatRupiah(t!.price)).join(' · ');
                const active = keys.includes(tierKey);
                return (
                  <div key={ri} className={`flex items-baseline justify-between gap-3 border-b border-dashed border-line pb-1 pt-2 first:pt-0 ${active ? '' : 'opacity-60'}`}>
                    <span className="text-xs font-extrabold text-ink">{head.section}</span>
                    {prices && <span className="text-[11px] font-bold text-brand">{prices}</span>}
                  </div>
                );
              }
              return (
                <div key={ri} className="flex items-center justify-center gap-1.5">
                  {labels && <span className="w-5 shrink-0 text-right text-[11px] font-bold text-faint" aria-hidden>{labels[ri] ?? ''}</span>}
                  {row.map((c, ci) => {
                    if (isAisle(c)) return <span key={ci} style={{ width: c.w ?? 20 }} className="shrink-0" aria-hidden />;
                    if (isColHead(c)) {
                      return <span key={ci} style={{ width: c.w ?? SEAT_W }} className="shrink-0 text-center text-[11px] font-bold text-faint" aria-hidden>{c.text}</span>;
                    }
                    if (isFacility(c)) return <FacilityCell key={ci} kind={c.kind} width={c.w ?? SEAT_W} />;
                    // Posisi kosong (denah template) selebar kursi agar kolom sejajar
                    if (!isSeat(c)) return <span key={ci} style={{ width: (c as { w?: number }).w ?? SEAT_W }} className="shrink-0" aria-hidden />;
                    return (
                      <SeatButton
                        key={c.code}
                        cell={c}
                        tierName={tierOf.get(c.tier)?.name ?? c.tier}
                        own={c.tier === tierKey}
                        free={free.has(c.code)}
                        picked={selected.includes(c.code)}
                        full={full}
                        onClick={() => (c.tier === tierKey ? onToggle(c.code) : onTierChange?.(c.tier, c.code))}
                      />
                    );
                  })}
                  {labels && <span className="w-5 shrink-0" aria-hidden />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        Dipilih {selected.length}/{max} kursi{full ? ' — batas maksimal per pesanan' : ''}.
        {multiTier && onTierChange ? ' Ketuk kursi varian lain untuk langsung pindah ke varian itu.' : ''}
      </p>
    </div>
  );
}

function SeatButton(props: {
  cell: { code: string; kind: 'seat' | 'bed'; tier: string; w?: number };
  tierName: string;
  own: boolean;
  free: boolean;
  picked: boolean;
  full: boolean;
  onClick: () => void;
}) {
  const { cell, own, free, picked, full } = props;
  const bed = cell.kind === 'bed';
  const width = cell.w ?? SEAT_W;
  // Kursi varian lain: bisa diketuk untuk pindah varian bila masih kosong
  const disabled = !free || (own && !picked && full);
  const label = `${bed ? 'Sleeper' : 'Kursi'} ${cell.code}${!free ? ', terisi' : ''}${own ? '' : `, varian ${props.tierName}`}`;
  const tone = picked
    ? 'border-brand bg-brand text-white'
    : !free
      ? 'cursor-not-allowed border-line bg-[#e9eeee] text-faint'
      : own
        ? 'border-brand bg-white text-brand hover:bg-teal-soft disabled:cursor-not-allowed disabled:opacity-40'
        : 'border-dashed border-line bg-white text-faint opacity-60 hover:opacity-100';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={props.onClick}
      aria-pressed={picked}
      aria-label={label}
      title={own ? undefined : `${props.tierName}`}
      style={{ width }}
      className={`relative shrink-0 border-[1.4px] text-[11px] font-extrabold transition ${bed ? 'h-16 rounded-xl' : 'h-10 rounded-[10px]'} ${tone}`}
    >
      {bed && <span className={`absolute inset-x-1.5 top-1.5 h-2 rounded ${picked ? 'bg-white/40' : 'bg-current opacity-20'}`} aria-hidden />}
      <span className={bed ? 'absolute inset-x-0 bottom-2' : ''}>{cell.code}</span>
    </button>
  );
}

const FACILITY: Record<Facility, { label: string; path: string }> = {
  toilet: { label: 'Toilet', path: 'M7 4h10v6a5 5 0 0 1-10 0zM9 15v5h6v-5M5 10h14' },
  door: { label: 'Pintu', path: 'M6 21V4h10v17M4 21h14M13 12h.01' },
  stairs: { label: 'Tangga', path: 'M4 20h4v-4h4v-4h4V8h4' },
};

/** Penanda fasilitas di denah (toilet / pintu / tangga), selebar kursi agar kolom tetap sejajar. */
export function FacilityCell({ kind, width, className = '' }: { kind: Facility; width: number; className?: string }) {
  const f = FACILITY[kind];
  return (
    <span
      role="img"
      aria-label={f.label}
      title={f.label}
      style={{ width }}
      className={`flex h-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] border border-dashed border-line bg-[#f4f7f7] text-faint ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={f.path} />
      </svg>
      <span className="text-[9px] font-bold leading-none">{f.label}</span>
    </span>
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

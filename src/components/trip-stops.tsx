'use client';

import { useState } from 'react';
import type { Trip, TripStopPoint } from '@/lib/types';

const LABEL: Record<string, string> = { board: 'Naik', drop: 'Turun', rest: 'Istirahat' };
const ICON: Record<string, string> = { board: '◯', drop: '📍', rest: '🍽️' };

/** Jam tiba di perhentian, sama dengan aplikasi mobile: jam berangkat penumpang ± selisih dari titik naiknya. */
function stopTime(trip: Trip, stops: TripStopPoint[], s: TripStopPoint) {
  const board = stops.find((x) => x.point === trip.boardPoint);
  const [h, m] = trip.depart.split(' ')[0].split(':').map(Number);
  const at = h * 60 + m + s.minutes - (board?.minutes ?? 0);
  const t = ((at % 1440) + 1440) % 1440;
  const day = Math.floor(at / 1440);
  const hhmm = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  return day > 0 ? `${hhmm} (+${day})` : hhmm;
}

/** "Lihat rute & N perhentian": urutan perhentian, titik naik & turun penumpang ditandai. */
export function TripStops({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const stops = trip.stops ?? [];
  if (!stops.length) return null;
  const boardIdx = stops.findIndex((s) => s.point === trip.boardPoint);
  let dropIdx = -1;
  stops.forEach((s, i) => {
    if (s.point === trip.dropPoint) dropIdx = i;
  });

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-sm font-bold text-brand">
        {open ? '⌃ Sembunyikan perhentian' : `⇢ Lihat rute & ${stops.length} perhentian`}
      </button>
      {open && (
        <ol className="mt-3 space-y-0">
          {stops.map((s, i) => {
            const mine = i === boardIdx || i === dropIdx;
            const outside = (boardIdx >= 0 && i < boardIdx) || (dropIdx >= 0 && i > dropIdx);
            return (
              <li key={`${s.point}-${i}`} className="flex gap-3">
                <span className={`w-16 shrink-0 pt-0.5 text-xs ${mine ? 'font-extrabold text-ink' : outside ? 'text-faint' : 'font-semibold text-ink'}`}>
                  {stopTime(trip, stops, s)}
                </span>
                <span className="flex w-4 shrink-0 flex-col items-center">
                  <span aria-hidden className={`text-xs ${mine ? 'text-brand' : 'text-muted'}`}>{ICON[s.type] ?? '•'}</span>
                  {i < stops.length - 1 && <span className="w-0.5 flex-1 bg-line" />}
                </span>
                <span className="min-w-0 pb-3">
                  <span className={`block text-sm ${mine ? 'font-extrabold' : 'font-semibold'} ${outside ? 'text-faint' : 'text-ink'}`}>{s.point}</span>
                  <span className={`block text-xs ${mine ? 'text-brand' : 'text-faint'}`}>
                    {LABEL[s.type] ?? 'Transit'} · {s.city}
                    {mine && (s.type === 'drop' ? ' · tujuanmu' : ' · titik naikmu')}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

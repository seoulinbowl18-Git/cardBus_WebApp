/**
 * Rencana denah kursi (seat plan) Admin Pusat → denah per lantai. Padanan persis backend
 * src/services/seatPlan.js (backend tetap sumber kebenaran saat menyimpan; ini untuk pratinjau langsung).
 */
import type { SeatCell, SeatDeck } from './types';

export type SeatMark = 'off' | 'toilet' | 'door' | 'stairs';

export interface SeatZone {
  tier: { key: string; name: string };
  /** Judul bagian di denah, mis. "Executive · Panoramic view" (default nama varian). */
  title?: string;
  rows: number;
  kind: 'seat' | 'bed';
  codes: 'grid' | 'seq';
  prefix: string;
  /** Huruf per kolom kiri→kanan; '' = kolom tidak dipakai zona ini. Kosong = A, B, C, … */
  letters?: string[];
}

export interface SeatPlanDeck {
  name: string;
  door: string;
  driver: string;
  left: number;
  right: number;
  /** Nomor baris melanjutkan lantai sebelumnya (kode kursi tetap unik). */
  continueRows?: boolean;
  zones: SeatZone[];
  cells: { r: number; c: number; kind: SeatMark }[];
}

export interface SeatPlan {
  template?: string;
  decks: SeatPlanDeck[];
}

export interface SeatTemplate {
  key: string;
  label: string;
  busType: string;
  seatType: string;
  hint: string;
  plan: SeatPlan;
}

/** Sel pratinjau: sel denah + posisi grid (untuk ketuk ubah) */
export type PreviewCell = SeatCell & { r?: number; c?: number };
export type PreviewDeck = Omit<SeatDeck, 'rows'> & { rows: PreviewCell[][]; rowLabels: (string | null)[] };

const W = { seat: 42, bed: 64 } as const;
const AISLE_W = 20;
const letter = (i: number) => String.fromCharCode(65 + i);

export const MARK_LABEL: Record<SeatMark | 'seat', string> = { seat: 'Kursi', off: 'Kosong', toilet: 'Toilet', door: 'Pintu', stairs: 'Tangga' };
/** Urutan saat sel pratinjau diketuk */
export const MARK_CYCLE: (SeatMark | 'seat')[] = ['seat', 'off', 'toilet', 'door', 'stairs'];

export const deckRows = (d: SeatPlanDeck) => d.zones.reduce((n, z) => n + z.rows, 0);

/** Rencana → { layout, tiers } atau pesan galat (aturan sama dengan backend). */
export function buildLayout(plan: SeatPlan): { layout: PreviewDeck[]; tiers: { key: string; name: string; seats: string[] }[] } | string {
  const layout: PreviewDeck[] = [];
  const tiers = new Map<string, { key: string; name: string; seats: string[] }>();
  const seen = new Set<string>();
  let lastRowNo = 0;
  for (const [di, d] of plan.decks.entries()) {
    if (!d.zones.length) return `${d.name || `Lantai ${di + 1}`}: isi minimal satu kelas`;
    const cols = d.left + d.right;
    const total = deckRows(d);
    if (total > 30) return `${d.name}: maksimal 30 baris`;
    const marks = new Map<string, SeatMark>();
    for (const m of d.cells) if (m.r <= total && m.c < cols) marks.set(`${m.r},${m.c}`, m.kind);
    const lettersOf = (z: SeatZone) => [...Array(cols).keys()].map((c) => (z.letters ? (z.letters[c] ?? '') : letter(c)));
    const colW = [...Array(cols).keys()].map((c) => Math.max(...d.zones.map((z) => (lettersOf(z)[c] || z.codes === 'seq' ? W[z.kind] : W.seat))));
    const withAisle = (cells: PreviewCell[]) => cells.flatMap((cell, c) => (c === d.left ? [{ aisle: true as const, w: AISLE_W }, cell] : [cell]));

    const rows: PreviewCell[][] = [];
    const rowLabels: (string | null)[] = [];
    let r = 0;
    let rowNo = d.continueRows ? lastRowNo : 0;
    for (const z of d.zones) {
      const known = tiers.get(z.tier.key);
      if (known && known.name !== z.tier.name) return `Varian "${z.tier.key}" dipakai dengan dua nama berbeda`;
      const tier = known ?? { key: z.tier.key, name: z.tier.name, seats: [] };
      tiers.set(z.tier.key, tier);
      const letters = lettersOf(z);
      rows.push([{ section: z.title || z.tier.name, tier: z.tier.key }]);
      rowLabels.push(null);
      if (z.codes === 'grid') {
        rows.push(withAisle(letters.map((text, c) => ({ kind: 'col', text, w: colW[c] }))));
        rowLabels.push(null);
      }
      let seq = 0;
      for (let i = 0; i < z.rows; i++) {
        r += 1;
        const used = (c: number) => !marks.has(`${r},${c}`) && (z.codes === 'seq' || Boolean(letters[c]));
        const hasSeat = [...Array(cols).keys()].some(used);
        if (hasSeat) rowNo += 1;
        const cells: PreviewCell[] = [];
        for (let c = 0; c < cols; c++) {
          const mark = marks.get(`${r},${c}`);
          if (!used(c)) {
            cells.push({ kind: mark && mark !== 'off' ? mark : 'empty', w: colW[c], r, c });
            continue;
          }
          seq += 1;
          const code = z.codes === 'seq' ? `${z.prefix}${seq}` : `${z.prefix}${rowNo}${letters[c]}`;
          if (seen.has(code)) return `Kode kursi ${code} ganda; beri awalan atau huruf berbeda`;
          seen.add(code);
          tier.seats.push(code);
          cells.push({ code, kind: z.kind, tier: z.tier.key, w: colW[c], r, c });
        }
        rows.push(withAisle(cells));
        rowLabels.push(hasSeat && z.codes === 'grid' ? String(rowNo) : null);
      }
    }
    if (!rows.some((row) => row.some((c) => 'code' in c))) return `${d.name}: belum ada kursi`;
    lastRowNo = rowNo;
    layout.push({ key: `deck${di + 1}`, name: d.name, door: d.door || 'Pintu', driver: d.driver || 'Sopir', rowLabels, rows });
  }
  const all = [...tiers.values()].filter((t) => t.seats.length);
  if (all.reduce((n, t) => n + t.seats.length, 0) > 80) return 'Denah maksimal 80 kursi';
  return { layout, tiers: all };
}

/** Ganti penanda satu sel (r, c): 'seat' = kembali jadi kursi. */
export function setMark(d: SeatPlanDeck, r: number, c: number, kind: SeatMark | 'seat'): SeatPlanDeck {
  const cells = d.cells.filter((m) => !(m.r === r && m.c === c));
  return { ...d, cells: kind === 'seat' ? cells : [...cells, { r, c, kind }] };
}

export const markAt = (d: SeatPlanDeck, r: number, c: number): SeatMark | 'seat' => d.cells.find((m) => m.r === r && m.c === c)?.kind ?? 'seat';

export const newZone = (key = 'base', name = 'Executive'): SeatZone => ({ tier: { key, name }, rows: 8, kind: 'seat', codes: 'grid', prefix: '' });

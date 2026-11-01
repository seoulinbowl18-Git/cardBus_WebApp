/** Utilitas kursi & data kontak untuk checkout. */

export const MAX_SEATS = 4; // batas backend: seats.max(4)

const SEAT_RE = /^(\d+)([A-Z]+)$/i;

/** Urutkan kursi alami: 1A, 1B, 2A, …, 10A; nama lain (mis. K1) di akhir. */
export function sortSeats(seats: string[]): string[] {
  return [...seats].sort((a, b) => {
    const ma = SEAT_RE.exec(a);
    const mb = SEAT_RE.exec(b);
    if (ma && mb) return Number(ma[1]) - Number(mb[1]) || ma[2].localeCompare(mb[2]);
    if (ma) return -1;
    if (mb) return 1;
    return a.localeCompare(b, 'id', { numeric: true });
  });
}

/** Kelompokkan per baris (angka di depan). Kursi tanpa pola baris masuk grup "Lainnya". */
export function groupSeatRows(seats: string[]): { row: string; seats: string[] }[] {
  const rows = new Map<string, string[]>();
  for (const s of sortSeats(seats)) {
    const key = SEAT_RE.exec(s)?.[1] ?? 'Lainnya';
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key)!.push(s);
  }
  return [...rows].map(([row, list]) => ({ row, seats: list }));
}

/** 628xx / +628xx / 8xx → 08xx (format kontak yang diminta backend: ^08\d{8,11}$). */
export function toLocalPhone(input: string | null | undefined): string {
  let p = String(input ?? '').replace(/[\s\-().]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('62')) p = `0${p.slice(2)}`;
  else if (p.startsWith('8')) p = `0${p}`;
  return p;
}

export const isValidContactPhone = (p: string) => /^08\d{8,11}$/.test(p);
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isValidPassengerName = (n: string) => n.trim().length >= 3 && n.trim().length <= 80;

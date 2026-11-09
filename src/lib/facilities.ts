/**
 * Pembaca fasilitas bus (amenities) — sama dengan aplikasi mobile (lib/utils/amenities.dart).
 *
 * Data dari backend bisa berupa kode (`['ac', 'toilet']`), teks yang diketik admin (`['Toilet', 'USB']`),
 * atau satu string berformat koma (`"Toilet, USB, Selimut, Makan, Snack, AC"`). Teks dicocokkan ke ikon
 * lewat kata kunci; fasilitas yang belum dikenal tetap ditampilkan dengan ikon generik.
 */

export interface Facility {
  /** Kode ikon (`toilet`) atau teks asli bila belum dikenal */
  code: string;
  label: string;
  icon: string;
  known: boolean;
}

const LABELS: Record<string, { label: string; icon: string }> = {
  ac: { label: 'AC', icon: '❄️' },
  toilet: { label: 'Toilet', icon: '🚻' },
  selimut: { label: 'Selimut', icon: '🛏️' },
  usb: { label: 'USB charger', icon: '🔌' },
  legrest: { label: 'Leg rest', icon: '🦵' },
  makan: { label: 'Makan', icon: '🍱' },
  tv: { label: 'TV', icon: '📺' },
  kompartemen: { label: 'Kompartemen', icon: '🚪' },
  dispenser: { label: 'Dispenser', icon: '💧' },
  wifi: { label: 'Wi-Fi', icon: '📶' },
  snack: { label: 'Snack', icon: '🍪' },
  reclining: { label: 'Reclining', icon: '💺' },
};

/** Ikon untuk fasilitas yang belum ada di daftar. */
export const GENERIC_ICON = '✔️';

/** Kata kunci → kode. Dicocokkan per kata utuh tanpa beda huruf besar/kecil, frasa terpanjang lebih dulu. */
const KEYWORDS: Record<string, string> = {
  toilet: 'toilet', wc: 'toilet', 'kamar mandi': 'toilet', 'kamar kecil': 'toilet', restroom: 'toilet', lavatory: 'toilet',
  ac: 'ac', 'air conditioner': 'ac', 'air conditioning': 'ac', pendingin: 'ac', 'pendingin udara': 'ac',
  usb: 'usb', charger: 'usb', charging: 'usb', colokan: 'usb', 'stop kontak': 'usb', 'power outlet': 'usb', 'port usb': 'usb',
  selimut: 'selimut', blanket: 'selimut',
  makan: 'makan', makanan: 'makan', meal: 'makan', 'service makan': 'makan', 'servis makan': 'makan', prasmanan: 'makan',
  snack: 'snack', snak: 'snack', camilan: 'snack', cemilan: 'snack', kudapan: 'snack', 'makanan ringan': 'snack',
  wifi: 'wifi', 'wi fi': 'wifi', internet: 'wifi',
  tv: 'tv', televisi: 'tv', layar: 'tv', hiburan: 'tv', entertainment: 'tv', 'audio video': 'tv', avod: 'tv',
  dispenser: 'dispenser', 'air minum': 'dispenser', 'air mineral': 'dispenser',
  legrest: 'legrest', 'leg rest': 'legrest', footrest: 'legrest', 'foot rest': 'legrest', 'sandaran kaki': 'legrest',
  reclining: 'reclining', recliner: 'reclining', 'kursi rebah': 'reclining', 'reclining seat': 'reclining',
  kompartemen: 'kompartemen', compartment: 'kompartemen', 'kabin privat': 'kompartemen',
};

const PHRASES = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Kode ikon untuk satu teks fasilitas, atau null bila belum dikenal. */
export function facilityCode(text: string): string | null {
  const t = ` ${normalize(text)} `;
  if (!t.trim()) return null;
  const hit = PHRASES.find((p) => t.includes(` ${p} `));
  return hit ? KEYWORDS[hit] : null;
}

/**
 * Daftar fasilitas dari API: array, string berformat koma / titik koma / baris baru, atau campuran.
 * Hasil tanpa duplikat, urutan dipertahankan; teks yang tidak dikenal tidak dibuang.
 */
export function parseFacilities(raw: unknown): Facility[] {
  const parts: string[] = [];
  const add = (v: unknown) => {
    if (typeof v === 'string') parts.push(...v.split(/[,;\n|]/));
    else if (Array.isArray(v)) v.forEach(add);
  };
  add(raw);

  const seen = new Set<string>();
  const out: Facility[] = [];
  for (const p of parts) {
    const text = p.trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const code = facilityCode(text);
    const key = (code ?? text).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(code ? { code, ...LABELS[code], known: true } : { code: text, label: text, icon: GENERIC_ICON, known: false });
  }
  return out;
}

/** Info satu fasilitas (kode atau teks bebas). */
export const facilityInfo = (text: string): Facility =>
  parseFacilities(text)[0] ?? { code: text, label: text, icon: GENERIC_ICON, known: false };

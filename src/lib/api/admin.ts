import { createApiClient } from './client';
import type { LoginResponse, SendOtpResponse } from '@/lib/types';

/**
 * Admin Pusat: klien API sendiri (token admin terpisah dari sesi penumpang) dan endpoint /api/admin.
 * Semua aturan akses ada di backend: role admin dicek di database setiap request.
 */
export const adminClient = createApiClient();

export type TripStatus = 'draft' | 'review' | 'fix' | 'live';

export interface AdminMe {
  id: string;
  name: string | null;
  phone: string | null;
  role: 'admin';
}

export interface Partner {
  id: string;
  name: string;
  short: string;
  color: string;
  logo: string | null;
  /** 1 = Mode Kuota (jadwal dibuat Admin Pusat) · 2 = Portal Mitra PO (PO kelola sendiri) */
  level: 1 | 2;
  adminName: string | null;
  adminPhone: string | null;
  commissionRate: number;
  active: boolean;
  trips?: number;
  liveTrips?: number;
  /** Jumlah pesanan semua jadwal PO ini (tetap tersimpan bila mitra dihapus) */
  bookings?: number;
}

/** logo: tidak dikirim = tetap, null = hapus, string = path hasil unggah (/media/…) */
export type PartnerInput = Omit<Partner, 'trips' | 'liveTrips' | 'bookings' | 'logo' | 'color'> & { color?: string; logo?: string | null };

/** Gambar yang sudah tersimpan: `path` disimpan di database, `url` untuk ditampilkan. */
export interface StoredImage {
  path: string;
  url: string;
}

/** Foto galeri armada: unggahan (`src` = /media/…) atau bawaan data armada (`file`). */
export interface TripPhoto {
  src?: string;
  file?: string;
  cat?: string;
  caption?: string;
  url: string;
}

export interface TripRoute {
  from: string;
  to: string;
  boardPoint: string;
  dropPoint: string;
  minutes: number;
  /** Jam berangkat khusus dari titik naik ini (HH:MM); kosong = jam jadwal */
  depart?: string;
  /** Harga per varian khusus rute ini; varian yang tidak ada = harga varian */
  prices?: Record<string, number>;
  offset?: number;
  viaStops?: boolean;
}

/** Perhentian jadwal; minutes = menit sejak jam berangkat jadwal. */
export interface TripStop {
  city: string;
  point: string;
  minutes: number;
  type: 'board' | 'rest' | 'drop';
}

export const STOP_TYPES = [
  ['board', 'Naik'],
  ['rest', 'Istirahat'],
  ['drop', 'Turun'],
] as const;

/**
 * Pratinjau rute dari perhentian, sama dengan backend (routesFromStops): setiap kota Naik × kota Turun sesudahnya;
 * titik = perhentian pertama di kota itu. Nama kota final (alias Jogja → Yogyakarta) ditentukan backend.
 */
export function routesFromStops(stops: TripStop[]) {
  const key = (c: string) => c.trim().toLowerCase();
  const out: { from: string; to: string; boardPoint: string; dropPoint: string; minutes: number; offset: number }[] = [];
  const seen = new Set<string>();
  stops.forEach((b, i) => {
    if (b.type !== 'board' || !b.city.trim()) return;
    for (const d of stops.slice(i + 1)) {
      if (d.type !== 'drop' || !d.city.trim() || key(d.city) === key(b.city)) continue;
      const k = `${key(b.city)}>${key(d.city)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ from: b.city.trim(), to: d.city.trim(), boardPoint: b.point.trim(), dropPoint: d.point.trim(), minutes: d.minutes - b.minutes, offset: b.minutes });
    }
  });
  return out;
}

/** Kesalahan daftar perhentian yang terlihat sebelum disimpan (null = siap disimpan). */
export function stopsProblem(stops: TripStop[]): string | null {
  if (!stops.length) return null;
  const empty = stops.findIndex((s) => s.city.trim().length < 2 || s.point.trim().length < 2);
  if (empty >= 0) return `Perhentian ${empty + 1}: isi kota dan titik (minimal 2 huruf).`;
  if (stops.some((s) => s.minutes < 0)) return 'Ada perhentian sebelum jam berangkat jadwal. Periksa jam atau hari.';
  const back = stops.findIndex((s, i) => i > 0 && s.minutes < stops[i - 1].minutes);
  if (back > 0) return `Jam perhentian ${back + 1} lebih awal dari perhentian sebelumnya. Urutkan sesuai perjalanan.`;
  const routes = routesFromStops(stops);
  if (!routes.length) return 'Butuh minimal satu perhentian Naik dan satu perhentian Turun di kota lain sesudahnya.';
  const short = routes.find((r) => r.minutes < 10);
  if (short) return `Perjalanan ${short.from} → ${short.to} minimal 10 menit.`;
  return null;
}

export interface TripTier {
  key: string;
  name: string;
  price: number;
  seats: string[];
}

export interface TripPromo {
  from: string;
  to: string;
  price: number;
}

export interface TripSummary {
  id: string;
  poId: string;
  poName: string | null;
  busClass: string | null;
  busType: string | null;
  depart: string;
  days: number[];
  status: TripStatus;
  routes: number;
  cities: string[];
  minPrice: number | null;
  seats: number;
  imageUrl: string | null;
  photos: number;
  adminManaged: boolean;
  updatedAt: string;
}

export interface TripDetail {
  id: string;
  poId: string;
  poName: string | null;
  busClass: string | null;
  busType: string | null;
  seatType: string | null;
  depart: string;
  days: number[];
  routes: TripRoute[];
  tiers: TripTier[];
  promos: TripPromo[];
  facilities: string[];
  /** Perhentian (kosong = tanpa "Lihat rute & perhentian") */
  stops: TripStop[];
  status: TripStatus;
  /** Denah tetap dari data armada: varian & kursi tidak bisa diubah, harga & nama bisa */
  hasLayout: boolean;
  bookings: number;
  /** Foto sampul tersimpan (path) & untuk pratinjau (URL) */
  image: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  photos: TripPhoto[];
  adminManaged: boolean;
  updatedAt: string;
}

export interface TripInput {
  poId?: string;
  busClass: string;
  busType?: string | null;
  seatType?: string | null;
  depart: string;
  days: number[];
  facilities: string[];
  routes: TripRoute[];
  tiers: TripTier[];
  promos: TripPromo[];
  status?: 'draft' | 'live';
  /** Tidak dikirim = perhentian tidak diubah; [] = hapus semua perhentian */
  stops?: TripStop[];
  /** Tidak dikirim = foto tidak diubah */
  image?: string | null;
  photos?: Omit<TripPhoto, 'url'>[];
}

export interface PartnerStats {
  poId: string;
  name: string;
  short: string;
  color: string;
  logo: string | null;
  commissionRate: number;
  orders: number;
  tickets: number;
  gross: number;
  discount: number;
  commission: number;
}

export interface Stats {
  days: number;
  totals: { orders: number; tickets: number; gross: number; discount: number; commission: number };
  partners: PartnerStats[];
  daily: { date: string; gross: number; tickets: number }[];
  trips: Partial<Record<TripStatus, number>>;
}

/** Kartu "Produk unggulan" di beranda (tabel featured_products). */
export interface FeaturedCard {
  id: string;
  poId: string;
  poName: string;
  /** Logo PO dari data mitra (tidak disimpan di kartu) */
  logo: string | null;
  /** Foto tersimpan (path) & untuk pratinjau (URL) */
  image: string | null;
  imageUrl: string | null;
  busClass: string;
  from: string;
  to: string;
  boardPoint: string | null;
  price: number | null;
  oldPrice: number | null;
  tag: string;
  comingSoon: boolean;
  active: boolean;
  sortOrder: number;
  /** false = PO nonaktif / dihapus: kartu tidak tampil walau aktif */
  poActive: boolean;
}

/** image: tidak dikirim = foto tetap, null = tanpa foto, string = path hasil unggah */
export interface FeaturedInput {
  poId: string;
  image?: string | null;
  busClass: string;
  from: string;
  to: string;
  boardPoint: string | null;
  price: number | null;
  oldPrice: number | null;
  tag: string;
  comingSoon: boolean;
  active: boolean;
}

export const adminApi = {
  sendOtp: (phone: string) => adminClient.post<SendOtpResponse>('/api/auth/send-otp', { phone }),
  /** scope 'admin': backend menolak nomor yang bukan admin dan tidak membuat akun baru. */
  verifyOtp: (phone: string, code: string) => adminClient.post<LoginResponse>('/api/auth/verify-otp', { phone, code, scope: 'admin' }),
  me: () => adminClient.get<AdminMe>('/api/admin/me'),

  partners: () => adminClient.get<Partner[]>('/api/admin/partners'),
  createPartner: (p: PartnerInput) => adminClient.post<Partner>('/api/admin/partners', p),
  updatePartner: (id: string, p: PartnerInput) => adminClient.put<Partner>(`/api/admin/partners/${encodeURIComponent(id)}`, p),

  trips: (q: { poId?: string; status?: string } = {}) => adminClient.get<TripSummary[]>('/api/admin/trips', q),
  trip: (id: string) => adminClient.get<TripDetail>(`/api/admin/trips/${encodeURIComponent(id)}`),
  createTrip: (t: TripInput) => adminClient.post<TripDetail>('/api/admin/trips', t),
  updateTrip: (id: string, t: TripInput) => adminClient.put<TripDetail>(`/api/admin/trips/${encodeURIComponent(id)}`, t),
  setTripStatus: (id: string, status: 'draft' | 'live') =>
    adminClient.post<TripSummary>(`/api/admin/trips/${encodeURIComponent(id)}/status`, { status }),
  /** Jadwal hilang dari aplikasi penumpang & panel; pesanan yang sudah ada tetap tersimpan. */
  deleteTrip: (id: string) => adminClient.del<{ deleted: true; bookings: number }>(`/api/admin/trips/${encodeURIComponent(id)}`),
  deletePartner: (id: string) =>
    adminClient.del<{ deleted: true; trips: number; bookings: number }>(`/api/admin/partners/${encodeURIComponent(id)}`),
  featured: () => adminClient.get<FeaturedCard[]>('/api/admin/featured'),
  createFeatured: (f: FeaturedInput) => adminClient.post<FeaturedCard>('/api/admin/featured', f),
  updateFeatured: (id: string, f: FeaturedInput) => adminClient.put<FeaturedCard>(`/api/admin/featured/${encodeURIComponent(id)}`, f),
  orderFeatured: (ids: string[]) => adminClient.post<FeaturedCard[]>('/api/admin/featured/order', { ids }),
  deleteFeatured: (id: string) => adminClient.del<{ deleted: true }>(`/api/admin/featured/${encodeURIComponent(id)}`),
  uploadImage: (file: Blob) => adminClient.upload<StoredImage & { id: string; size: number }>('/api/admin/media', file),

  stats: (days: number) => adminClient.get<Stats>('/api/admin/stats', { days }),
};

export const TRIP_STATUS: Record<TripStatus, { label: string; cls: string }> = {
  live: { label: 'Tayang', cls: 'bg-[#e5f4ea] text-[#1f6a3a]' },
  draft: { label: 'Draf', cls: 'bg-[#eef1f1] text-muted' },
  review: { label: 'Menunggu validasi PO', cls: 'bg-[#fff4d6] text-[#8a5a00]' },
  fix: { label: 'Perlu koreksi', cls: 'bg-[#fbe9e9] text-[#9b1c1c]' },
};

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const dowName = (i: number) => DOW[i];

/** "Setiap hari" / "Sen, Rab, Jum" (0 = Minggu). */
export const daysText = (days: number[]) =>
  days.length >= 7 ? 'Setiap hari' : days.length === 0 ? 'Belum dipilih' : DAY_ORDER.filter((d) => days.includes(d)).map(dowName).join(', ');

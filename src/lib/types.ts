// Bentuk data mengikuti respons backend cardbus_backend (src/routes/*, Booking.toView, User.toPublic).

export type Role = 'user' | 'po_admin' | 'admin';

export interface SavedPassenger {
  name: string;
  phone: string | null;
}

export interface User {
  id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  savedPassengers: SavedPassenger[];
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/auth/send-otp */
export interface SendOtpResponse {
  phone: string;
  expiresIn: number;
  resendIn: number;
}

/** POST /api/auth/verify-otp & POST /api/auth/google */
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface SeatTier {
  key: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  freeSeats: string[];
  /** Denah lengkap varian (kosong + terisi). */
  seats?: string[];
}

/** GET /api/trips */
export interface Trip {
  id: string;
  poId: string;
  poName: string;
  busClass: string;
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  depart: string; // HH:mm
  arrive: string; // HH:mm atau "HH:mm (+1)"
  durationMinutes: number;
  boardPoint: string;
  dropPoint: string;
  tiers: SeatTier[];
  /** URL foto & logo bus (null jika PO belum punya). Opsional: backend versi lama belum mengirim. */
  image?: string | null;
  logo?: string | null;
  /** Fasilitas: kode (ac, toilet, …), teks bebas, atau string berformat koma (dibaca parseFacilities) */
  facilities?: string[] | string;
  /** Urutan perhentian (diatur di Admin Pusat). Kosong = rute ini tanpa daftar perhentian. */
  stops?: TripStopPoint[];
  /** Mis. "2-2", "2-1 · 21 kursi", "Exe Plus + Sleeper". */
  seatType?: string | null;
  /** Denah per lantai (format prototipe CardBus). Kosong di backend versi lama. */
  layout?: SeatDeck[];
  /** Galeri foto armada (unggahan Admin Pusat / bawaan), urut tampil */
  photos?: TripPhoto[];
  /** true = foto armada belum ada ("Foto armada segera hadir") */
  photosPending?: boolean;
}

/** Satu foto galeri armada; cat = kategori (Eksterior, Interior, Kursi, …). */
export interface TripPhoto {
  src: string;
  cat?: string;
  caption?: string;
}

/** Satu perhentian; minutes = menit sejak perhentian pertama. */
export interface TripStopPoint {
  city: string;
  point: string;
  minutes: number;
  type: 'board' | 'rest' | 'drop' | string;
}

/** Satu sel denah: kursi / sleeper, lorong, atau judul bagian (satu baris sendiri). */
export type SeatCell =
  | { code: string; kind: 'seat' | 'bed'; tier: string; w?: number }
  | { aisle: true; w?: number }
  | { section: string; tier?: string; tiers?: string[] };

export interface SeatDeck {
  key: string;
  name: string;
  /** Label kepala denah, mis. "Pintu" / "Tangga" dan "Sopir" / "Depan". */
  door?: string;
  driver?: string;
  rows: SeatCell[][];
}

export interface TripSearchQuery {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  poId?: string;
  /** Hanya jadwal yang naik / turun di titik ini (nama dari GET /api/locations). */
  boardPoint?: string;
  dropPoint?: string;
}

/** GET /api/locations: kota & titik naik/turun yang dilayani jadwal aktif. */
export interface LocationPoint {
  name: string;
  city: string;
  area: string;
  /** Bisa dipakai sebagai titik naik / titik turun. */
  board: boolean;
  drop: boolean;
  routes: number;
}

export interface Locations {
  cities: { name: string; routes: number }[];
  points: LocationPoint[];
}

export type PaymentMethod = 'qris' | 'va_bca' | 'va_bri' | 'va_bni' | 'va_mandiri';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'qris', label: 'QRIS' },
  { value: 'va_bca', label: 'Virtual Account BCA' },
  { value: 'va_bri', label: 'Virtual Account BRI' },
  { value: 'va_bni', label: 'Virtual Account BNI' },
  { value: 'va_mandiri', label: 'Virtual Account Mandiri' },
];

/** Body POST /api/payments/create */
export interface CreateOrderBody {
  tripId: string;
  date: string;
  from: string;
  to: string;
  tierKey: string;
  seats: string[];
  passengers: { name: string }[];
  contact: { phone: string; email: string };
  method: PaymentMethod;
  /** Voucher milik pengguna (GET /api/vouchers); diskon dihitung server. */
  userVoucherId?: number;
}

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled';
export type TicketStatus = 'active' | 'used' | 'expired' | 'cancelled';

/** Booking.toView: respons POST /api/payments/create, GET /api/orders, GET /api/orders/:id */
export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  statusLabel: string;
  ticketStatus: TicketStatus | null;
  ticketStatusLabel: string | null;
  checkedInAt: string | null;
  departAt: string | null;
  validUntil: string | null;
  trip: string;
  poName: string | null;
  busClass: string | null;
  depart: string | null;
  date: string;
  from: string;
  to: string;
  boardPoint: string;
  dropPoint: string;
  tierKey: string;
  seats: string[];
  passengers: string[];
  unitPrice: number;
  /** Harga sebelum voucher & potongan voucher (backend PostgreSQL). */
  subtotal?: number | null;
  discount?: number | null;
  total: number;
  expiresAt: string | null;
  ticketIssuedAt: string | null;
  payment: {
    method: PaymentMethod;
    reference: string | null;
    qrString: string | null;
    vaNumber: string | null;
    bankCode: string | null;
    bankName: string | null;
    paymentUrl: string | null;
    expiredAt: string | null;
  };
}

export interface UpdateProfileBody {
  name?: string;
  photoUrl?: string | null;
  savedPassengers?: { name: string; phone?: string | null }[];
}

/** GET /api/referral/me — Ajak Teman */
export interface ReferralInfo {
  code: string;
  campaign: { title: string; referrerReward: number; refereeReward: number } | null;
  stats: { pending: number; completed: number };
}

export type VoucherStatus = 'available' | 'reserved' | 'used' | 'expired';
export type VoucherTab = 'available' | 'used' | 'expired';

/** GET /api/vouchers — voucher milik pengguna */
export interface UserVoucher {
  id: number;
  title: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  maxDiscount: number | null;
  minPurchase: number | null;
  status: VoucherStatus;
  source: string | null;
  expiresAt: string | null;
  usedAt: string | null;
}

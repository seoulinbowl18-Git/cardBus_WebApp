import { api } from './client';
import type {
  CreateOrderBody,
  Locations,
  ReferralInfo,
  UserVoucher,
  VoucherTab,
  LoginResponse,
  Order,
  SendOtpResponse,
  Trip,
  TripSearchQuery,
  UpdateProfileBody,
  User,
} from '@/lib/types';

/** Semua endpoint backend yang dipakai web app; sama dengan yang dipakai aplikasi mobile. */

export const authApi = {
  sendOtp: (phone: string) => api.post<SendOtpResponse>('/api/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post<LoginResponse>('/api/auth/verify-otp', { phone, code }),
  /** idToken = Firebase ID token hasil login Google (butuh Firebase Web SDK, belum dipasang). */
  google: (idToken: string) => api.post<LoginResponse>('/api/auth/google', { idToken }),
};

export const userApi = {
  getProfile: () => api.get<{ user: User }>('/api/user/profile'),
  updateProfile: (body: UpdateProfileBody) => api.put<{ user: User }>('/api/user/profile', body),
};

export const tripApi = {
  search: (q: TripSearchQuery, signal?: AbortSignal) => api.get<Trip[]>('/api/trips', { ...q }, signal),
};

export const locationApi = {
  /** Kota & titik naik/turun dari rute jadwal aktif (cache 60 detik di backend). */
  list: (signal?: AbortSignal) => api.get<Locations>('/api/locations', undefined, signal),
};

/** Ajak Teman (sama dengan ReferralRepository di mobile). */
export const referralApi = {
  me: () => api.get<ReferralInfo>('/api/referral/me'),
  /** Teman baru memakai kode referral (setelah login pertama). */
  apply: (code: string) => api.post<{ ok: true }>('/api/referral/apply', { code }),
};

export const voucherApi = {
  list: (status: VoucherTab = 'available') => api.get<UserVoucher[]>('/api/vouchers', { status }),
  /** Klaim kode voucher publik. */
  claim: (code: string) => api.post<UserVoucher>('/api/vouchers/claim', { code }),
  /** Perkiraan diskon untuk subtotal (server memeriksa kepemilikan, masa berlaku, minimum). */
  quote: (userVoucherId: number, subtotal: number) =>
    api.post<{ discount: number; total: number }>('/api/vouchers/quote', { userVoucherId, subtotal }),
};

export const orderApi = {
  /** Kunci kursi + buat tagihan Komerce. 409 = kursi diambil orang lain. */
  create: (body: CreateOrderBody) => api.post<Order>('/api/payments/create', body),
  /** Status terkini (dipanggil berkala selama menunggu pembayaran). */
  get: (id: string) => api.get<Order>(`/api/orders/${encodeURIComponent(id)}`),
  /** Tiket Saya: pesanan lunas & dibatalkan. */
  list: () => api.get<Order[]>('/api/orders'),
};

export const healthApi = {
  check: () => api.get<{ ok: boolean }>('/health'),
};

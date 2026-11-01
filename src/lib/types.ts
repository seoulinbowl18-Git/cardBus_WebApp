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
}

export interface TripSearchQuery {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  poId?: string;
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

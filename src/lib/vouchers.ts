import { formatRupiah } from './format';
import type { UserVoucher } from './types';

/** "Rp 15.000" atau "10% (maks. Rp 50.000)" — sama dengan UserVoucher.discountLabel di mobile. */
export function discountLabel(v: UserVoucher) {
  if (v.discountType !== 'percent') return formatRupiah(v.discountValue);
  return v.maxDiscount ? `${v.discountValue}% (maks. ${formatRupiah(v.maxDiscount)})` : `${v.discountValue}%`;
}

/** Nilai besar di kartu voucher: "Rp15.000" / "10%". */
export const discountBadge = (v: UserVoucher) =>
  v.discountType === 'percent' ? `${v.discountValue}%` : formatRupiah(v.discountValue).replace(/\s/g, '');

/** "Berlaku s.d. 5 Feb 2027" / "Berakhir 5 Feb 2027" / "Dipakai 7 Nov 2026". */
export function voucherDateLine(v: UserVoucher) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso));
  if (v.status === 'used' && v.usedAt) return `Dipakai ${fmt(v.usedAt)}`;
  if (!v.expiresAt) return 'Tanpa batas waktu';
  return `${v.status === 'expired' ? 'Berakhir' : 'Berlaku s.d.'} ${fmt(v.expiresAt)}`;
}

/** Kode referral dari tautan undangan (?ref=…), disimpan sampai pengguna selesai login. */
export const REFERRAL_STORAGE_KEY = 'cardbus.pendingReferral';
export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');

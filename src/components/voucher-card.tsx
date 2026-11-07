import type { ReactNode } from 'react';
import { formatRupiah } from '@/lib/format';
import type { UserVoucher } from '@/lib/types';
import { discountBadge, discountLabel, voucherDateLine } from '@/lib/vouchers';

/** Kartu voucher bergaya kupon (sama dengan _VoucherCard di mobile). */
export function VoucherCard({ voucher: v, action, note, dim }: { voucher: UserVoucher; action?: ReactNode; note?: ReactNode; dim?: boolean }) {
  const active = (v.status === 'available' || v.status === 'reserved') && !dim;
  return (
    <div className={`flex overflow-hidden rounded-2xl border border-line bg-white ${active ? '' : 'opacity-75'}`}>
      <div className={`relative flex w-24 shrink-0 flex-col items-center justify-center px-2 text-center ${active ? 'bg-brand text-white' : 'bg-[#eef1f1] text-faint'}`}>
        <span className="text-lg font-extrabold leading-tight">{discountBadge(v)}</span>
        <span className={`text-[9.5px] font-bold tracking-wide ${active ? 'text-white/85' : ''}`}>DISKON</span>
        {/* Lubang sobekan kupon */}
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#f4f7f7]" aria-hidden />
        <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[#f4f7f7]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 border-l-2 border-dashed border-line p-3">
        <p className={`text-[14.5px] font-extrabold ${active ? 'text-ink' : 'text-muted'}`}>{v.title}</p>
        <p className="text-xs text-muted">Diskon {discountLabel(v)}</p>
        <p className="text-xs text-muted">{v.minPurchase ? `Min. pembelian ${formatRupiah(v.minPurchase)}` : 'Tanpa minimum pembelian'}</p>
        <p className="text-xs text-muted">{voucherDateLine(v)}</p>
        {v.status === 'reserved' && <p className="text-xs font-semibold text-[#8a5a00]">Sedang dipakai di pesanan yang belum dibayar</p>}
        {note}
        {action && <div className="pt-1.5">{action}</div>}
      </div>
    </div>
  );
}

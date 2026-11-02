import type { Order } from '@/lib/types';

/** Warna badge status, sama dengan ticketBadgeColors() di aplikasi mobile. */
const TONE = {
  active: 'bg-[#e5f4ea] text-[#1f6a3a]',
  used: 'bg-[#e6eef9] text-[#1e5aa8]',
  expired: 'bg-[#eef1f1] text-muted',
  cancelled: 'bg-[#fbe9e9] text-[#9b1c1c]',
  pending: 'bg-[#fff4d6] text-[#8a5a00]',
} as const;

export function StatusBadge({ order }: { order: Order }) {
  const key = order.ticketStatus ?? (order.status === 'paid' ? 'active' : order.status === 'pending' ? 'pending' : order.status);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${TONE[key]}`}>
      {order.ticketStatusLabel ?? order.statusLabel}
    </span>
  );
}

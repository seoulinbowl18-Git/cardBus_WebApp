'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { voucherApi } from '@/lib/api/endpoints';
import { formatRupiah } from '@/lib/format';
import type { UserVoucher } from '@/lib/types';
import { VoucherCard } from './voucher-card';

interface Props {
  subtotal: number;
  selectedId: number | null;
  onClose: () => void;
  /** Dipanggil setelah server menghitung diskonnya (POST /api/vouchers/quote). */
  onPick: (voucher: UserVoucher, discount: number) => void;
}

/**
 * "Pakai voucher" di checkout (VoucherPickerSheet mobile): daftar voucher tersedia, yang belum
 * memenuhi minimum pembelian tampil samar. Diskon dihitung server, bukan di browser.
 */
export function VoucherPicker({ subtotal, selectedId, onClose, onPick }: Props) {
  const [list, setList] = useState<UserVoucher[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    voucherApi
      .list('available')
      .then((v) => setList(v.filter((x) => x.status === 'available' || x.id === selectedId)))
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat voucher'));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, selectedId]);

  async function pick(v: UserVoucher) {
    setBusyId(v.id);
    setErrors((e) => ({ ...e, [v.id]: '' }));
    try {
      const q = await voucherApi.quote(v.id, subtotal);
      onPick(v, q.discount);
    } catch (err) {
      setErrors((e) => ({ ...e, [v.id]: err instanceof ApiError ? err.message : 'Voucher tidak bisa dipakai' }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Pakai voucher"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[22px] bg-[#f4f7f7] shadow-2xl sm:rounded-[22px]"
      >
        <div className="flex items-center bg-white px-5 pb-3 pt-4">
          <div className="flex-1">
            <h2 className="text-lg font-extrabold">Pakai voucher</h2>
            <p className="text-xs text-muted">Total belanja {formatRupiah(subtotal)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-muted hover:bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {loadError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
          {!loadError && !list && <p className="py-6 text-center text-sm text-muted">Memuat voucher…</p>}
          {list && list.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-muted">
              Belum ada voucher yang bisa dipakai. Ajak teman untuk mendapatkan voucher perjalanan!
              <Link href="/akun/ajak-teman" className="mt-3 block font-bold text-brand">Ajak Teman →</Link>
            </div>
          )}
          {list?.map((v) => {
            const short = subtotal < (v.minPurchase ?? 0);
            const err = errors[v.id] || (short ? `Belanja min. ${formatRupiah(v.minPurchase ?? 0)}` : '');
            const on = v.id === selectedId;
            return (
              <button
                key={v.id}
                type="button"
                disabled={short || busyId !== null}
                onClick={() => pick(v)}
                aria-pressed={on}
                className={`block w-full rounded-2xl text-left transition disabled:cursor-not-allowed ${on ? 'ring-2 ring-brand' : 'hover:ring-2 hover:ring-brand/40'}`}
              >
                <VoucherCard
                  voucher={v}
                  dim={short}
                  note={
                    <>
                      {err && <span className="block text-xs font-semibold text-[#9b1c1c]">{err}</span>}
                      {busyId === v.id && <span className="block text-xs text-muted">Menghitung diskon…</span>}
                      {on && !err && <span className="block text-xs font-bold text-brand">✓ Dipakai</span>}
                    </>
                  }
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

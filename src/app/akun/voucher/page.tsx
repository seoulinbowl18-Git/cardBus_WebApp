'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { VoucherCard } from '@/components/voucher-card';
import { ApiError } from '@/lib/api/client';
import { voucherApi } from '@/lib/api/endpoints';
import type { UserVoucher, VoucherTab } from '@/lib/types';
import { normalizeCode } from '@/lib/vouchers';
import { useUi } from '@/providers/ui-provider';

const TABS: { key: VoucherTab; label: string; empty: string }[] = [
  { key: 'available', label: 'Tersedia', empty: 'Belum ada voucher. Ajak teman atau klaim kode promo untuk mendapatkan voucher perjalanan!' },
  { key: 'used', label: 'Sudah Digunakan', empty: 'Belum ada voucher yang dipakai.' },
  { key: 'expired', label: 'Kedaluwarsa', empty: 'Tidak ada voucher yang kedaluwarsa.' },
];

/** "Voucher & Kupon Saya" (VouchersScreen mobile) + klaim kode voucher publik. */
function Vouchers() {
  const { toast } = useUi();
  const [tab, setTab] = useState<VoucherTab>('available');
  const [lists, setLists] = useState<Partial<Record<VoucherTab, UserVoucher[]>>>({});
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  const load = useCallback((t: VoucherTab) => {
    setError(null);
    voucherApi
      .list(t)
      .then((v) => setLists((l) => ({ ...l, [t]: v })))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat voucher'));
  }, []);

  useEffect(() => {
    if (!lists[tab]) load(tab);
  }, [tab, lists, load]);

  async function claim(e: FormEvent) {
    e.preventDefault();
    const c = normalizeCode(code);
    if (c.length < 3) return toast('Isi kode voucher dengan benar.');
    setClaiming(true);
    try {
      const v = await voucherApi.claim(c);
      toast(`Voucher "${v.title}" berhasil diklaim`);
      setCode('');
      setTab('available');
      setLists((l) => ({ ...l, available: [v, ...(l.available ?? []).filter((x) => x.id !== v.id)] }));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal mengklaim voucher');
    } finally {
      setClaiming(false);
    }
  }

  const list = lists[tab];
  const meta = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/akun" className="text-sm text-brand">← Akun</Link>
        <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">Voucher & Kupon Saya</h1>
      </div>

      <form onSubmit={claim} className="flex gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Punya kode voucher? Masukkan di sini"
          aria-label="Kode voucher"
          maxLength={40}
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2.5 font-mono text-sm uppercase tracking-wide outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-brand"
        />
        <button disabled={claiming} className="shrink-0 rounded-lg bg-brand px-4 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {claiming ? 'Klaim…' : 'Klaim'}
        </button>
      </form>

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-[#eef3f3] p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-2 py-2 text-xs font-extrabold transition sm:text-sm ${tab === t.key ? 'bg-white text-brand shadow-sm' : 'text-muted hover:bg-white/60'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error} <button onClick={() => load(tab)} className="ml-1 font-bold underline">Coba lagi</button>
        </div>
      )}
      {!error && !list && <p className="py-8 text-center text-muted">Memuat…</p>}
      {list && list.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-sm leading-relaxed text-muted">{meta.empty}</p>
          {tab === 'available' && (
            <Link href="/akun/ajak-teman" className="mt-4 inline-block rounded-xl bg-gold px-5 py-2.5 font-extrabold text-ink hover:brightness-95">Ajak Teman</Link>
          )}
        </div>
      )}
      {list && list.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((v) => (
            <li key={v.id}>
              <VoucherCard
                voucher={v}
                action={
                  v.status === 'available' ? (
                    <Link href="/" className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark">
                      Gunakan Voucher
                    </Link>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
      {tab === 'available' && list && list.length > 0 && (
        <p className="text-center text-xs text-faint">Pilih jadwal perjalanan dulu, lalu pilih voucher di halaman pembayaran (checkout).</p>
      )}
    </div>
  );
}

export default function VouchersPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <RequireAuth>
        <Vouchers />
      </RequireAuth>
    </div>
  );
}

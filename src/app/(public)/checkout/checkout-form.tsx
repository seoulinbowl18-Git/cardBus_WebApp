'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { BusPhoto } from '@/components/bus-photo';
import { FacilityChips } from '@/components/facility-chips';
import { TripStops } from '@/components/trip-stops';
import { PhotoCountBadge } from '@/components/bus-gallery';
import { SeatLayoutMap } from '@/components/seat-layout-map';
import { SeatPicker } from '@/components/seat-picker';
import { VoucherPicker } from '@/components/voucher-picker';
import { PoBadge } from '@/components/ui/po-badge';
import { ApiError } from '@/lib/api/client';
import { orderApi, tripApi, voucherApi } from '@/lib/api/endpoints';
import { formatDuration, formatRupiah, shortDate } from '@/lib/format';
import {
  MAX_SEATS,
  isValidContactPhone,
  isValidEmail,
  isValidPassengerName,
  sortSeats,
  toLocalPhone,
} from '@/lib/seats';
import { PAYMENT_METHODS, type PaymentMethod, type Trip, type UserVoucher } from '@/lib/types';
import { discountLabel } from '@/lib/vouchers';
import { useAuth } from '@/providers/auth-provider';

interface Props {
  tripId: string;
  from: string;
  to: string;
  date: string;
  tier?: string;
  /** Titik naik/turun dari hasil pencarian, untuk kembali ke daftar yang sama. */
  boardPoint?: string;
  dropPoint?: string;
}

/** Keterangan metode, sama dengan PayMethod.subtitle di mobile. */
const METHOD_HINT: Record<PaymentMethod, string> = {
  qris: 'Semua e-wallet & mobile banking',
  va_bca: 'Verifikasi otomatis',
  va_bri: 'Verifikasi otomatis',
  va_bni: 'Verifikasi otomatis',
  va_mandiri: 'Verifikasi otomatis',
};

/**
 * Checkout satu halaman. Isinya sama dengan alur mobile (QuickCheckoutSheet → PassengerScreen →
 * PaymentScreen): varian & kursi → nama penumpang → kontak → metode bayar → setuju S&K →
 * POST /api/payments/create. Harga final dihitung server; total di sini hanya perkiraan.
 */
export function CheckoutForm({ tripId, from, to, date, tier: initialTier, boardPoint, dropPoint }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tierKey, setTierKey] = useState<string | null>(initialTier ?? null);
  const [seats, setSeats] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('qris');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Backend belum punya GET /api/trips/:id → cari ulang rute & tanggal yang sama lalu ambil jadwalnya.
  const loadTrip = useCallback(async () => {
    try {
      // Sertakan titik naik/turun pilihan agar backend mengembalikan rute yang sama dengan hasil pencarian
      const list = await tripApi.search({ from, to, date, ...(boardPoint && { boardPoint }), ...(dropPoint && { dropPoint }) });
      const found = list.find((t) => String(t.id) === tripId) ?? null;
      setTrip(found);
      setLoadError(found ? null : 'Jadwal tidak ditemukan atau sudah tidak tersedia.');
      return found;
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat jadwal');
      return null;
    }
  }, [tripId, from, to, date, boardPoint, dropPoint]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  // Varian default: yang diminta di URL, kalau tidak ada → varian pertama yang masih punya kursi.
  useEffect(() => {
    if (!trip) return;
    if (!tierKey || !trip.tiers.some((t) => t.key === tierKey)) {
      setTierKey((trip.tiers.find((t) => t.freeSeats.length > 0) ?? trip.tiers[0])?.key ?? null);
    }
  }, [trip, tierKey]);

  // Isi kontak dari profil (sekali, kalau masih kosong).
  useEffect(() => {
    if (!user) return;
    setPhone((p) => p || toLocalPhone(user.phone));
    setEmail((e) => e || user.email || '');
  }, [user]);

  const tier = useMemo(() => trip?.tiers.find((t) => t.key === tierKey) ?? null, [trip, tierKey]);
  const subtotal = tier ? tier.price * seats.length : 0;
  // Voucher (opsional): diskon dihitung server lewat POST /api/vouchers/quote
  const [voucher, setVoucher] = useState<UserVoucher | null>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherNote, setVoucherNote] = useState<string | null>(null);
  const [pickingVoucher, setPickingVoucher] = useState(false);
  const total = Math.max(0, subtotal - (voucher ? discount : 0));

  // Jumlah kursi / varian berubah → hitung ulang diskon; lepas voucher bila tidak lagi memenuhi syarat
  useEffect(() => {
    if (!voucher) return;
    if (subtotal <= 0) {
      setDiscount(0);
      return;
    }
    let alive = true;
    voucherApi
      .quote(voucher.id, subtotal)
      .then((q) => alive && setDiscount(q.discount))
      .catch((e) => {
        if (!alive) return;
        setVoucher(null);
        setDiscount(0);
        setVoucherNote(`Voucher dilepas: ${e instanceof ApiError ? e.message : 'tidak bisa dipakai'}`);
      });
    return () => {
      alive = false;
    };
  }, [voucher, subtotal]);
  const savedNames = useMemo(
    () => [...new Set([user?.name, ...(user?.savedPassengers ?? []).map((p) => p.name)].filter((n): n is string => !!n))],
    [user],
  );
  const usedNames = new Set(seats.map((s) => (names[s] ?? '').trim().toLowerCase()));

  function changeTier(key: string) {
    setTierKey(key);
    setSeats([]); // kursi terikat varian
    setSubmitError(null);
  }

  /** Dari denah: ketuk kursi varian lain → pindah varian dan pilih kursi itu. */
  function changeTierWithSeat(key: string, seat: string) {
    changeTier(key);
    const accountName = user?.name;
    if (accountName) setNames((n) => ({ ...n, [seat]: n[seat] || accountName }));
    setSeats([seat]);
  }

  function toggleSeat(seat: string) {
    setSubmitError(null);
    if (seats.includes(seat)) {
      setSeats(seats.filter((s) => s !== seat));
      return;
    }
    if (seats.length >= MAX_SEATS) return;
    // Penumpang pertama otomatis memakai nama akun
    const accountName = user?.name;
    if (seats.length === 0 && accountName) setNames((n) => ({ ...n, [seat]: n[seat] || accountName }));
    setSeats(sortSeats([...seats, seat]));
  }

  /** Ketuk nama tersimpan → isi kolom penumpang pertama yang masih kosong. */
  function fillSaved(name: string) {
    const empty = seats.find((s) => !(names[s] ?? '').trim());
    if (empty) setNames((n) => ({ ...n, [empty]: name }));
  }

  const errors = {
    seats: seats.length === 0 ? 'Pilih minimal 1 kursi' : null,
    names: seats.some((s) => !isValidPassengerName(names[s] ?? '')) ? 'Nama penumpang minimal 3 huruf' : null,
    phone: !isValidContactPhone(phone) ? 'Nomor WhatsApp diawali 08, 10–13 digit' : null,
    email: !isValidEmail(email) ? 'Email tidak valid' : null,
    agree: !agree ? 'Centang dulu untuk lanjut' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!trip || !tier || hasErrors) {
      // Bawa pengguna ke bagian pertama yang belum lengkap
      const first = (['seats', 'names', 'phone', 'email', 'agree'] as const).find((k) => errors[k]);
      if (first) document.getElementById(`step-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await orderApi.create({
        tripId: trip.id,
        date,
        from,
        to,
        tierKey: tier.key,
        seats,
        passengers: seats.map((s) => ({ name: names[s].trim() })),
        contact: { phone, email: email.trim() },
        method,
        ...(voucher && { userVoucherId: voucher.id }),
      });
      router.push(`/pesanan/${order.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal membuat pesanan';
      setSubmitError(msg);
      if (err instanceof ApiError && err.status === 409) {
        // Kursi diambil orang lain: muat ulang ketersediaan, buang kursi yang sudah tidak kosong
        const fresh = await loadTrip();
        const freeNow = new Set(fresh?.tiers.find((t) => t.key === tier.key)?.freeSeats ?? []);
        setSeats((cur) => cur.filter((s) => freeNow.has(s)));
      }
      setSubmitting(false);
    }
  }

  const backHref = `/cari?${new URLSearchParams({ from, to, date, ...(boardPoint && { boardPoint }), ...(dropPoint && { dropPoint }) })}`;
  if (loadError && !trip) {
    return (
      <div className="space-y-2 rounded-xl bg-red-50 p-4 text-red-700">
        <p>{loadError}</p>
        <Link href={backHref} className="text-sm font-semibold underline">Kembali ke hasil pencarian</Link>
      </div>
    );
  }
  if (!trip) return <p className="py-10 text-center text-muted">Memuat jadwal…</p>;

  const show = (msg: string | null) => (touched && msg ? <p className="mt-2 text-sm font-semibold text-[#9b1c1c]">{msg}</p> : null);
  const payLabel = submitting ? 'Membuat tagihan…' : 'Bayar sekarang';

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
      <div className="min-w-0 space-y-4">
        {/* Ringkasan jadwal (header QuickCheckoutSheet) */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="relative">
            <BusPhoto src={trip.image} alt={trip.poName} className="h-36 w-full sm:h-44" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,46,49,0.85)_0%,rgba(4,46,49,0)_70%)]" />
            <PhotoCountBadge trip={trip} className="absolute right-3 top-3 z-10" />
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
              <PoBadge name={trip.poName} logo={trip.logo} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold">PO {trip.poName}</p>
                <p className="truncate text-sm text-white/80">{trip.busClass}</p>
              </div>
              <Link href={backHref} className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30">
                Ganti jadwal
              </Link>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-sm font-semibold">{from} → {to} · {shortDate(date)}</p>
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <p className="text-[17px] font-extrabold leading-tight">{trip.depart}</p>
                <p className="truncate text-[11px] text-muted">{trip.boardPoint}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[11px] text-muted">{formatDuration(trip.durationMinutes)}</p>
                <div className="mx-2 border-t border-line" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[17px] font-extrabold leading-tight">{trip.arrive}</p>
                <p className="truncate text-[11px] text-muted">{trip.dropPoint}</p>
              </div>
            </div>
            <FacilityChips codes={trip.facilities} />
            <TripStops trip={trip} />
          </div>
        </div>

        {/* 1. Varian & kursi */}
        <Step id="step-seats" n={1} title={trip.tiers.length > 1 ? 'Varian & kursi' : 'Pilih kursi'}>
          {trip.tiers.length > 1 && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {trip.tiers.map((t) => {
                const on = t.key === tierKey;
                const soldOut = t.freeSeats.length === 0;
                return (
                  <button
                    key={t.key}
                    type="button"
                    disabled={soldOut}
                    onClick={() => changeTier(t.key)}
                    aria-pressed={on}
                    className={`rounded-xl border-[1.4px] px-3 py-2.5 text-left transition disabled:opacity-50 ${on ? 'border-brand bg-teal-soft' : 'border-line bg-white hover:border-brand'}`}
                  >
                    <span className="block text-sm font-extrabold">{t.name}</span>
                    <span className="block text-xs text-muted">
                      {formatRupiah(t.price)} · {soldOut ? 'habis' : `sisa ${t.freeSeats.length}`}
                    </span>
                    {t.oldPrice ? <span className="text-[11px] text-faint line-through">{formatRupiah(t.oldPrice)}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {tier &&
            (trip.layout?.length ? (
              // Denah per lantai dari backend (format prototipe): G1A Grand Captain, B1A lantai bawah, S1A sleeper, dst.
              <SeatLayoutMap
                layout={trip.layout}
                tiers={trip.tiers}
                tierKey={tier.key}
                selected={seats}
                max={MAX_SEATS}
                onToggle={toggleSeat}
                onTierChange={changeTierWithSeat}
              />
            ) : (
              <SeatPicker tier={tier} selected={seats} max={MAX_SEATS} onToggle={toggleSeat} />
            ))}
          {show(errors.seats)}
        </Step>

        {/* 2. Penumpang */}
        <Step id="step-names" n={2} title="Data penumpang" hint="Cukup nama lengkap tiap penumpang">
          {seats.length === 0 ? (
            <p className="text-sm text-muted">Pilih kursi dulu; satu nama untuk setiap kursi.</p>
          ) : (
            <div className="space-y-3">
              {seats.map((s, i) => (
                <label key={s} className="block text-xs font-semibold text-muted">
                  Penumpang {i + 1} · kursi {s}
                  <input
                    value={names[s] ?? ''}
                    onChange={(e) => setNames((n) => ({ ...n, [s]: e.target.value }))}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Nama lengkap penumpang"
                    className={inputCls}
                  />
                </label>
              ))}
              {savedNames.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted">Penumpang tersimpan — ketuk untuk mengisi:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedNames.map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={usedNames.has(n.toLowerCase())}
                        onClick={() => fillSaved(n)}
                        className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-brand hover:border-brand disabled:text-faint disabled:opacity-60"
                      >
                        + {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {show(errors.names)}
            </div>
          )}
        </Step>

        {/* 3. Kontak */}
        <Step id="step-phone" n={3} title="Kontak pemesan" hint="E-tiket & info perjalanan dikirim ke kontak ini">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-muted">
              Nomor WhatsApp
              <input value={phone} onChange={(e) => setPhone(toLocalPhone(e.target.value))} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className={inputCls} />
              {show(errors.phone)}
            </label>
            <label id="step-email" className="block text-xs font-semibold text-muted">
              Email (untuk e-tiket)
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" className={inputCls} />
              {show(errors.email)}
            </label>
          </div>
        </Step>

        {/* Voucher (PaymentScreen mobile: "Pakai voucher") */}
        <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-brand">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Zm6 0v10" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{voucher ? voucher.title : 'Pakai voucher'}</p>
              <p className="text-xs text-muted">
                {voucher ? `Hemat ${formatRupiah(discount)} · diskon ${discountLabel(voucher)}` : 'Pilih voucher untuk potongan harga'}
              </p>
            </div>
            {voucher ? (
              <button type="button" onClick={() => { setVoucher(null); setDiscount(0); }} className="shrink-0 text-sm font-bold text-[#9b1c1c]">
                Hapus
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (seats.length ? setPickingVoucher(true) : setVoucherNote('Pilih kursi dulu, lalu pilih voucher.'))}
                className="shrink-0 rounded-lg border border-brand px-3 py-1.5 text-sm font-bold text-brand hover:bg-teal-soft"
              >
                Pilih
              </button>
            )}
          </div>
          {voucherNote && <p className="mt-2 text-xs font-semibold text-[#8a5a00]">{voucherNote}</p>}
        </section>
        {pickingVoucher && (
          <VoucherPicker
            subtotal={subtotal}
            selectedId={voucher?.id ?? null}
            onClose={() => setPickingVoucher(false)}
            onPick={(v, d) => {
              setVoucher(v);
              setDiscount(d);
              setVoucherNote(null);
              setPickingVoucher(false);
            }}
          />
        )}

        {/* 4. Metode bayar */}
        <Step id="step-method" n={4} title="Metode pembayaran">
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => {
              const on = method === m.value;
              return (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-[1.4px] px-3 py-3 ${on ? 'border-brand bg-teal-soft' : 'border-line bg-white hover:border-brand'}`}
                >
                  <input type="radio" name="method" value={m.value} checked={on} onChange={() => setMethod(m.value)} className="h-4 w-4 accent-brand" />
                  <span>
                    <span className="block text-sm font-extrabold">{m.label}</span>
                    <span className="block text-xs text-muted">{METHOD_HINT[m.value]}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Step>

        {/* Persetujuan (PassengerScreen mobile) */}
        <div id="step-agree" className="rounded-2xl border border-line bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
            <span>
              Saya setuju dengan <Link href="/syarat-ketentuan" target="_blank" className="font-semibold text-brand underline">syarat & ketentuan</Link> serta{' '}
              <Link href="/akun/pembatalan" target="_blank" className="font-semibold text-brand underline">kebijakan pembatalan</Link> PO.
            </span>
          </label>
          {show(errors.agree)}
        </div>
      </div>

      {/* Ringkasan harga: kolom kanan di layar lebar */}
      <aside className="hidden h-fit space-y-3 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-20 lg:block">
        <h2 className="font-extrabold">Ringkasan</h2>
        <div className="space-y-1.5 text-sm">
          <Row label="Varian" value={tier?.name ?? '-'} />
          <Row label="Kursi" value={seats.length ? seats.join(', ') : '-'} />
          <Row label={`Harga × ${seats.length || 0}`} value={tier ? formatRupiah(tier.price) : '-'} />
          {voucher && <Row label="Voucher" value={`− ${formatRupiah(discount)}`} />}
          <Row label="Metode" value={PAYMENT_METHODS.find((m) => m.value === method)?.label ?? '-'} />
        </div>
        <div className="flex justify-between border-t border-line pt-3">
          <span className="font-bold">Total bayar</span>
          <span className="text-lg font-extrabold text-brand-dark">{formatRupiah(total)}</span>
        </div>
        {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <button disabled={submitting || !tier} className={`${payBtnCls} w-full`}>{payLabel}</button>
        <p className="text-xs text-faint">Perkiraan; total akhir dihitung server saat tagihan dibuat. Kursi ditahan sampai batas waktu bayar.</p>
      </aside>

      {/* Bar bawah di HP/tablet (bottom bar QuickCheckoutSheet) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(6,78,82,0.08)] lg:hidden">
        {submitError && <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{submitError}</p>}
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted">Total ({seats.length} kursi{seats.length ? ` · ${seats.join(', ')}` : ''}){voucher && discount ? ` · hemat ${formatRupiah(discount)}` : ''}</p>
            <p className="text-lg font-extrabold">{formatRupiah(total)}</p>
          </div>
          <button disabled={submitting || !tier} className={`${payBtnCls} shrink-0 px-6`}>{payLabel}</button>
        </div>
      </div>
    </form>
  );
}

const inputCls = 'mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-brand';
const payBtnCls = 'rounded-xl bg-gold py-3 font-extrabold text-ink shadow-sm transition hover:brightness-95 disabled:opacity-60';

function Step({ id, n, title, hint, children }: { id: string; n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n}</span>
        <div>
          <h2 className="font-extrabold">{title}</h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

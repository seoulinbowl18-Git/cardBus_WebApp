'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BusPhoto, PoLogo } from '@/components/bus-photo';
import { FacilityChips } from '@/components/facility-chips';
import { SeatPicker } from '@/components/seat-picker';
import { ApiError } from '@/lib/api/client';
import { orderApi, tripApi } from '@/lib/api/endpoints';
import { formatDate, formatDuration, formatRupiah } from '@/lib/format';
import {
  MAX_SEATS,
  isValidContactPhone,
  isValidEmail,
  isValidPassengerName,
  sortSeats,
  toLocalPhone,
} from '@/lib/seats';
import { PAYMENT_METHODS, type PaymentMethod, type Trip } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

interface Props {
  tripId: string;
  from: string;
  to: string;
  date: string;
  tier?: string;
}

/**
 * Checkout: pilih varian & kursi → data penumpang → kontak → metode bayar → POST /api/payments/create.
 * Harga final dihitung server; total di sini hanya perkiraan dari GET /api/trips.
 */
export function CheckoutForm({ tripId, from, to, date, tier: initialTier }: Props) {
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Backend belum punya GET /api/trips/:id → cari ulang rute & tanggal yang sama lalu ambil jadwalnya.
  const loadTrip = useCallback(async () => {
    try {
      const list = await tripApi.search({ from, to, date });
      const found = list.find((t) => t.id === tripId) ?? null;
      setTrip(found);
      setLoadError(found ? null : 'Jadwal tidak ditemukan atau sudah tidak tersedia.');
      return found;
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat jadwal');
      return null;
    }
  }, [tripId, from, to, date]);

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
  const total = tier ? tier.price * seats.length : 0;
  const savedNames = useMemo(
    () => [...new Set([user?.name, ...(user?.savedPassengers ?? []).map((p) => p.name)].filter((n): n is string => !!n))],
    [user],
  );

  function changeTier(key: string) {
    setTierKey(key);
    setSeats([]); // kursi terikat varian
    setSubmitError(null);
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

  const errors = {
    seats: seats.length === 0 ? 'Pilih minimal 1 kursi' : null,
    names: seats.some((s) => !isValidPassengerName(names[s] ?? '')) ? 'Nama penumpang minimal 3 huruf' : null,
    phone: !isValidContactPhone(phone) ? 'Nomor HP diawali 08, 10–13 digit' : null,
    email: !isValidEmail(email) ? 'Email tidak valid' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!trip || !tier || hasErrors) return;
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

  if (loadError && !trip) {
    return (
      <div className="space-y-2 rounded-lg bg-red-50 p-4 text-red-700">
        <p>{loadError}</p>
        <Link href={`/cari?${new URLSearchParams({ from, to, date })}`} className="text-sm underline">
          Kembali ke hasil pencarian
        </Link>
      </div>
    );
  }
  if (!trip) return <p className="text-slate-500">Memuat jadwal…</p>;

  const show = (msg: string | null) => (touched && msg ? <p className="text-sm text-red-600">{msg}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Ringkasan jadwal */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row">
          <BusPhoto src={trip.image} alt={trip.poName} className="h-32 w-full shrink-0 rounded-xl sm:h-24 sm:w-36" />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <PoLogo src={trip.logo} alt={trip.poName} />
                  <h2 className="font-bold">{trip.poName}</h2>
                </div>
                <p className="text-sm text-slate-500">{trip.busClass}</p>
              </div>
              <Link href={`/cari?${new URLSearchParams({ from, to, date })}`} className="text-sm text-brand">
                Ganti jadwal
              </Link>
            </div>
            <p className="text-sm">
              {formatDate(date)} · <b>{trip.depart}</b> → <b>{trip.arrive}</b> ({formatDuration(trip.durationMinutes)})
            </p>
            <p className="text-sm text-slate-500">
              Naik di {trip.boardPoint} · Turun di {trip.dropPoint}
            </p>
            <div className="pt-1">
              <FacilityChips codes={trip.facilities} />
            </div>
          </div>
        </div>

        {/* 1. Varian & kursi */}
        <Step n={1} title="Pilih kursi">
          {trip.tiers.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {trip.tiers.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => changeTier(t.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${t.key === tierKey ? 'border-brand bg-brand/5' : 'border-slate-300 bg-white'}`}
                >
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-brand">{formatRupiah(t.price)}</span>
                  {t.oldPrice ? <span className="ml-1 text-xs text-slate-400 line-through">{formatRupiah(t.oldPrice)}</span> : null}
                  <span className="block text-xs text-slate-500">{t.freeSeats.length} kursi kosong</span>
                </button>
              ))}
            </div>
          )}
          {tier && <SeatPicker tier={tier} selected={seats} max={MAX_SEATS} onToggle={toggleSeat} />}
          {show(errors.seats)}
        </Step>

        {/* 2. Penumpang */}
        <Step n={2} title="Data penumpang">
          {seats.length === 0 ? (
            <p className="text-sm text-slate-500">Pilih kursi dulu; satu nama untuk setiap kursi.</p>
          ) : (
            <div className="space-y-3">
              {seats.map((s, i) => (
                <label key={s} className="flex flex-col gap-1 text-sm">
                  Penumpang {i + 1} · Kursi {s}
                  <input
                    value={names[s] ?? ''}
                    onChange={(e) => setNames((n) => ({ ...n, [s]: e.target.value }))}
                    list="saved-passengers"
                    maxLength={80}
                    placeholder="Nama sesuai identitas"
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              ))}
              <datalist id="saved-passengers">
                {savedNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              {show(errors.names)}
            </div>
          )}
        </Step>

        {/* 3. Kontak */}
        <Step n={3} title="Kontak pemesan">
          <p className="mb-3 text-sm text-slate-500">E-tiket & info perjalanan dikirim ke kontak ini.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Nomor HP
              <input
                value={phone}
                onChange={(e) => setPhone(toLocalPhone(e.target.value))}
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              {show(errors.phone)}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                placeholder="nama@email.com"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              {show(errors.email)}
            </label>
          </div>
        </Step>

        {/* 4. Metode bayar */}
        <Step n={4} title="Metode pembayaran">
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${method === m.value ? 'border-brand bg-brand/5' : 'border-slate-300 bg-white'}`}
              >
                <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="accent-brand" />
                <span className="font-medium">{m.label}</span>
              </label>
            ))}
          </div>
        </Step>
      </div>

      {/* Ringkasan harga */}
      <aside className="h-fit space-y-3 rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <h2 className="font-bold">Ringkasan</h2>
        <div className="space-y-1 text-sm">
          <Row label="Varian" value={tier?.name ?? '-'} />
          <Row label="Kursi" value={seats.length ? seats.join(', ') : '-'} />
          <Row label={`Harga × ${seats.length || 0}`} value={tier ? formatRupiah(tier.price) : '-'} />
          <Row label="Metode" value={PAYMENT_METHODS.find((m) => m.value === method)?.label ?? '-'} />
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 font-bold">
          <span>Total</span>
          <span className="text-brand">{formatRupiah(total)}</span>
        </div>
        {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <button
          disabled={submitting || !tier}
          className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? 'Memproses…' : 'Bayar Sekarang'}
        </button>
        <p className="text-xs text-slate-500">Kursi ditahan sementara sampai batas waktu pembayaran. Total final dihitung server.</p>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

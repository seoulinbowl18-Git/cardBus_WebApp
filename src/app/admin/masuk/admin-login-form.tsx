'use client';

import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { useAdminSession } from '@/providers/admin-session';

/** Login Admin Pusat: OTP WhatsApp ke nomor yang terdaftar sebagai admin (verify-otp scope 'admin'). */
export function AdminLoginForm() {
  const { admin, ready, login } = useAdminSession();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const target = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && admin) router.replace(target);
  }, [ready, admin, router, target]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendOtp(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.sendOtp(phone);
      setResendIn(res.resendIn);
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim OTP');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(await adminApi.verifyOtp(phone, code));
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verifikasi gagal');
      // Kode ditolak (mis. bukan admin) sudah dihapus backend: minta kode baru
      if (err instanceof ApiError && err.status === 403) {
        setStep('phone');
        setCode('');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <Image src="/brand/cardbus-header.png" alt="CardBus" width={552} height={100} priority className="h-7 w-auto" />
        <h1 className="text-2xl font-bold">Masuk Admin Pusat</h1>
        <p className="text-sm text-muted">Khusus pemilik CardBus. Kode OTP dikirim ke WhatsApp nomor yang terdaftar sebagai admin.</p>
      </div>
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            Nomor WhatsApp admin
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
              placeholder="08xxxxxxxxxx"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Mengirim…' : 'Kirim Kode OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm text-slate-600">Kode 6 digit dikirim ke WhatsApp {phone}.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="\d{6}"
            placeholder="______"
            aria-label="Kode OTP"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.5em]"
          />
          <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setStep('phone')} className="text-slate-500">Ganti nomor</button>
            <button type="button" disabled={resendIn > 0 || busy} onClick={() => sendOtp()} className="text-brand disabled:text-slate-400">
              {resendIn > 0 ? `Kirim ulang (${resendIn}s)` : 'Kirim ulang'}
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

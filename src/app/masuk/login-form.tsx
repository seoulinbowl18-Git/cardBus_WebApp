'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/providers/auth-provider';

/** Login OTP WhatsApp: POST /api/auth/send-otp lalu /api/auth/verify-otp (sama dengan mobile). */
export function LoginForm() {
  const { login, token, ready } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && token) router.replace(target);
  }, [ready, token, router, target]);

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
      const res = await authApi.sendOtp(phone);
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
      login(await authApi.verifyOtp(phone, code));
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verifikasi gagal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Masuk</h1>
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            Nomor WhatsApp
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.5em]"
          />
          <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Memeriksa…' : 'Verifikasi'}
          </button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setStep('phone')} className="text-slate-500">Ganti nomor</button>
            <button type="button" disabled={resendIn > 0 || busy} onClick={() => sendOtp()} className="text-brand disabled:text-slate-400">
              {resendIn > 0 ? `Kirim ulang (${resendIn}s)` : 'Kirim ulang'}
            </button>
          </div>
        </form>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {/* TODO: tombol "Masuk dengan Google" (Firebase Web SDK -> authApi.google(idToken)) */}
    </section>
  );
}

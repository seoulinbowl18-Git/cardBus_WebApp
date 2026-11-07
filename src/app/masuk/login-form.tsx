'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { authApi, referralApi } from '@/lib/api/endpoints';
import { GoogleLoginCancelled, getGoogleIdToken, isGoogleLoginEnabled } from '@/lib/firebase';
import { REFERRAL_STORAGE_KEY, normalizeCode } from '@/lib/vouchers';
import { useAuth } from '@/providers/auth-provider';
import { useUi } from '@/providers/ui-provider';

const store = {
  get: () => {
    try {
      return localStorage.getItem(REFERRAL_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  },
  set: (v: string) => {
    try {
      if (v) localStorage.setItem(REFERRAL_STORAGE_KEY, v);
      else localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch {
      /* penyimpanan diblokir: kode tetap ada di kolom isian */
    }
  },
};

/** Login OTP WhatsApp: POST /api/auth/send-otp lalu /api/auth/verify-otp (sama dengan mobile). */
export function LoginForm() {
  const { login, token, ready } = useAuth();
  const { toast } = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const refParam = params.get('ref');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kode referral (Ajak Teman): dari tautan undangan ?ref=… atau diketik sendiri
  const [referral, setReferral] = useState('');
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    const fromLink = refParam ? normalizeCode(refParam) : '';
    if (fromLink) store.set(fromLink);
    const code = fromLink || store.get();
    if (code) {
      setReferral(code);
      setShowReferral(true);
    }
  }, [refParam]);

  /**
   * Pakai kode referral setelah login (sama dengan AuthProvider._applyPendingReferral di mobile).
   * Gagal (kode salah, bukan pengguna baru, …) tidak membatalkan login; pesannya ditampilkan.
   */
  async function applyReferral() {
    const code = normalizeCode(referral);
    store.set('');
    if (!code) return;
    try {
      await referralApi.apply(code);
      toast(`Kode referral ${code} berhasil dipakai. Voucher hadiah terbit setelah perjalanan pertamamu selesai.`);
    } catch (err) {
      toast(`Kode referral ${code} tidak bisa dipakai: ${err instanceof ApiError ? err.message : 'coba lagi nanti'}`);
    }
  }

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

  async function loginWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      login(await authApi.google(idToken));
      await applyReferral();
      router.replace(target);
    } catch (err) {
      if (!(err instanceof GoogleLoginCancelled)) setError(err instanceof Error ? err.message : 'Login Google gagal');
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
      await applyReferral();
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
          {showReferral ? (
            <label className="flex flex-col gap-1 text-sm">
              Kode referral <span className="text-xs text-slate-500">(opsional, untuk pengguna baru)</span>
              <input
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                placeholder="CARDBUS-NAMA"
                maxLength={40}
                className="rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase tracking-wide"
              />
            </label>
          ) : (
            <button type="button" onClick={() => setShowReferral(true)} className="text-sm font-semibold text-brand">
              Punya kode referral?
            </button>
          )}
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
      {isGoogleLoginEnabled && step === 'phone' && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            atau
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>
        </>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { RequireAuth } from '@/components/require-auth';
import { ApiError } from '@/lib/api/client';
import { referralApi } from '@/lib/api/endpoints';
import { formatRupiah } from '@/lib/format';
import type { ReferralInfo } from '@/lib/types';
import { useUi } from '@/providers/ui-provider';

const STEPS: [IconName, string, string][] = [
  ['share', 'Bagikan kode', 'Kirim kode atau tautan undangan ke teman lewat WhatsApp, media sosial, atau cara lainnya.'],
  ['person', 'Teman daftar CardBus', 'Teman membuka tautanmu, atau memasukkan kode referral saat mendaftar.'],
  ['ticket', 'Teman pesan tiket', 'Teman melakukan pemesanan tiket bus pertama kali.'],
  ['gift', 'Bonus masuk setelah perjalanan selesai', 'Kamu dan temanmu menerima voucher sesuai ketentuan.'],
];

const TERMS = [
  'Kode referral hanya bisa dipakai oleh pengguna baru saat mendaftar, dan satu pengguna hanya bisa memakai satu kode.',
  'Kode referral milik sendiri tidak bisa dipakai.',
  'Hadiah diberikan setelah teman menyelesaikan perjalanan pertama yang sudah dibayar lunas dan tercatat di manifest PO.',
  'Hadiah berupa voucher dan masuk otomatis ke menu Voucher & Kupon Saya. Masa berlaku tertera pada voucher.',
  'CardBus berhak membatalkan hadiah bila ditemukan penyalahgunaan.',
];

/** "Ajak Teman" (ReferralScreen mobile): kode & tautan undangan, hadiah dua pihak, cara kerja, S&K. */
function Referral() {
  const { toast } = useUi();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  const load = useCallback(() => {
    setError(null);
    referralApi
      .me()
      .then(setInfo)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat data Ajak Teman'));
  }, []);
  useEffect(load, [load]);

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button onClick={load} className="mt-3 rounded-xl bg-brand px-5 py-2 font-bold text-white">Coba lagi</button>
      </div>
    );
  }
  if (!info) return <p className="py-10 text-center text-muted">Memuat…</p>;

  const link = `${window.location.origin}/masuk?ref=${encodeURIComponent(info.code)}`;
  const reward = info.campaign ? ` dan dapatkan diskon ${formatRupiah(info.campaign.refereeReward)}` : '';
  const message = `Yuk pesan tiket bus lewat CardBus! Daftar pakai kode referral saya ${info.code}${reward} untuk perjalanan pertamamu. ${link}`;
  const joined = info.stats.pending + info.stats.completed;

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      toast('Gagal menyalin. Salin manual dari layar.');
    }
  }

  async function share() {
    // Menu bagikan bawaan HP bila ada; selain itu WhatsApp
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ajak teman ke CardBus', text: message });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return; // pengguna menutup menu
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <section className="relative -mx-4 -mt-8 overflow-hidden rounded-b-[24px] bg-[linear-gradient(135deg,#0a8c84_0%,#087f78_35%,#064e52_100%)] px-5 pb-6 pt-6 text-white sm:mx-0 sm:mt-0 sm:rounded-[24px] sm:p-8">
        <Link href="/akun" className="text-sm text-white/80">← Akun</Link>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
          Ajak teman,<br />
          <span className="text-gold">dapatkan hadiah!</span>
        </h1>
        <p className="mt-1 text-sm text-white/80">Bagikan kode referral CardBus dan nikmati bonus perjalanan.</p>
        {info.campaign ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Reward icon="gift" who="KAMU DAPAT" what="Voucher" value={info.campaign.referrerReward} />
              <Reward icon="person" who="TEMANMU DAPAT" what="Diskon" value={info.campaign.refereeReward} />
            </div>
            <p className="mt-2 text-center text-xs text-white/75">Setelah teman menyelesaikan perjalanan pertama</p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm">Program hadiah sedang tidak berjalan. Kode referral kamu tetap bisa dibagikan.</p>
        )}
      </section>

      {/* Kode & tautan */}
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-extrabold">Kode referral kamu</h2>
        <div className="flex items-center gap-2 rounded-xl border-[1.4px] border-dashed border-brand bg-teal-soft p-3">
          <span className="flex-1 select-all text-center font-mono text-xl font-extrabold tracking-wider text-brand-dark">{info.code}</span>
          <button onClick={() => copy(info.code, `Kode ${info.code} disalin`)} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-brand shadow-sm hover:bg-white/80">
            Salin Kode
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-muted">{link}</span>
          <button onClick={() => copy(link, 'Tautan undangan disalin')} className="shrink-0 text-sm font-bold text-brand">Salin tautan</button>
        </div>
        <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 font-extrabold text-ink hover:brightness-95">
          <Icon name="share" /> Bagikan Undangan
        </button>
        {joined > 0 && (
          <p className="text-center text-sm text-muted">
            {joined} teman sudah bergabung · {info.stats.completed} hadiah diterima
          </p>
        )}
      </section>

      {/* Cara kerja */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-extrabold">Cara kerja</h2>
        <ol className="space-y-3">
          {STEPS.map(([icon, title, text], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-extrabold"><Icon name={icon} className="h-4 w-4 text-brand" />{title}</span>
                <span className="block text-xs leading-relaxed text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <button onClick={() => setShowTerms((s) => !s)} aria-expanded={showTerms} className="mt-4 text-sm font-bold text-brand">
          Syarat & Ketentuan {showTerms ? '▴' : '▾'}
        </button>
        {showTerms && (
          <ol className="mt-2 space-y-1.5">
            {TERMS.map((t, i) => (
              <li key={t} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                <span>{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Link href="/akun/voucher" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:bg-slate-50">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-soft text-brand"><Icon name="voucher" className="h-[18px] w-[18px]" /></span>
        <span className="flex-1 text-sm font-semibold">Lihat hadiahmu di Voucher & Kupon Saya</span>
        <Icon name="chevron" className="h-5 w-5 text-faint" />
      </Link>
    </div>
  );
}

function Reward({ icon, who, what, value }: { icon: IconName; who: string; what: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-ink">
      <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wide text-brand"><Icon name={icon} className="h-4 w-4" />{who}</span>
      <span className="mt-1 block text-xs font-bold">{what}</span>
      <span className="block text-lg font-extrabold">{formatRupiah(value).replace(/\s/g, '')}</span>
    </div>
  );
}

export default function ReferralPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <RequireAuth>
        <Referral />
      </RequireAuth>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';

/** Event `beforeinstallprompt` (Chrome/Edge/Android), belum ada di lib.dom TypeScript. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'cardbus.pwa.installDismissedAt';
const DISMISS_DAYS = 14;
/**
 * Banner hanya tampil di halaman "santai". Tidak pernah di /cari, /checkout, /pesanan/[id]
 * (pembayaran), /masuk, atau /ulasan agar tidak mengganggu pemesanan.
 */
const ALLOWED_PATHS = new Set(['/', '/promo', '/pesanan', '/akun']);

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* mode privat / storage diblokir: cukup sembunyikan untuk sesi ini */
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Safari iOS/iPadOS: tidak punya beforeinstallprompt, pemasangan lewat menu Bagikan. */
function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\//i.test(ua);
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);
  // Di beranda banner baru muncul setelah pengguna menggulir melewati form cari tiket,
  // supaya tidak pernah menutupi tombol "Cari Tiket" (terutama di HP layar pendek).
  const [scrolledPastSearch, setScrolledPastSearch] = useState(false);

  useEffect(() => {
    if (pathname !== '/') return;
    const onScroll = () => {
      if (window.scrollY > 480) {
        setScrolledPastSearch(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault(); // tahan mini-infobar bawaan; tampilkan banner kita sendiri
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIosHint(false);
      setHidden(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // Petunjuk iOS muncul setelah pengguna sempat melihat halaman, bukan langsung saat dibuka.
    const t = isIosSafari() ? window.setTimeout(() => setIosHint(true), 4000) : undefined;
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, []);

  if (hidden || !ALLOWED_PATHS.has(pathname) || (!deferred && !iosHint)) return null;
  if (pathname === '/' && !scrolledPastSearch) return null;

  const dismiss = () => {
    rememberDismiss();
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
    setDeferred(null); // event hanya bisa dipakai sekali
    if (outcome === 'dismissed') rememberDismiss();
    setHidden(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Pasang aplikasi CardBus"
      // Di HP berada tepat di atas menu bawah; di layar lebar di pojok kanan bawah.
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-2xl border border-line bg-white p-3 shadow-lg sm:inset-x-auto sm:bottom-4 sm:right-4"
    >
      <div className="flex items-start gap-3">
        <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Pasang aplikasi CardBus</p>
          {deferred ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">Buka tiket lebih cepat, langsung dari layar utama.</p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Ketuk <Icon name="share" className="inline h-3.5 w-3.5 align-[-2px]" /> <b>Bagikan</b> di Safari, lalu pilih{' '}
              <b>Tambah ke Layar Utama</b>.
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Tutup" className="-m-1 rounded-lg p-1 text-faint transition hover:bg-teal-soft hover:text-ink">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
      {deferred && (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={dismiss} className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-slate-100">
            Nanti saja
          </button>
          <button type="button" onClick={install} className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark">
            Pasang
          </button>
        </div>
      )}
    </div>
  );
}

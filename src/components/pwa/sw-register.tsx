'use client';

import { useEffect } from 'react';

/**
 * Mendaftarkan service worker (public/sw.js) hanya di build produksi.
 * Di `next dev` SW yang tertinggal dilepas agar cache tidak mengganggu hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch((e) => console.warn('[pwa] gagal mendaftarkan service worker:', e));
    };
    // Tunda sampai halaman selesai dimuat agar tidak berebut bandwidth dengan render awal.
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

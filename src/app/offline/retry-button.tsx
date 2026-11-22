'use client';

import { useEffect } from 'react';

/** Muat ulang halaman yang tadi dibuka (URL tidak berubah saat SW menampilkan halaman offline). */
export function RetryButton() {
  useEffect(() => {
    const reload = () => window.location.reload();
    window.addEventListener('online', reload);
    return () => window.removeEventListener('online', reload);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-8 w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
    >
      Coba lagi
    </button>
  );
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { btnDanger, btnSecondary, inputCls } from './ui';

/**
 * Dialog konfirmasi untuk tindakan yang tidak bisa dibatalkan dari panel (hapus jadwal / mitra).
 * `confirmText` = teks yang harus diketik admin sebelum tombol aktif (mis. kode PO).
 */
export function ConfirmDialog({
  title, children, confirmLabel, confirmText, busy, error, onConfirm, onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmText?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const ready = !confirmText || typed.trim().toLowerCase() === confirmText.toLowerCase();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
        <div className="mt-2 space-y-2 text-sm text-muted">{children}</div>
        {confirmText && (
          <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
            <span>
              Ketik <code className="rounded bg-slate-100 px-1.5 font-mono text-ink">{confirmText}</code> untuk melanjutkan
            </span>
            <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnSecondary} onClick={onCancel} disabled={busy}>Batal</button>
          <button className={`${btnDanger} !border-red-600 !bg-red-600 !text-white hover:!bg-red-700`} onClick={onConfirm} disabled={!ready || busy}>
            {busy ? 'Menghapus…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

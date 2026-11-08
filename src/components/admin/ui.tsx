import type { ReactNode } from 'react';
import { TRIP_STATUS, type TripStatus } from '@/lib/api/admin';

/** Komponen kecil yang dipakai bersama halaman Admin Pusat. */

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-muted';
export const btnPrimary = 'rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60';
export const btnSecondary = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-60';
export const btnDanger = 'rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60';

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</section>;
}

export function StatusPill({ status }: { status: TripStatus }) {
  const s = TRIP_STATUS[status];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${s.cls}`}>{s.label}</span>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline">
          Coba lagi
        </button>
      )}
    </p>
  );
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium ${className}`}>
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-faint">{hint}</span>}
    </label>
  );
}

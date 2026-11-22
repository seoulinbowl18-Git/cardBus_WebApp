'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { groupPlaces, type Place } from '@/lib/locations';
import type { Locations } from '@/lib/types';

interface FieldProps {
  label: 'Dari' | 'Ke';
  value: Place;
  locations: Locations | null;
  onChange: (p: Place) => void;
  className?: string;
}

const PinIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
  </svg>
);
const CityIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
    <path d="M3 21h18M5 21V8l5-3v16M10 21V3l9 5v13M13 10h3M13 14h3M13 18h3M6.5 12h1M6.5 16h1" />
  </svg>
);

interface SearchRowProps {
  onClick: () => void;
  ariaLabel: string;
  ariaHasPopup?: 'dialog';
  ariaExpanded?: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: React.ReactNode;
  /** Ditandai aktif (mis. kalender sedang terbuka). */
  active?: boolean;
  className?: string;
}

/**
 * Satu baris di kartu cari (Dari / Ke / Tanggal): lingkaran ikon teal, label kecil, nilai tegas,
 * keterangan sekunder, dan chevron. Area sentuh selebar baris (tinggi ≥ 72px).
 */
export function SearchRow({ onClick, ariaLabel, ariaHasPopup, ariaExpanded, icon, label, value, detail, active = false, className = '' }: SearchRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup={ariaHasPopup}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={`group flex w-full min-w-0 items-center gap-3.5 rounded-[18px] px-3 py-3 text-left transition-colors duration-150 hover:bg-[#f3f8f8] active:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${active ? 'bg-teal-soft/70' : ''} ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-soft text-brand transition-colors group-hover:bg-[#d5ecea]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-faint">{label}</span>
        <span className="mt-1.5 block truncate text-xl font-extrabold leading-tight text-ink">{value}</span>
        <span className="mt-1 block truncate text-[13px] leading-snug text-muted">{detail}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-brand" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

/**
 * Kotak "Dari" / "Ke" yang bisa diklik (padanan LocationField + PointPickerScreen di mobile).
 * Membuka daftar kota & titik naik/turun dari backend, bisa dicari dengan mengetik.
 */
export function LocationField({ label, value, locations, onChange, className = '' }: FieldProps) {
  const [open, setOpen] = useState(false);
  const kind = label === 'Dari' ? 'board' : 'drop';
  const verb = kind === 'board' ? 'naik' : 'turun';
  return (
    <>
      <SearchRow
        onClick={() => setOpen(true)}
        ariaHasPopup="dialog"
        ariaLabel={`${label}: ${value.point ? `${value.point}, ${value.city}` : value.city}. Ubah`}
        icon={<PinIcon className="h-[22px] w-[22px]" />}
        label={label}
        value={value.point ?? value.city}
        detail={value.point ? value.city : `Semua titik ${verb} di ${value.city}`}
        className={className}
      />
      {open && (
        <PickerDialog
          title={kind === 'board' ? 'Pilih titik naik' : 'Pilih titik turun'}
          kind={kind}
          current={value}
          locations={locations}
          onClose={() => setOpen(false)}
          onPick={(p) => {
            onChange(p);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

interface DialogProps {
  title: string;
  kind: 'board' | 'drop';
  current: Place;
  locations: Locations | null;
  onClose: () => void;
  onPick: (p: Place) => void;
}

function PickerDialog({ title, kind, current, locations, onClose, onPick }: DialogProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const verb = kind === 'board' ? 'naik' : 'turun';
  const groups = useMemo(() => (locations ? groupPlaces(locations, kind, q, current.city) : []), [locations, kind, q, current.city]);
  const first: Place | null = groups[0] ? (groups[0].cityMatch ? { city: groups[0].city, point: null } : { city: groups[0].city, point: groups[0].points[0]?.name ?? null }) : null;

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // latar tidak ikut tergulir
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isOn = (p: Place) => p.city === current.city && p.point === current.point;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl sm:h-auto sm:max-h-[78vh] sm:rounded-[22px]"
      >
        <div className="bg-brand px-4 pb-4 pt-3 text-white">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/40 sm:hidden" aria-hidden />
          <div className="flex items-center">
            <h2 id={titleId} className="flex-1 text-lg font-extrabold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-2 hover:bg-white/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <label className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-ink">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && first) {
                  e.preventDefault();
                  onPick(first);
                }
              }}
              placeholder="Cari kota, terminal, atau agen"
              aria-label="Cari kota, terminal, atau agen"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="text-xs font-bold text-muted">Hapus</button>
            )}
          </label>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {!locations && <p className="p-6 text-center text-sm text-muted">Memuat daftar kota…</p>}
          {locations && groups.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-bold">Tidak ditemukan</p>
              <p className="mt-1 text-sm text-muted">Belum ada titik {verb} untuk “{q}”. Coba nama kota atau terminal lain.</p>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.city} className="border-b border-line last:border-0">
              <h3 className="sticky top-0 z-10 bg-[#f4f7f7] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
                {g.city}{g.city === current.city ? ' · pilihan saat ini' : ''}
              </h3>
              <ul>
                {g.cityMatch && (
                  <Option
                    on={isOn({ city: g.city, point: null })}
                    icon={<CityIcon />}
                    title={`Semua titik ${verb} di ${g.city}`}
                    subtitle={`${g.points.length} titik ${verb}`}
                    onClick={() => onPick({ city: g.city, point: null })}
                  />
                )}
                {g.points.map((p) => (
                  <Option
                    key={p.name}
                    on={isOn({ city: g.city, point: p.name })}
                    icon={<PinIcon />}
                    title={p.name}
                    subtitle={p.area !== g.city ? `${g.city} · ${p.area}` : g.city}
                    onClick={() => onPick({ city: g.city, point: p.name })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Option({ on, icon, title, subtitle, onClick }: { on: boolean; icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={on ? 'true' : undefined}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-teal-soft focus-visible:bg-teal-soft focus-visible:outline-none ${on ? 'bg-teal-soft' : ''}`}
      >
        <span className={on ? 'text-brand' : 'text-faint'}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{title}</span>
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        </span>
        {on && (
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        )}
      </button>
    </li>
  );
}

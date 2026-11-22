'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { groupPlaces, type CityGroup, type Place } from '@/lib/locations';
import type { LocationPoint, Locations } from '@/lib/types';

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
      className={`group flex w-full min-w-0 items-center gap-3.5 rounded-[18px] border px-3 py-3 text-left transition-colors duration-150 hover:border-brand/30 hover:bg-[#f7fbfb] active:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${active ? 'border-brand/40 bg-teal-soft/70' : 'border-line bg-white'} ${className}`}
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
  // Kota yang dibuka manual (kota pilihan saat ini & hasil pencarian selalu terbuka)
  const [openCities, setOpenCities] = useState<Set<string>>(() => new Set());
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
            <CityBlock
              key={g.city}
              group={g}
              kind={kind}
              current={current}
              expanded={!!q.trim() || g.city === current.city || openCities.has(g.city)}
              onToggle={() =>
                setOpenCities((s) => {
                  const next = new Set(s);
                  if (next.has(g.city)) next.delete(g.city);
                  else next.add(g.city);
                  return next;
                })
              }
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Titik bernama "Terminal ..." dikelompokkan sebagai terminal; data backend tidak punya jenis titik. */
const isTerminal = (name: string) => /^terminal\b/i.test(name.trim());

interface CityBlockProps {
  group: CityGroup;
  kind: 'board' | 'drop';
  current: Place;
  expanded: boolean;
  onToggle: () => void;
  onPick: (p: Place) => void;
}

/**
 * Satu kota dalam pemilih: judul kota, baris induk "Semua titik … di Kota", lalu titik spesifik
 * bertingkat (Terminal / Agen & titik lainnya) dengan garis pemandu. Titik dengan rute terbanyak
 * di kota itu diberi lencana "Terpopuler" (dari jumlah rute di GET /api/locations).
 */
function CityBlock({ group: g, kind, current, expanded, onToggle, onPick }: CityBlockProps) {
  const verb = kind === 'board' ? 'naik' : 'turun';
  const isCurrent = g.city === current.city;
  const isOn = (point: string | null) => isCurrent && current.point === point;
  const terminals = g.points.filter((p) => isTerminal(p.name));
  const others = g.points.filter((p) => !isTerminal(p.name));
  // Titik terpopuler di kota ini (hanya bila ada pilihan lain)
  // Titik dengan rute terbanyak; hanya bila benar-benar ada rute (titik kurasi tanpa jadwal = 0 rute)
  const busiest = g.points.length > 1 ? g.points.reduce((a, b) => (b.routes > a.routes ? b : a)) : null;
  const top = busiest && busiest.routes > 0 ? busiest : null;
  const listId = useId();

  return (
    <section className="border-b border-line px-3 py-3 last:border-0">
      <h3 className="flex items-center gap-2 px-1 pb-2">
        <span className="truncate text-[15px] font-extrabold text-ink">{g.city}</span>
        <span className="shrink-0 rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-bold text-brand">
          {g.points.length} titik {verb}
        </span>
        {isCurrent && (
          <span className="ml-auto shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">Pilihan saat ini</span>
        )}
      </h3>

      {g.cityMatch && (
        <button
          type="button"
          onClick={() => onPick({ city: g.city, point: null })}
          aria-current={isOn(null) ? 'true' : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition hover:bg-[#f3f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isOn(null) ? 'bg-teal-soft ring-1 ring-brand/30' : ''}`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-soft text-brand">
            <CityIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-ink">Semua titik {verb} di {g.city}</span>
            <span className="block truncate text-xs text-muted">
              Tampilkan semua jadwal dari {terminals.length ? `${terminals.length} terminal` : ''}
              {terminals.length && others.length ? ' & ' : ''}
              {others.length ? `${others.length} titik lain` : ''}
            </span>
          </span>
          {isOn(null) && <CheckIcon />}
        </button>
      )}

      {g.points.length > 0 && !expanded && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-controls={listId}
          className="ml-[52px] mt-1 flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold text-brand hover:bg-teal-soft"
        >
          Lihat {g.points.length} titik {verb}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {expanded && g.points.length > 0 && (
        // Garis pemandu dari baris induk ke titik-titik di bawahnya
        <div id={listId} className={`relative ml-[29px] border-l-2 border-teal-soft pl-3 ${g.cityMatch ? 'mt-1' : ''}`}>
          {terminals.length > 0 && (
            <PointGroup label="Terminal" kind={kind} points={terminals} city={g.city} top={top} isOn={isOn} onPick={onPick} terminal />
          )}
          {others.length > 0 && (
            <PointGroup label="Agen & titik lainnya" kind={kind} points={others} city={g.city} top={top} isOn={isOn} onPick={onPick} />
          )}
        </div>
      )}
    </section>
  );
}

function PointGroup({
  label,
  kind,
  points,
  city,
  top,
  isOn,
  onPick,
  terminal = false,
}: {
  label: string;
  kind: 'board' | 'drop';
  points: LocationPoint[];
  city: string;
  top: LocationPoint | null;
  isOn: (point: string | null) => boolean;
  onPick: (p: Place) => void;
  terminal?: boolean;
}) {
  return (
    <div className="pt-1">
      <p className="px-2 pb-0.5 pt-1.5 text-[11px] font-bold text-faint">{label}</p>
      <ul>
        {points.map((p) => {
          const on = isOn(p.name);
          return (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => onPick({ city, point: p.name })}
                aria-current={on ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#f3f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${on ? 'bg-teal-soft ring-1 ring-brand/30' : ''}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${on ? 'bg-brand text-white' : 'bg-[#f1f5f5] text-brand'}`}>
                  {terminal ? <TerminalIcon /> : <PinIcon className="h-[18px] w-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-ink">{p.name}</span>
                    {top?.name === p.name && (
                      <span className="shrink-0 rounded-full bg-gold px-1.5 py-px text-[10px] font-extrabold text-brand-dark">Terpopuler</span>
                    )}
                    {p.unscheduled?.includes(kind) && (
                      <span className="shrink-0 rounded-full bg-[#f1f5f5] px-1.5 py-px text-[10px] font-bold text-faint">Belum ada jadwal</span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">{p.area !== city ? `${p.area}, ${city}` : city}</span>
                </span>
                {on && <CheckIcon />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Ikon terminal: bangunan beratap dengan bus kecil. */
const TerminalIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10 12 4l9 6M5 9.5V20h14V9.5" />
    <rect x="8.5" y="12" width="7" height="5" rx="1.2" />
    <path d="M10 17v1.5M14 17v1.5" />
  </svg>
);

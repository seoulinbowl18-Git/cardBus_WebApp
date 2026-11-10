'use client';

/* eslint-disable @next/next/no-img-element -- foto dari backend (host berbeda per environment) */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Trip, TripPhoto } from '@/lib/types';

type GalleryTrip = Pick<Trip, 'poName' | 'busClass' | 'photos' | 'photosPending'>;

const CAT_LABEL: Record<string, string> = { eksterior: 'Eksterior', interior: 'Interior', kursi: 'Kursi', fasilitas: 'Fasilitas' };

/** Nama kategori untuk ditampilkan; kategori kosong = "Foto". Pengelompokan tidak peka huruf besar/kecil. */
export const catLabel = (cat?: string | null) => {
  const c = (cat ?? '').trim();
  if (!c) return 'Foto';
  return CAT_LABEL[c.toLowerCase()] ?? c.charAt(0).toUpperCase() + c.slice(1);
};

const CameraIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

/** Membuka galeri: `open(i)` + `node` (modal, dirender ke <body>). */
function useGallery(trip: GalleryTrip) {
  const [index, setIndex] = useState<number | null>(null);
  const photos = trip.photos ?? [];
  const node =
    index !== null && photos.length > 0 ? <GalleryModal trip={trip} photos={photos} initial={index} onClose={() => setIndex(null)} /> : null;
  return { open: (i: number) => setIndex(Math.min(Math.max(i, 0), photos.length - 1)), node, count: photos.length };
}

/** Tombol tanpa ikut mengklik kartu jadwal (yang berupa tautan) di bawahnya. */
function PhotoButton({ onOpen, label, className, children }: { onOpen: () => void; label: string; className: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
    >
      {children}
    </button>
  );
}

/**
 * Kisi foto di kartu jadwal (BusPhotoGrid aplikasi mobile): 1 foto besar + 2 kecil, yang terakhir "N foto".
 * Tanpa foto dan `photosPending` → kotak "Foto armada segera hadir"; tanpa keduanya → tidak tampil.
 */
export function BusPhotoGrid({ trip, className = '' }: { trip: GalleryTrip; className?: string }) {
  const g = useGallery(trip);
  const ph = trip.photos ?? [];
  if (!ph.length) {
    if (!trip.photosPending) return null;
    return (
      <div className={`flex h-[72px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#ced8d8] bg-[#f9fbfb] text-xs font-bold text-faint ${className}`}>
        <CameraIcon className="h-5 w-5" /> Foto armada segera hadir
      </div>
    );
  }
  const n = ph.length;
  const at = (i: number) => ph[Math.min(i, n - 1)].src;
  const tile = 'relative block h-full w-full overflow-hidden bg-[#dce4e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand';
  return (
    <div className={`relative z-10 grid h-[132px] grid-cols-[2fr_1fr] gap-1 ${className}`}>
      <PhotoButton onOpen={() => g.open(0)} label={`Lihat foto bus ${trip.poName}`} className={`${tile} row-span-2 rounded-xl`}>
        <img src={at(0)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
      </PhotoButton>
      <div className="grid grid-rows-2 gap-1">
        <PhotoButton onOpen={() => g.open(1)} label="Foto berikutnya" className={`${tile} rounded-[10px]`}>
          <img src={at(1)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        </PhotoButton>
        <PhotoButton onOpen={() => g.open(2)} label={`Lihat semua ${n} foto`} className={`${tile} rounded-[10px] bg-ink`}>
          <img src={at(2)} alt="" loading="lazy" className="h-full w-full object-cover opacity-45" />
          <span className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-extrabold text-white">
            <CameraIcon /> {n} foto
          </span>
        </PhotoButton>
      </div>
      {g.node}
    </div>
  );
}

/** Lencana "N foto" (di atas foto sampul) yang membuka galeri. Tanpa foto → tidak tampil. */
export function PhotoCountBadge({ trip, className = '' }: { trip: GalleryTrip; className?: string }) {
  const g = useGallery(trip);
  if (!g.count) return null;
  return (
    <>
      <PhotoButton
        onOpen={() => g.open(0)}
        label={`Lihat ${g.count} foto bus ${trip.poName}`}
        className={`inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur transition hover:bg-black/75 ${className}`}
      >
        <CameraIcon /> {g.count} foto
      </PhotoButton>
      {g.node}
    </>
  );
}

/** Galeri layar penuh (BusGalleryScreen mobile): kategori, foto besar ← →, caption, thumbnail. Esc / ← / → / geser. */
function GalleryModal({ trip, photos, initial, onClose }: { trip: GalleryTrip; photos: TripPhoto[]; initial: number; onClose: () => void }) {
  const [i, setI] = useState(initial);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = photos.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);
  const cur = photos[i];
  const curCat = catLabel(cur.cat);
  const cats: string[] = [];
  for (const p of photos) if (!cats.includes(catLabel(p.cat))) cats.push(catLabel(p.cat));

  // Kunci gulir halaman, fokus ke tombol tutup, kembalikan fokus saat ditutup
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(i - 1);
      else if (e.key === 'ArrowRight') go(i + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, onClose]);

  useEffect(() => {
    thumbs.current?.children[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [i]);

  const round = 'grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';
  const arrow = (d: -1 | 1) => (
    <button
      type="button"
      onClick={() => go(i + d)}
      aria-label={d < 0 ? 'Foto sebelumnya' : 'Foto berikutnya'}
      className={`${round} absolute top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 ${d < 0 ? 'left-2 sm:left-4' : 'right-2 sm:right-4'}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galeri foto ${trip.poName}`}
      className="fixed inset-0 z-[100] flex flex-col bg-[#141010] text-white"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pb-2 pt-3 sm:pt-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold">{trip.poName}</p>
          <p className="truncate text-xs text-[#aebbbc]">
            {trip.busClass} · Foto {i + 1} dari {n}
          </p>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup galeri" className={`${round} bg-white/10 hover:bg-white/20`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {cats.length > 1 && (
        <div className="mx-auto flex w-full max-w-5xl gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" role="tablist" aria-label="Kategori foto">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={c === curCat}
              onClick={() => go(photos.findIndex((p) => catLabel(p.cat) === c))}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${c === curCat ? 'border-white bg-white text-ink' : 'border-white/30 text-white hover:border-white/60'}`}
            >
              {c} <span className={c === curCat ? 'text-muted' : 'text-white/60'}>({photos.filter((p) => catLabel(p.cat) === c).length})</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="relative min-h-0 flex-1 bg-black"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        <img key={cur.src} src={cur.src} alt={cur.caption || `${curCat} ${trip.poName}`} className="absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
        {n > 1 && arrow(-1)}
        {n > 1 && arrow(1)}
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <span className="inline-block rounded-md bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">{curCat}</span>
        <p className="mt-1 min-h-[1.5rem] text-[15px] font-bold" aria-live="polite">{cur.caption}</p>
      </div>

      <div ref={thumbs} className="mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto px-4 pb-5 pt-2 [scrollbar-width:none]">
        {photos.map((p, j) => (
          <button
            key={`${p.src}-${j}`}
            type="button"
            onClick={() => go(j)}
            aria-label={`Foto ${j + 1}${p.caption ? `: ${p.caption}` : ''}`}
            aria-current={j === i}
            className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#21383c] transition ${j === i ? 'border-white opacity-100' : 'border-transparent opacity-55 hover:opacity-90'}`}
          >
            <img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

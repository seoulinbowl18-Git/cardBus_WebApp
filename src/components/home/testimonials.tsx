'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Testimonial } from '@/lib/testimonials';

/**
 * Seksi "Kata Penumpang": kartu ulasan asli penumpang (lihat lib/testimonials.ts), digeser dengan tombol
 * ‹ › di desktop dan geser (scroll-snap) di HP. Tidak dirender bila belum ada ulasan.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  if (!items.length) return null;
  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 16), behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="testimonials-title">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="testimonials-title" className="text-xl font-extrabold text-ink sm:text-2xl">Kata Penumpang</h2>
          <span className="mt-1.5 block h-1 w-12 rounded-full bg-brand" aria-hidden />
          <p className="mt-2 text-sm text-muted">Ulasan asli dari penumpang yang sudah berangkat bersama CardBus.</p>
        </div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <NavButton dir={-1} disabled={edge.start} onClick={() => step(-1)} />
          <NavButton dir={1} disabled={edge.end} onClick={() => step(1)} />
        </div>
      </div>

      <ul
        ref={track}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t) => (
          <li key={t.id} className="w-[84%] shrink-0 snap-start sm:w-[340px]">
            <TestimonialCard t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const initial = t.name.trim()[0]?.toUpperCase() ?? 'P';
  const route = t.trip?.from && t.trip?.to ? `${t.trip.from} → ${t.trip.to}` : null;
  return (
    <figure className="flex h-full gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-[0_6px_18px_-12px_rgba(4,46,49,0.35)]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-soft text-lg font-extrabold text-brand" aria-hidden>
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <svg viewBox="0 0 32 24" className="h-5 w-7 text-[#5fc9b8]" fill="currentColor" aria-hidden>
          <path d="M0 24V14C0 6 4.5 1.2 12 0l1.5 3.2C9 4.8 7.2 7.6 7 11h6v13Zm18 0V14c0-8 4.5-12.8 12-14l1.5 3.2C27 4.8 25.2 7.6 25 11h6v13Z" />
        </svg>
        <blockquote className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-ink">{t.comment}</blockquote>
        <figcaption className="mt-3">
          <span className="flex items-center gap-2">
            <Stars rating={t.rating} />
            <span className="truncate text-sm font-bold text-ink">{t.name}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {t.poName}
            {route ? ` · ${route}` : ''}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex shrink-0" role="img" aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i <= rating ? 'text-gold' : 'text-line'}`} fill="currentColor" aria-hidden>
          <path d="m10 1.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9Z" />
        </svg>
      ))}
    </span>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? 'Ulasan berikutnya' : 'Ulasan sebelumnya'}
      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-brand shadow-sm transition hover:bg-teal-soft disabled:cursor-not-allowed disabled:text-faint disabled:opacity-60 disabled:hover:bg-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === 1 ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
      </svg>
    </button>
  );
}

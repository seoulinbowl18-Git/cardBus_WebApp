'use client';

/* eslint-disable @next/next/no-img-element -- foto ulasan dari backend (host berbeda per environment) */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PoBadge } from '@/components/ui/po-badge';
import { ApiError } from '@/lib/api/client';
import { reviewApi } from '@/lib/api/endpoints';
import type { Review, ReviewPage, ReviewQuery, ReviewTag } from '@/lib/types';

const TAG_LABEL: Record<ReviewTag, string> = {
  staf: 'Perilaku Staf',
  nilai_uang: 'Nilai Uang',
  penjemputan: 'Waktu Penjemputan',
  ketepatan: 'Ketepatan Waktu',
  kebersihan: 'Kebersihan',
  kenyamanan: 'Kenyamanan Kursi',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** Hijau ≥ 4, oranye ≥ 3, merah di bawahnya (sama dengan badge di kartu jadwal & aplikasi mobile). */
const ratingBg = (v: number) => (v >= 4 ? 'bg-[#1f8a4c]' : v >= 3 ? 'bg-[#e08a00]' : 'bg-[#d64545]');

function Star({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7z" />
    </svg>
  );
}

function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= value ? 'text-[#f5b400]' : 'text-[#d5dcdc]'}`} />
      ))}
    </span>
  );
}

/**
 * Halaman ulasan PO: skor rata-rata, sebaran bintang, galeri foto penumpang, filter kategori / bintang / foto,
 * dan daftar ulasan bertahap. Halaman pertama dirender server; filter & "Muat lebih banyak" memanggil API langsung.
 */
export function ReviewsView({ poId, initial }: { poId: string; initial: ReviewPage }) {
  const head = initial; // ringkasan, tag & galeri tidak dipengaruhi filter
  const [filter, setFilter] = useState<ReviewQuery>({});
  const [items, setItems] = useState<Review[]>(initial.items);
  const [next, setNext] = useState<string | null>(initial.nextBefore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null);
  const firstRender = useRef(true);
  const request = useRef(0);

  const filtered = !!(filter.rating || filter.tag || filter.photos);

  const load = useCallback(
    async (q: ReviewQuery, before?: string) => {
      const req = before ? request.current : ++request.current;
      const setBusy = before ? setLoadingMore : setLoading;
      setBusy(true);
      setError(null);
      try {
        const page = await reviewApi.list(poId, { ...q, before });
        if (req !== request.current) return; // filter sudah berganti
        setItems((prev) => (before ? [...prev, ...page.items] : page.items));
        setNext(page.nextBefore);
      } catch (e) {
        if (req === request.current) setError(e instanceof ApiError && e.status === 0 ? 'Tidak ada koneksi. Coba lagi.' : 'Gagal memuat ulasan.');
      } finally {
        if (req === request.current) setBusy(false);
      }
    },
    [poId],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; // halaman pertama tanpa filter sudah dari server
      return;
    }
    load(filter);
  }, [filter, load]);

  const s = head.summary;
  const avg = s.average;
  const tags = head.tags.filter((t) => t.count > 0);

  return (
    <section className="mx-auto max-w-3xl space-y-3">
      {/* Ringkasan */}
      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <PoBadge name={head.poName} logo={head.logo} size={36} />
          <h1 className="text-lg font-extrabold sm:text-xl">Ulasan PO {head.poName}</h1>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 text-center sm:w-36">
            <p className="text-5xl font-extrabold leading-none">
              {avg == null ? '–' : avg.toFixed(1)}
              <span className="text-sm font-bold text-muted">/5</span>
            </p>
            <div className="mt-2">
              <Stars value={Math.round(avg ?? 0)} className="h-5 w-5" />
            </div>
            <p className="mt-1 text-xs text-muted">{s.total} penilaian</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = s.histogram[String(star) as '1'] ?? 0;
              const pct = s.reviewCount ? Math.round((n / s.reviewCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-bold">{star}</span>
                  <Star className="h-3.5 w-3.5 text-[#f5b400]" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#edf1f1]" role="img" aria-label={`${star} bintang: ${pct}%`}>
                    <div className={`h-full rounded-full ${ratingBg(star)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-9 text-right text-muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        {s.base && (
          <p className="mt-3 text-xs text-faint">
            Skor termasuk {s.base.count} penilaian sebelum PO ini bergabung di CardBus. Sebaran bintang dihitung dari {s.reviewCount}{' '}
            ulasan penumpang CardBus.
          </p>
        )}
      </div>

      {/* Galeri foto penumpang */}
      {head.photos.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-sm font-extrabold">Foto dari penumpang ({head.photos.length})</h2>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {head.photos.map((p, i) => (
              <button
                key={`${p.src}-${i}`}
                onClick={() => setViewer({ photos: head.photos.map((x) => x.src), index: i })}
                className="shrink-0 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-brand"
                aria-label={`Lihat foto ${i + 1}`}
              >
                <img src={p.src} alt="" loading="lazy" className="h-24 w-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="space-y-3 rounded-2xl border border-line bg-white p-4">
        {tags.length > 0 && (
          <div>
            <h2 className="text-sm font-extrabold">Paling sering disebut</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t.key} active={filter.tag === t.key} onClick={() => setFilter((f) => ({ ...f, tag: f.tag === t.key ? undefined : t.key }))}>
                  {t.label} ({t.count})
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Ulasan</h2>
            {filtered && (
              <button onClick={() => setFilter({})} className="text-xs font-bold text-brand hover:underline">
                Hapus filter
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!filtered} onClick={() => setFilter({})}>
              Semua
            </Chip>
            <Chip active={!!filter.photos} onClick={() => setFilter((f) => ({ ...f, photos: !f.photos || undefined }))}>
              Dengan foto
            </Chip>
            {[5, 4, 3, 2, 1].map((n) => (
              <Chip key={n} active={filter.rating === n} onClick={() => setFilter((f) => ({ ...f, rating: f.rating === n ? undefined : n }))}>
                <span className="inline-flex items-center gap-0.5">
                  <Star className={`h-3.5 w-3.5 ${filter.rating === n ? 'text-white' : 'text-[#f5b400]'}`} /> {n}
                </span>
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar ulasan */}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p className="py-10 text-center text-muted">Memuat ulasan…</p>
        ) : error && items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted">{error}</p>
            <button onClick={() => load(filter)} className="mt-2 font-bold text-brand hover:underline">
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white py-10 text-center text-muted">
            {filtered ? 'Belum ada ulasan untuk filter ini.' : 'Belum ada ulasan tertulis untuk PO ini.'}
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {items.map((r) => (
              <ReviewItem key={r.id} review={r} onPhoto={(i) => setViewer({ photos: r.photos, index: i })} />
            ))}
          </ul>
        )}
      </div>
      {!loading && next && (
        <div className="text-center">
          <button
            onClick={() => load(filter, next)}
            disabled={loadingMore}
            className="rounded-full border border-brand px-5 py-2 text-sm font-bold text-brand hover:bg-teal-soft disabled:opacity-60"
          >
            {loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
          </button>
          {error && items.length > 0 && <p className="mt-2 text-xs text-[#9b1c1c]">{error}</p>}
        </div>
      )}

      {viewer && <PhotoViewer {...viewer} onClose={() => setViewer(null)} onIndex={(index) => setViewer({ ...viewer, index })} />}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-[13px] font-bold transition ${
        active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'
      }`}
    >
      {children}
    </button>
  );
}

function ReviewItem({ review: r, onPhoto }: { review: Review; onPhoto: (i: number) => void }) {
  const route = r.trip?.from && r.trip?.to ? ` · ${r.trip.from} → ${r.trip.to}` : '';
  return (
    <li className="p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-soft font-extrabold text-brand-dark">
          {(r.name[0] || '?').toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{r.name}</p>
          <p className="text-xs text-faint">
            {fmtDate(r.createdAt)}
            {r.source === 'admin' && ' · Ulasan loket'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-extrabold text-white ${ratingBg(r.rating)}`}>
          {r.rating}
          <Star className="h-3 w-3" />
          <span className="sr-only"> dari 5 bintang</span>
        </span>
      </div>
      {r.trip?.busClass && (
        <p className="mt-1.5 text-xs text-muted">
          {r.trip.busClass}
          {route}
        </p>
      )}
      {r.comment && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{r.comment}</p>}
      {r.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.tags.map((t) => (
            <span key={t} className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11.5px] font-bold text-brand-dark">
              {TAG_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}
      {r.photos.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {r.photos.map((src, i) => (
            <button key={`${src}-${i}`} onClick={() => onPhoto(i)} className="overflow-hidden rounded-lg" aria-label={`Lihat foto ulasan ${i + 1}`}>
              <img src={src} alt="" loading="lazy" className="h-[72px] w-[72px] object-cover" />
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

/** Pratinjau foto layar penuh: panah kiri/kanan atau keyboard, Esc untuk menutup. */
function PhotoViewer({ photos, index, onClose, onIndex }: { photos: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndex]);

  const nav = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-2xl leading-none text-white hover:bg-white/25 disabled:opacity-30';
  return (
    <div role="dialog" aria-modal="true" aria-label="Foto ulasan" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <img src={photos[index]} alt={`Foto ${index + 1} dari ${photos.length}`} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      <button ref={closeRef} onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-white hover:bg-white/25">
        ✕
      </button>
      {photos.length > 1 && (
        <>
          <button className={`${nav} left-3`} disabled={index === 0} aria-label="Foto sebelumnya" onClick={(e) => (e.stopPropagation(), onIndex(index - 1))}>
            ‹
          </button>
          <button className={`${nav} right-3`} disabled={index === photos.length - 1} aria-label="Foto berikutnya" onClick={(e) => (e.stopPropagation(), onIndex(index + 1))}>
            ›
          </button>
          <p className="absolute bottom-4 text-sm text-white/80">
            {index + 1} / {photos.length}
          </p>
        </>
      )}
    </div>
  );
}

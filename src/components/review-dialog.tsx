'use client';

/* eslint-disable @next/next/no-img-element -- pratinjau foto lokal (object URL) */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { reviewApi } from '@/lib/api/endpoints';
import { shortDate } from '@/lib/format';
import { MAX_REVIEW_PHOTOS, prepareReviewPhoto, REVIEW_TAGS } from '@/lib/reviews';
import type { Order, ReviewTag } from '@/lib/types';

const LABELS = ['', 'Sangat buruk', 'Kurang', 'Cukup', 'Bagus', 'Luar biasa'];

interface Photo {
  id: number;
  preview: string; // object URL
  path: string | null; // hasil unggah; null = sedang / gagal diunggah
  error: string | null;
  blob: Blob | null; // untuk unggah ulang
}

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (e.status === 0 ? 'Tidak ada koneksi. Coba lagi.' : e.message) : e instanceof Error ? e.message : fallback;

/**
 * Form "Beri Ulasan" (WriteReviewScreen di aplikasi mobile): bintang 1–5, kategori, komentar opsional,
 * dan maks. 5 foto yang langsung diunggah saat dipilih. `onDone` dipanggil setelah ulasan tersimpan.
 */
export function ReviewDialog({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const firstStar = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const uploading = photos.some((p) => !p.path && !p.error);

  // Fokus awal, Esc untuk menutup, kunci scroll halaman, dan bersihkan object URL saat ditutup
  useEffect(() => {
    firstStar.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !sending && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const patch = (id: number, p: Partial<Photo>) => setPhotos((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function upload(id: number, file: File | Blob) {
    patch(id, { error: null });
    try {
      const blob = file instanceof File ? await prepareReviewPhoto(file) : file;
      patch(id, { blob });
      const { path } = await reviewApi.uploadPhoto(blob);
      patch(id, { path });
    } catch (e) {
      patch(id, { error: errMsg(e, 'Foto gagal diunggah') });
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_REVIEW_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`Maksimal ${MAX_REVIEW_PHOTOS} foto`);
    const added = picked.map((file) => ({
      file,
      photo: { id: nextId.current++, preview: URL.createObjectURL(file), path: null, error: null, blob: null } as Photo,
    }));
    setPhotos((list) => [...list, ...added.map((a) => a.photo)]);
    added.forEach((a) => upload(a.photo.id, a.file));
  }

  function removePhoto(p: Photo) {
    URL.revokeObjectURL(p.preview);
    setPhotos((list) => list.filter((x) => x.id !== p.id));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError('Pilih 1–5 bintang dulu');
      firstStar.current?.focus();
      return;
    }
    setSending(true);
    setError(null);
    try {
      await reviewApi.submit({
        bookingId: order.id,
        rating,
        comment: comment.trim(),
        tags: REVIEW_TAGS.map((t) => t.key).filter((k) => tags.includes(k)),
        photos: photos.filter((p) => p.path).map((p) => p.path!),
      });
      onDone();
    } catch (err) {
      setSending(false);
      setError(errMsg(err, 'Ulasan gagal dikirim. Coba lagi.'));
    }
  }

  const shown = hover || rating;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={() => !sending && onClose()}>
      <form
        role="dialog"
        aria-modal
        aria-labelledby="review-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl sm:rounded-[22px]"
      >
        <div className="flex items-start border-b border-line px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <h2 id="review-title" className="text-lg font-extrabold">Beri Ulasan</h2>
            <p className="truncate text-xs text-muted">
              PO {order.poName ?? '-'} · {order.busClass} · {order.from} → {order.to} · {shortDate(order.date)}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Tutup" className="rounded-full p-2 text-muted hover:bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <fieldset className="text-center">
            <legend className="mx-auto font-extrabold">Bagaimana perjalananmu?</legend>
            <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  ref={n === 1 ? firstStar : undefined}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} bintang · ${LABELS[n]}`}
                  disabled={sending}
                  onClick={() => {
                    setRating(n);
                    setError(null);
                  }}
                  onMouseEnter={() => setHover(n)}
                  className="rounded-lg p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <svg viewBox="0 0 24 24" className={`h-10 w-10 ${n <= shown ? 'text-[#f5b400]' : 'text-[#d5dcdc]'}`} fill="currentColor" aria-hidden>
                    <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="mt-1 h-5 text-sm font-bold text-muted">{LABELS[shown]}</p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-extrabold">Apa yang paling berkesan?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {REVIEW_TAGS.map((t) => {
                const on = tags.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={on}
                    disabled={sending}
                    onClick={() => setTags((x) => (on ? x.filter((k) => k !== t.key) : [...x, t.key]))}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-bold transition ${
                      on ? 'border-brand bg-teal-soft text-brand-dark' : 'border-line text-ink hover:border-brand'
                    }`}
                  >
                    {on && '✓ '}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-extrabold">Ceritakan pengalamanmu <span className="font-medium text-faint">(opsional)</span></span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              disabled={sending}
              placeholder="mis. sopir ramah, bus bersih, berangkat tepat waktu"
              className="mt-1.5 w-full resize-y rounded-xl border border-line bg-[#f6f9f9] p-3 text-sm outline-none focus:border-brand"
            />
            <span className="block text-right text-[11px] text-faint">{comment.length}/1000</span>
          </label>

          <div>
            <p className="text-sm font-extrabold">
              Foto <span className="font-medium text-faint">(opsional, maks. {MAX_REVIEW_PHOTOS})</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={p.id} className="relative h-[76px] w-[76px] overflow-hidden rounded-xl border border-line">
                  <img src={p.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {!p.path && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45 text-center">
                      {p.error ? (
                        <button
                          type="button"
                          title={p.error}
                          onClick={() => p.blob && upload(p.id, p.blob)}
                          disabled={!p.blob}
                          className="px-1 text-[11px] font-bold text-white underline disabled:no-underline"
                        >
                          {p.blob ? 'Gagal · ulang' : 'Gagal'}
                        </button>
                      ) : (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-label="Mengunggah" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    disabled={sending}
                    aria-label={`Hapus foto ${i + 1}`}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-xs leading-none text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < MAX_REVIEW_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={sending}
                  className="grid h-[76px] w-[76px] place-items-center rounded-xl border border-dashed border-brand bg-teal-soft text-brand hover:brightness-95"
                  aria-label="Tambah foto"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {photos.some((p) => p.error) && (
              <p className="mt-1.5 text-xs text-[#9b1c1c]">{photos.find((p) => p.error)?.error} Foto yang gagal tidak ikut terkirim.</p>
            )}
          </div>
        </div>

        <div className="border-t border-line p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="mb-2 text-sm font-bold text-[#9b1c1c]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || uploading}
            className="w-full rounded-xl bg-brand py-3 font-extrabold text-white hover:brightness-110 disabled:opacity-60"
          >
            {sending ? 'Mengirim…' : uploading ? 'Mengunggah foto…' : 'Kirim Ulasan'}
          </button>
          <p className="mt-2 text-center text-[11px] text-faint">
            Ulasan tampil dengan nama depan &amp; inisial nama belakangmu. Ulasan yang tidak sesuai ketentuan dapat dihapus CardBus.
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * Tombol "Beri Ulasan" untuk pesanan yang boleh diulas (lunas & perjalanan selesai), atau penanda
 * "Sudah diulas" (tautan ke halaman ulasan PO). Setelah terkirim memanggil `onReviewed` agar daftar diperbarui.
 */
export function ReviewAction({
  order,
  onReviewed,
  onToast,
  className = '',
}: {
  order: Order;
  onReviewed: () => void;
  onToast?: (msg: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (order.reviewed) {
    const label = <>✓ Sudah diulas</>;
    return order.poId ? (
      <a href={`/ulasan/${encodeURIComponent(order.poId)}`} className={`text-sm font-bold text-[#1f6a3a] hover:underline ${className}`}>
        {label}
      </a>
    ) : (
      <span className={`text-sm font-bold text-[#1f6a3a] ${className}`}>{label}</span>
    );
  }
  if (!order.canReview || order.status !== 'paid') return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-extrabold text-brand hover:bg-teal-soft ${className}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#f5b400]" fill="currentColor" aria-hidden>
          <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7z" />
        </svg>
        Beri Ulasan
      </button>
      {open && (
        <ReviewDialog
          order={order}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            onToast?.('Terima kasih! Ulasanmu sudah terkirim.');
            onReviewed();
          }}
        />
      )}
    </>
  );
}

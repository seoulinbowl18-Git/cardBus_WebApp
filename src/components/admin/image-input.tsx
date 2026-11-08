'use client';

/* eslint-disable @next/next/no-img-element -- gambar dari backend (host berbeda per environment) */
import { useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { adminApi, type StoredImage, type TripPhoto } from '@/lib/api/admin';
import { ImageError, compressImage } from '@/lib/image';
import { btnSecondary, inputCls } from './ui';

/** Kecilkan lalu unggah satu file; melempar Error dengan pesan untuk admin. */
async function uploadFile(file: File, kind: 'logo' | 'photo'): Promise<StoredImage> {
  try {
    const { path, url } = await adminApi.uploadImage(await compressImage(file, kind));
    return { path, url };
  } catch (e) {
    if (e instanceof ImageError || e instanceof ApiError) throw new Error(e.message);
    throw new Error('Gagal mengunggah gambar');
  }
}

/** Satu gambar (logo PO / foto sampul): pratinjau, unggah / ganti, hapus. */
export function ImagePicker({
  value, onChange, kind, label, hint,
}: {
  value: StoredImage | null;
  onChange: (v: StoredImage | null) => void;
  kind: 'logo' | 'photo';
  label: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadFile(file, kind));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const box = kind === 'logo' ? 'h-20 w-20 p-2' : 'h-28 w-44';
  return (
    <div className="text-sm">
      <p className="mb-1 font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-slate-50 ${box}`}>
          {value ? (
            <img src={value.url} alt={label} className={kind === 'logo' ? 'max-h-full max-w-full object-contain' : 'h-full w-full object-cover'} />
          ) : (
            <span className="text-xs text-faint">{busy ? 'Mengunggah…' : 'Belum ada'}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? 'Mengunggah…' : value ? 'Ganti' : 'Unggah'}
            </button>
            {value && !busy && (
              <button type="button" className="text-sm font-semibold text-red-700" onClick={() => onChange(null)}>Hapus</button>
            )}
          </div>
          {hint && <span className="text-xs text-faint">{hint}</span>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label={label} onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

const CATS = [
  ['eksterior', 'Eksterior'],
  ['interior', 'Interior'],
  ['kursi', 'Kursi'],
  ['fasilitas', 'Fasilitas'],
] as const;

/**
 * Galeri foto armada: tambah (bisa banyak sekaligus), ganti keterangan & kategori, urutkan,
 * jadikan sampul kartu jadwal, hapus. Urutan galeri = urutan tampil di aplikasi.
 */
export function PhotoGallery({
  photos, onChange, cover, onCover,
}: {
  photos: TripPhoto[];
  onChange: (f: (old: TripPhoto[]) => TripPhoto[]) => void;
  cover: StoredImage | null;
  onCover: (img: StoredImage) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const edit = (i: number, patch: Partial<TripPhoto>) => onChange((old) => old.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) =>
    onChange((old) => {
      const next = [...old];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  async function add(files: FileList | null) {
    const list = [...(files ?? [])];
    if (!list.length) return;
    setErrors([]);
    const failed: string[] = [];
    for (const [n, file] of list.entries()) {
      setProgress(`Mengunggah ${n + 1} dari ${list.length}…`);
      try {
        const img = await uploadFile(file, 'photo');
        onChange((old) => [...old, { src: img.path, url: img.url, cat: 'eksterior', caption: '' }]);
      } catch (e) {
        failed.push(`${file.name}: ${(e as Error).message}`);
      }
    }
    setProgress(null);
    setErrors(failed);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">{photos.length} foto · tampil berurutan di galeri aplikasi penumpang</p>
        <button type="button" className={btnSecondary} disabled={!!progress} onClick={() => input.current?.click()}>
          {progress ?? '+ Tambah foto'}
        </button>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Tambah foto armada" onChange={(e) => add(e.target.files)} />
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="mb-3 space-y-1 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-muted">Belum ada foto armada.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => {
            const isCover = Boolean(cover && p.src && cover.path === p.src);
            return (
              <li key={`${p.src ?? p.file}-${i}`} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="relative aspect-[16/10] bg-slate-100">
                  <img src={p.url} alt={p.caption || `Foto ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  {isCover && <span className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white">Sampul</span>}
                  {p.file && <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-muted">Bawaan</span>}
                </div>
                <div className="space-y-2 p-2.5">
                  <input className={inputCls} value={p.caption ?? ''} placeholder="Keterangan, mis. Kabin lantai atas" maxLength={120} onChange={(e) => edit(i, { caption: e.target.value })} aria-label={`Keterangan foto ${i + 1}`} />
                  <select className={inputCls} value={p.cat ?? ''} onChange={(e) => edit(i, { cat: e.target.value })} aria-label={`Kategori foto ${i + 1}`}>
                    <option value="">Tanpa kategori</option>
                    {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    {p.cat && !CATS.some(([v]) => v === p.cat) && <option value={p.cat}>{p.cat}</option>}
                  </select>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="text-ink disabled:text-slate-300" aria-label={`Geser foto ${i + 1} ke kiri`}>←</button>
                    <button type="button" disabled={i === photos.length - 1} onClick={() => move(i, 1)} className="text-ink disabled:text-slate-300" aria-label={`Geser foto ${i + 1} ke kanan`}>→</button>
                    {p.src && !isCover && (
                      <button type="button" className="text-brand" onClick={() => onCover({ path: p.src!, url: p.url })}>Jadikan sampul</button>
                    )}
                    <button type="button" className="ml-auto text-red-700" onClick={() => onChange((old) => old.filter((_, j) => j !== i))}>Hapus</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

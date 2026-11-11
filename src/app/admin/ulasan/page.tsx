'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ImagePicker } from '@/components/admin/image-input';
import { Card, ErrorBox, Field, PageHead, btnDanger, btnPrimary, btnSecondary, inputCls } from '@/components/admin/ui';
import { ApiError } from '@/lib/api/client';
import {
  adminApi, REVIEW_TAGS, type AdminReview, type ImportedReviewInput, type PoRating, type ReviewQuery, type ReviewTag,
  type StoredImage,
} from '@/lib/api/admin';

const PAGE = 30;
const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const tagLabel = (k: string) => REVIEW_TAGS.find((t) => t.key === k)?.label ?? k;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function Stars({ value, size = 'text-sm' }: { value: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`${value} dari 5 bintang`}>
      <span className="text-[#f5b400]">{'★'.repeat(value)}</span>
      <span className="text-slate-300">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

/** Kotak hijau rating seperti di aplikasi penumpang: ★ 4.8 */
function RatingBadge({ average }: { average: number | null }) {
  if (average == null) return <span className="text-xs text-muted">Belum ada</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#1f8a4c] px-2 py-0.5 text-sm font-extrabold text-white">
      ★ {average.toFixed(1)}
    </span>
  );
}

/**
 * Ulasan & Rating: ringkasan rating per PO (termasuk rating awal), daftar ulasan penumpang dengan
 * filter, sembunyikan / tampilkan, hapus, dan impor ulasan. Perubahan langsung tampil di aplikasi.
 */
export default function AdminReviewsPage() {
  const [ratings, setRatings] = useState<PoRating[] | null>(null);
  const [filter, setFilter] = useState<ReviewQuery>({});
  const [search, setSearch] = useState('');
  const [list, setList] = useState<{ total: number; items: AdminReview[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<AdminReview | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [editingBase, setEditingBase] = useState<PoRating | null>(null);
  const [importing, setImporting] = useState(false);

  const loadRatings = useCallback(() => {
    adminApi.reviewSummary().then(setRatings).catch((e) => setError(msg(e, 'Gagal memuat ringkasan rating')));
  }, []);
  const loadList = useCallback((offset = 0) => {
    setError(null);
    adminApi
      .reviews({ ...filter, limit: PAGE, offset })
      .then((r) => setList((prev) => (offset > 0 && prev ? { total: r.total, items: [...prev.items, ...r.items] } : r)))
      .catch((e) => setError(msg(e, 'Gagal memuat ulasan')));
  }, [filter]);
  useEffect(loadRatings, [loadRatings]);
  useEffect(() => loadList(0), [loadList]);

  const poName = (id: string) => ratings?.find((p) => p.poId === id)?.name ?? id;

  async function setStatus(r: AdminReview, status: 'published' | 'hidden') {
    setBusyId(r.id);
    setError(null);
    try {
      const updated = await adminApi.setReviewStatus(r.id, status);
      setList((l) => (l ? { ...l, items: l.items.map((x) => (x.id === r.id ? updated : x)) } : l));
      setNotice(status === 'hidden' ? `Ulasan dari ${r.name} disembunyikan dari aplikasi.` : `Ulasan dari ${r.name} ditampilkan lagi.`);
      loadRatings();
    } catch (e) {
      setError(msg(e, 'Gagal mengubah ulasan'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: AdminReview) {
    setBusyId(r.id);
    setRemoveError(null);
    try {
      await adminApi.deleteReview(r.id);
      setList((l) => (l ? { total: l.total - 1, items: l.items.filter((x) => x.id !== r.id) } : l));
      setRemoving(null);
      setNotice(`Ulasan dari ${r.name} dihapus.`);
      loadRatings();
    } catch (e) {
      setRemoveError(msg(e, 'Gagal menghapus ulasan'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHead
        title="Ulasan & Rating"
        sub="Rating bintang dan ulasan penumpang per PO. Ulasan yang disembunyikan atau dihapus langsung hilang dari aplikasi dan rata-ratanya dihitung ulang."
        action={<button className={btnPrimary} onClick={() => setImporting(true)}>+ Impor ulasan</button>}
      />
      {error && <div className="mb-3"><ErrorBox message={error} onRetry={() => { loadRatings(); loadList(0); }} /></div>}
      {notice && <p role="status" className="mb-3 rounded-lg bg-[#e5f4ea] p-3 text-sm font-semibold text-[#1f6a3a]">{notice}</p>}

      {importing && ratings && (
        <ImportForm
          partners={ratings}
          onCancel={() => setImporting(false)}
          onSaved={(r) => {
            setImporting(false);
            setNotice(`Ulasan impor untuk ${poName(r.poId)} ditambahkan.`);
            loadRatings();
            loadList(0);
          }}
        />
      )}
      {editingBase && (
        <BaseRatingForm
          po={editingBase}
          onCancel={() => setEditingBase(null)}
          onSaved={(name) => {
            setEditingBase(null);
            setNotice(`Rating awal ${name} disimpan.`);
            loadRatings();
          }}
        />
      )}

      {/* Ringkasan per PO */}
      <Card className="mb-5 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5">PO</th>
              <th className="px-4 py-2.5">Rating di aplikasi</th>
              <th className="px-4 py-2.5">Ulasan penumpang</th>
              <th className="px-4 py-2.5">Rating awal</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {!ratings && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Memuat…</td></tr>}
            {ratings?.map((p) => (
              <tr key={p.poId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-bold text-ink">{p.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RatingBadge average={p.summary.average} />
                    <span className="text-xs text-muted">{p.summary.total} penilaian</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.summary.reviewCount} tayang{p.hiddenCount > 0 && ` · ${p.hiddenCount} disembunyikan`}
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.summary.base ? `★ ${p.summary.base.average.toFixed(1)} × ${p.summary.base.count}` : '—'}
                  {p.summary.base?.note && <span className="block text-xs">{p.summary.base.note}</span>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="mr-3 text-sm font-semibold text-brand hover:underline" onClick={() => setFilter((f) => ({ ...f, poId: p.poId }))}>
                    Lihat ulasan
                  </button>
                  <button className="text-sm font-semibold text-brand hover:underline" onClick={() => setEditingBase(p)}>Atur rating awal</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Filter */}
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter((f) => ({ ...f, q: search.trim() || undefined }));
        }}
      >
        <Field label="PO" className="w-48">
          <select className={inputCls} value={filter.poId ?? ''} onChange={(e) => setFilter((f) => ({ ...f, poId: e.target.value || undefined }))}>
            <option value="">Semua PO</option>
            {ratings?.map((p) => <option key={p.poId} value={p.poId}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Status" className="w-40">
          <select
            className={inputCls}
            value={filter.status ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, status: (e.target.value || undefined) as ReviewQuery['status'] }))}
          >
            <option value="">Semua</option>
            <option value="published">Tayang</option>
            <option value="hidden">Disembunyikan</option>
          </select>
        </Field>
        <Field label="Bintang" className="w-32">
          <select className={inputCls} value={filter.rating ?? ''} onChange={(e) => setFilter((f) => ({ ...f, rating: e.target.value ? Number(e.target.value) : undefined }))}>
            <option value="">Semua</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
        </Field>
        <Field label="Cari nama / isi ulasan" className="min-w-[200px] flex-1">
          <input className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="mis. sopir, AC, terlambat" />
        </Field>
        <button className={btnSecondary} type="submit">Cari</button>
      </form>

      {/* Daftar ulasan */}
      {list && <p className="mb-2 text-sm text-muted">{list.total} ulasan</p>}
      <div className="flex flex-col gap-3">
        {!list && !error && <p className="py-8 text-center text-muted">Memuat ulasan…</p>}
        {list?.items.length === 0 && <Card><p className="py-6 text-center text-muted">Belum ada ulasan yang cocok.</p></Card>}
        {list?.items.map((r) => (
          <Card key={r.id} className={r.status === 'hidden' ? 'opacity-70' : ''}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} size="text-base" />
                  <span className="font-bold text-ink">{r.name}</span>
                  {r.source === 'admin' && <span className="rounded bg-[#eef1f1] px-1.5 py-0.5 text-[11px] font-bold text-muted">IMPOR ADMIN</span>}
                  {r.status === 'hidden' && <span className="rounded bg-[#fbe9e9] px-1.5 py-0.5 text-[11px] font-bold text-[#9b1c1c]">DISEMBUNYIKAN</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {poName(r.poId)}
                  {r.trip && ` · ${r.trip.busClass}`}
                  {r.trip?.from && r.trip.to && ` · ${r.trip.from} → ${r.trip.to}`}
                  {' · '}{fmtDate(r.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                {r.status === 'published' ? (
                  <button className={btnSecondary} disabled={busyId === r.id} onClick={() => setStatus(r, 'hidden')}>Sembunyikan</button>
                ) : (
                  <button className={btnSecondary} disabled={busyId === r.id} onClick={() => setStatus(r, 'published')}>Tampilkan</button>
                )}
                <button className={btnDanger} disabled={busyId === r.id} onClick={() => { setRemoveError(null); setRemoving(r); }}>Hapus</button>
              </div>
            </div>
            {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-ink">{r.comment}</p>}
            {r.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.tags.map((t) => <span key={t} className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{tagLabel(t)}</span>)}
              </div>
            )}
            {r.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ulasan dari ${r.name}`} className="h-20 w-20 rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Card>
        ))}
        {list && list.items.length < list.total && (
          <button className={`${btnSecondary} self-center`} onClick={() => loadList(list.items.length)}>Muat lebih banyak</button>
        )}
      </div>

      {removing && (
        <ConfirmDialog
          title="Hapus ulasan?"
          confirmLabel="Hapus ulasan"
          busy={busyId === removing.id}
          error={removeError}
          onConfirm={() => remove(removing)}
          onCancel={() => setRemoving(null)}
        >
          Ulasan {removing.rating}★ dari <b>{removing.name}</b> untuk {poName(removing.poId)} dihapus permanen dan rata-rata rating dihitung ulang.
          Pilih <b>Sembunyikan</b> bila ingin menyimpannya.
        </ConfirmDialog>
      )}
    </>
  );
}

/** Rating awal PO (mis. dari platform lama / survei). Digabung ke rata-rata & total di aplikasi. */
function BaseRatingForm({ po, onCancel, onSaved }: { po: PoRating; onCancel: () => void; onSaved: (name: string) => void }) {
  const [average, setAverage] = useState(po.summary.base ? String(po.summary.base.average) : '');
  const [count, setCount] = useState(po.summary.base ? String(po.summary.base.count) : '');
  const [note, setNote] = useState(po.summary.base?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(clear: boolean) {
    setBusy(true);
    setError(null);
    try {
      const avg = clear ? null : Number(average.replace(',', '.'));
      if (avg !== null && !(avg >= 1 && avg <= 5)) throw new Error('Rating awal harus 1,0 – 5,0');
      const n = clear ? 0 : Math.round(Number(count));
      if (avg !== null && !(n >= 1)) throw new Error('Isi jumlah penilaian (minimal 1)');
      await adminApi.setBaseRating(po.poId, { baseAverage: avg, baseCount: n, note: clear ? null : note.trim() || null });
      onSaved(po.name);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-5">
      <h2 className="text-base font-extrabold text-ink">Rating awal · {po.name}</h2>
      <p className="mt-1 text-sm text-muted">
        Untuk rating yang sudah dimiliki PO sebelum memakai CardBus (mis. dari platform lain atau survei loket). Digabung dengan ulasan
        penumpang: rata-rata di aplikasi = (rating awal × jumlah + jumlah bintang ulasan) ÷ total. Catat sumbernya agar bisa
        dipertanggungjawabkan.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Rata-rata (1,0 – 5,0)"><input className={inputCls} inputMode="decimal" value={average} onChange={(e) => setAverage(e.target.value)} placeholder="4,8" /></Field>
        <Field label="Jumlah penilaian"><input className={inputCls} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder="86" /></Field>
        <Field label="Sumber / catatan"><input className={inputCls} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="mis. rating platform lama per Okt 2026" /></Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={btnPrimary} disabled={busy} onClick={() => save(false)}>Simpan</button>
        {po.summary.base && <button className={btnDanger} disabled={busy} onClick={() => save(true)}>Hapus rating awal</button>}
        <button className={btnSecondary} disabled={busy} onClick={onCancel}>Batal</button>
      </div>
    </Card>
  );
}

/** Impor ulasan yang sudah ada (mis. survei loket / kotak saran). Ditandai "Impor admin" di panel. */
function ImportForm({ partners, onCancel, onSaved }: { partners: PoRating[]; onCancel: () => void; onSaved: (r: AdminReview) => void }) {
  const [form, setForm] = useState<ImportedReviewInput>({ poId: partners[0]?.poId ?? '', authorName: '', rating: 5, comment: '', tags: [], photos: [] });
  const [photo, setPhoto] = useState<StoredImage | null>(null);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggleTag = (t: ReviewTag) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSaved(await adminApi.importReview({
        ...form,
        photos: photo ? [photo.path] : [],
        ...(date && { createdAt: new Date(`${date}T12:00:00+07:00`).toISOString() }),
      }));
    } catch (err) {
      setError(msg(err, 'Gagal menyimpan ulasan'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-5">
      <form onSubmit={submit}>
        <h2 className="text-base font-extrabold text-ink">Impor ulasan</h2>
        <p className="mt-1 text-sm text-muted">
          Untuk ulasan asli yang diterima di luar aplikasi (survei loket, kotak saran, WhatsApp CS). Ulasan ini ditandai &quot;Impor admin&quot;
          di panel dan ikut dihitung di rating PO.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="PO">
            <select className={inputCls} value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })}>
              {partners.map((p) => <option key={p.poId} value={p.poId}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Nama pemberi ulasan">
            <input className={inputCls} required maxLength={60} value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
          </Field>
          <Field label="Rating">
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === n}
                  aria-label={`${n} bintang`}
                  onClick={() => setForm({ ...form, rating: n })}
                  className={`text-2xl leading-none ${n <= form.rating ? 'text-[#f5b400]' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tanggal ulasan" hint="Kosong = hari ini">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Isi ulasan" className="mt-3">
          <textarea className={`${inputCls} min-h-24`} maxLength={1000} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </Field>
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-semibold text-ink">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={form.tags.includes(t.key)}
                onClick={() => toggleTag(t.key)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${form.tags.includes(t.key) ? 'border-brand bg-teal-soft text-brand-dark' : 'border-slate-300 text-muted'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <ImagePicker value={photo} onChange={setPhoto} kind="photo" label="Foto (opsional)" />
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button className={btnPrimary} disabled={busy || !form.poId} type="submit">Simpan ulasan</button>
          <button className={btnSecondary} disabled={busy} type="button" onClick={onCancel}>Batal</button>
        </div>
      </form>
    </Card>
  );
}

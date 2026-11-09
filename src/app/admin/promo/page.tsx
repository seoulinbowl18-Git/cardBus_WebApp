'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ImagePicker } from '@/components/admin/image-input';
import { Card, ErrorBox, Field, PageHead, btnPrimary, btnSecondary, inputCls } from '@/components/admin/ui';
import { PromoBanner } from '@/components/home/home-sections';
import { ApiError } from '@/lib/api/client';
import { locationApi } from '@/lib/api/endpoints';
import { adminApi, type AdminBanner, type BannerInput, type StoredImage } from '@/lib/api/admin';

const PLACES = [
  ['top', 'Promo & Info', 'Carousel di atas beranda'],
  ['special', 'Promo spesial', 'Deretan banner di bawah Produk unggulan'],
] as const;
const TAGS = ['PROMO', 'DISKON', 'RUTE BARU', 'MITRA PO', 'KELAS BARU', 'INFO'];
type Action = 'route' | 'url' | 'none';

const EMPTY: BannerInput = {
  placement: 'top', tag: 'PROMO', title: '', subtitle: null, ctaLabel: 'Cek Sekarang', link: null, active: true,
};

const routeLink = (from: string, to: string) => `/cari?${new URLSearchParams({ from: from.trim(), to: to.trim() })}`;
const actionText = (b: AdminBanner) =>
  b.from && b.to ? `Cari rute ${b.from} → ${b.to}` : b.link ? `Buka ${b.link}` : 'Info saja (tanpa tautan)';

/**
 * Promo & Info: banner beranda web & aplikasi mobile (tabel banners). Perubahan langsung tampil tanpa
 * build ulang aplikasi.
 */
export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminBanner[] | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminBanner | 'top' | 'special' | null>(null);
  const [removing, setRemoving] = useState<AdminBanner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi
      .banners()
      .then(setBanners)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat banner'));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    locationApi.list().then((l) => setCities(l.cities.map((c) => c.name))).catch(() => {});
  }, []);

  async function toggle(b: AdminBanner) {
    setBusyId(b.id);
    setError(null);
    try {
      const updated = await adminApi.updateBanner(b.id, { ...inputOf(b), active: !b.active });
      setBanners((list) => list?.map((x) => (x.id === b.id ? updated : x)) ?? null);
      setNotice(`"${b.title}" ${updated.active ? 'ditampilkan di' : 'disembunyikan dari'} beranda.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengubah banner');
    } finally {
      setBusyId(null);
    }
  }

  /** Geser satu banner di dalam tempatnya; urutan semua banner dikirim sekaligus. */
  async function move(group: AdminBanner[], i: number, d: -1 | 1) {
    if (!banners) return;
    const moved = [...group];
    [moved[i], moved[i + d]] = [moved[i + d], moved[i]];
    const next = PLACES.flatMap(([p]) => (p === group[0].placement ? moved : banners.filter((b) => b.placement === p)));
    setBanners(next);
    try {
      setBanners(await adminApi.orderBanners(next.map((b) => b.id)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal menyimpan urutan');
      load();
    }
  }

  async function remove(b: AdminBanner) {
    setBusyId(b.id);
    setRemoveError(null);
    try {
      await adminApi.deleteBanner(b.id);
      setBanners((list) => list?.filter((x) => x.id !== b.id) ?? null);
      setRemoving(null);
      setNotice(`Banner "${b.title}" dihapus.`);
    } catch (e) {
      setRemoveError(e instanceof ApiError ? e.message : 'Gagal menghapus');
    } finally {
      setBusyId(null);
    }
  }

  const shown = banners?.filter((b) => b.active).length ?? 0;

  return (
    <>
      <PageHead
        title="Promo & Info"
        sub={`Banner beranda web & aplikasi mobile. ${shown} banner sedang tampil · perubahan muncul paling lama 1 menit, tanpa update aplikasi.`}
        action={<button className={btnPrimary} onClick={() => setEditing('top')}>+ Banner baru</button>}
      />
      {error && <div className="mb-3"><ErrorBox message={error} onRetry={load} /></div>}
      {notice && <p role="status" className="mb-3 rounded-lg bg-[#e5f4ea] p-3 text-sm font-semibold text-[#1f6a3a]">{notice}</p>}
      {editing && (
        <BannerForm
          key={typeof editing === 'string' ? editing : editing.id}
          banner={typeof editing === 'string' ? null : editing}
          placement={typeof editing === 'string' ? editing : editing.placement}
          cities={cities}
          onCancel={() => setEditing(null)}
          onSaved={(b, isNew) => {
            setEditing(null);
            setNotice(`Banner "${b.title}" ${isNew ? 'ditambahkan' : 'disimpan'}.`);
            load();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Hapus banner?"
          confirmLabel="Hapus banner"
          busy={busyId === removing.id}
          error={removeError}
          onConfirm={() => remove(removing)}
          onCancel={() => {
            setRemoving(null);
            setRemoveError(null);
          }}
        >
          <p>
            Banner <b className="text-ink">{removing.title}</b>
            {removing.active ? ' langsung hilang dari beranda web & aplikasi dan' : ''} dihapus permanen.
          </p>
          <p>Kalau hanya ingin menyembunyikan sementara, pakai <b>Nonaktifkan</b>.</p>
        </ConfirmDialog>
      )}
      {!banners && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {banners && (
        <div className="space-y-8">
          {PLACES.map(([place, label, hint]) => {
            const group = banners.filter((b) => b.placement === place);
            return (
              <section key={place}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold">{label} <span className="text-sm font-semibold text-muted">({group.filter((b) => b.active).length} tampil)</span></h2>
                    <p className="text-sm text-muted">{hint}</p>
                  </div>
                  <button className={btnSecondary} onClick={() => setEditing(place)}>+ Banner di sini</button>
                </div>
                {group.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-sm text-muted">
                    Belum ada banner. Bagian &quot;{label}&quot; tidak tampil di beranda sampai ada banner aktif.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {group.map((b, i) => (
                      <li key={b.id}>
                        <Card className={`flex flex-wrap items-center gap-4 ${b.active ? '' : 'opacity-70'}`}>
                          <div className="flex flex-col gap-1 text-xs font-bold">
                            <button disabled={i === 0} onClick={() => move(group, i, -1)} className="rounded border border-line px-2 py-0.5 disabled:opacity-30" aria-label={`Naikkan banner ${b.title}`}>↑</button>
                            <button disabled={i === group.length - 1} onClick={() => move(group, i, 1)} className="rounded border border-line px-2 py-0.5 disabled:opacity-30" aria-label={`Turunkan banner ${b.title}`}>↓</button>
                          </div>
                          <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-[#0f857d]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari backend */}
                            {b.imageUrl && <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-ink">{b.tag}</span>
                              <b className="truncate">{b.title}</b>
                              {!b.active && <span className="rounded-full bg-[#eef1f1] px-2 py-0.5 text-[11px] font-extrabold text-muted">Nonaktif</span>}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted">{b.subtitle || '—'}</p>
                            <p className="truncate text-xs text-faint">Tombol &quot;{b.ctaLabel}&quot; · {actionText(b)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                            <button onClick={() => toggle(b)} disabled={busyId === b.id} className="text-brand hover:underline disabled:opacity-50">
                              {b.active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button onClick={() => setEditing(b)} className="text-ink hover:underline">Ubah</button>
                            <button onClick={() => setRemoving(b)} className="text-red-700 hover:underline">Hapus</button>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Data banner → isian simpan. Gambar tidak dikirim (tetap) kecuali diganti di form. */
const inputOf = (b: AdminBanner): BannerInput => ({
  placement: b.placement, tag: b.tag, title: b.title, subtitle: b.subtitle || null, ctaLabel: b.ctaLabel, link: b.link, active: b.active,
});

function BannerForm({ banner, placement, cities, onCancel, onSaved }: {
  banner: AdminBanner | null;
  placement: 'top' | 'special';
  cities: string[];
  onCancel: () => void;
  onSaved: (b: AdminBanner, isNew: boolean) => void;
}) {
  const [f, setF] = useState<BannerInput>(banner ? inputOf(banner) : { ...EMPTY, placement });
  const [image, setImage] = useState<StoredImage | null>(banner?.image && banner.imageUrl ? { path: banner.image, url: banner.imageUrl } : null);
  const [imageChanged, setImageChanged] = useState(false);
  const [action, setAction] = useState<Action>(banner?.from && banner.to ? 'route' : banner?.link ? 'url' : banner ? 'none' : 'route');
  const [from, setFrom] = useState(banner?.from ?? '');
  const [to, setTo] = useState(banner?.to ?? '');
  const [url, setUrl] = useState(banner?.link && !banner.from ? banner.link : '');
  const [customTag, setCustomTag] = useState(banner ? !TAGS.includes(banner.tag) : false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const link = action === 'route' ? (from.trim() && to.trim() ? routeLink(from, to) : null) : action === 'url' ? url.trim() || null : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (action === 'route' && !link) return setError('Isi kota asal dan tujuan untuk tombol cari rute.');
    if (action === 'url' && !/^https:\/\/\S+$/.test(url.trim())) return setError('Tautan harus diawali https://');
    setBusy(true);
    setError(null);
    const body: BannerInput = { ...f, subtitle: f.subtitle?.trim() || null, link, ...(imageChanged && { image: image?.path ?? null }) };
    try {
      const saved = banner ? await adminApi.updateBanner(banner.id, body) : await adminApi.createBanner({ ...body, image: image?.path ?? null });
      onSaved(saved, !banner);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  const preview = {
    image: image?.url, tag: f.tag || 'LABEL', title: f.title || 'Judul banner', subtitle: f.subtitle || '', ctaLabel: f.ctaLabel || 'Cek',
  };

  return (
    <Card className="mb-6 border-brand">
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{banner ? `Ubah banner "${banner.title}"` : 'Banner baru'}</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Tempat di beranda</legend>
            <div className="flex flex-wrap gap-2 text-sm">
              {PLACES.map(([p, label, hint]) => (
                <label key={p} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${f.placement === p ? 'border-brand bg-teal-soft' : 'border-slate-300'}`}>
                  <input type="radio" name="placement" className="mt-1" checked={f.placement === p} onChange={() => set('placement', p)} />
                  <span className="font-medium">{label}<span className="block text-xs font-normal text-faint">{hint}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <ImagePicker
            kind="photo"
            label="Gambar banner"
            hint="Dikecilkan otomatis jadi WebP. Bagian kanan gambar paling terlihat (kiri tertutup teks)."
            value={image}
            onChange={(v) => {
              setImage(v);
              setImageChanged(true);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Judul" className="sm:col-span-2">
              <input className={inputCls} value={f.title} required maxLength={80} placeholder="Solo → Bogor makin hoki" onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Keterangan (opsional)" className="sm:col-span-2" hint="Satu baris, mis. harga atau kode promo">
              <input className={inputCls} value={f.subtitle ?? ''} maxLength={120} placeholder="Rp 230.000 (normal Rp 260.000) · S&K berlaku" onChange={(e) => set('subtitle', e.target.value)} />
            </Field>
            <Field label="Teks tombol">
              <input className={inputCls} value={f.ctaLabel} required maxLength={24} onChange={(e) => set('ctaLabel', e.target.value)} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Label badge</legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={!customTag && f.tag === t}
                  onClick={() => {
                    setCustomTag(false);
                    set('tag', t);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold ${!customTag && f.tag === t ? 'border-brand bg-teal-soft text-brand-dark' : 'border-slate-300 text-muted'}`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={customTag}
                onClick={() => setCustomTag(true)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold ${customTag ? 'border-brand bg-teal-soft text-brand-dark' : 'border-slate-300 text-muted'}`}
              >
                Lainnya…
              </button>
              {customTag && (
                <input
                  className={`${inputCls} w-48 uppercase`}
                  value={f.tag}
                  maxLength={30}
                  required
                  placeholder="MIS. PROMO PO RAYA"
                  aria-label="Label badge sendiri"
                  onChange={(e) => set('tag', e.target.value.toUpperCase())}
                />
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Saat banner diketuk</legend>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              {([['route', 'Cari rute'], ['url', 'Buka tautan'], ['none', 'Info saja']] as const).map(([a, label]) => (
                <label key={a} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 ${action === a ? 'border-brand bg-teal-soft' : 'border-slate-300'}`}>
                  <input type="radio" name="action" checked={action === a} onChange={() => setAction(a)} />
                  {label}
                </label>
              ))}
            </div>
            {action === 'route' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Kota asal">
                  <input className={inputCls} value={from} list="kota-cardbus" placeholder="Solo" onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label="Kota tujuan">
                  <input className={inputCls} value={to} list="kota-cardbus" placeholder="Bogor" onChange={(e) => setTo(e.target.value)} />
                </Field>
                <datalist id="kota-cardbus">{cities.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
            )}
            {action === 'url' && (
              <Field label="Alamat tautan" hint="Dibuka di browser, mis. halaman S&K promo">
                <input className={inputCls} type="url" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
              </Field>
            )}
            {action === 'none' && <p className="text-xs text-faint">Ketukan hanya menampilkan keterangan banner.</p>}
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
            Tampil di beranda web & aplikasi
          </label>
          {error && <ErrorBox message={error} />}
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy}>{busy ? 'Menyimpan…' : banner ? 'Simpan' : 'Tambah banner'}</button>
            <button type="button" className={btnSecondary} onClick={onCancel}>Batal</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Pratinjau</p>
          <PromoBanner promo={preview} onSoon={() => {}} tall={f.placement === 'top'} preview />
        </div>
      </form>
    </Card>
  );
}

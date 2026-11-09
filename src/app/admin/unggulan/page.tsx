'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ImagePicker } from '@/components/admin/image-input';
import { Card, ErrorBox, Field, PageHead, btnPrimary, btnSecondary, inputCls } from '@/components/admin/ui';
import { FeaturedGrid } from '@/components/home/home-sections';
import { ApiError } from '@/lib/api/client';
import { locationApi } from '@/lib/api/endpoints';
import { adminApi, type FeaturedCard, type FeaturedInput, type Partner, type StoredImage } from '@/lib/api/admin';
import { formatRupiah } from '@/lib/format';

const TAGS = ['BARU', 'TERLARIS', 'DISKON', 'PROMO', 'FAVORIT', 'SLEEPER'];

const EMPTY: FeaturedInput = {
  poId: '', busClass: '', from: '', to: '', boardPoint: null, price: null, oldPrice: null, tag: 'BARU', comingSoon: false, active: true,
};

/** Produk Unggulan: kartu rute favorit di beranda web (tabel featured_products), dikelola tanpa mengubah kode. */
export default function AdminFeaturedPage() {
  const [cards, setCards] = useState<FeaturedCard[] | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeaturedCard | 'baru' | null>(null);
  const [removing, setRemoving] = useState<FeaturedCard | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi
      .featured()
      .then(setCards)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat produk unggulan'));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    adminApi.partners().then(setPartners).catch(() => {});
    locationApi.list().then((l) => setCities(l.cities.map((c) => c.name))).catch(() => {});
  }, []);

  const shown = cards?.filter((c) => c.active && c.poActive).length ?? 0;

  /** Ubah satu kartu tanpa membuka form (aktif / nonaktif), dengan data lengkap kartu itu. */
  async function toggle(c: FeaturedCard) {
    setBusyId(c.id);
    setError(null);
    try {
      const updated = await adminApi.updateFeatured(c.id, { ...inputOf(c), active: !c.active });
      setCards((list) => list?.map((x) => (x.id === c.id ? updated : x)) ?? null);
      setNotice(`${c.poName} ${c.from} → ${c.to} ${updated.active ? 'ditampilkan di' : 'disembunyikan dari'} beranda.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengubah kartu');
    } finally {
      setBusyId(null);
    }
  }

  async function move(i: number, d: -1 | 1) {
    if (!cards) return;
    const next = [...cards];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setCards(next);
    try {
      setCards(await adminApi.orderFeatured(next.map((c) => c.id)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal menyimpan urutan');
      load();
    }
  }

  async function remove(c: FeaturedCard) {
    setBusyId(c.id);
    setRemoveError(null);
    try {
      await adminApi.deleteFeatured(c.id);
      setCards((list) => list?.filter((x) => x.id !== c.id) ?? null);
      setRemoving(null);
      setNotice(`Kartu ${c.poName} ${c.from} → ${c.to} dihapus dari beranda.`);
    } catch (e) {
      setRemoveError(e instanceof ApiError ? e.message : 'Gagal menghapus');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHead
        title="Produk Unggulan"
        sub={`Kartu rute favorit di beranda. ${shown} kartu sedang tampil · perubahan muncul di beranda paling lama 1 menit.`}
        action={<button className={btnPrimary} onClick={() => setEditing('baru')}>+ Kartu baru</button>}
      />
      {error && <div className="mb-3"><ErrorBox message={error} onRetry={load} /></div>}
      {notice && <p role="status" className="mb-3 rounded-lg bg-[#e5f4ea] p-3 text-sm font-semibold text-[#1f6a3a]">{notice}</p>}
      {editing && (
        <FeaturedForm
          key={editing === 'baru' ? 'baru' : editing.id}
          card={editing === 'baru' ? null : editing}
          partners={partners}
          cities={cities}
          onCancel={() => setEditing(null)}
          onSaved={(c, isNew) => {
            setEditing(null);
            setNotice(`Kartu ${c.poName} ${c.from} → ${c.to} ${isNew ? 'ditambahkan' : 'disimpan'}.`);
            load();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Hapus kartu unggulan?"
          confirmLabel="Hapus kartu"
          busy={busyId === removing.id}
          error={removeError}
          onConfirm={() => remove(removing)}
          onCancel={() => {
            setRemoving(null);
            setRemoveError(null);
          }}
        >
          <p>
            Kartu <b className="text-ink">{removing.poName} · {removing.from} → {removing.to}</b>
            {removing.active ? ' langsung hilang dari beranda dan' : ''} dihapus permanen.
          </p>
          <p>Jadwal & pesanan PO tidak terpengaruh. Kalau hanya ingin menyembunyikan sementara, pakai <b>Nonaktifkan</b>.</p>
        </ConfirmDialog>
      )}
      {!cards && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {cards && cards.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-muted">
          Belum ada kartu. Bagian &quot;Produk unggulan&quot; tidak tampil di beranda sampai ada kartu aktif.
        </p>
      )}
      {cards && cards.length > 0 && (
        <ul className="space-y-3">
          {cards.map((c, i) => (
            <li key={c.id}>
              <Card className={`flex flex-wrap items-center gap-4 ${c.active && c.poActive ? '' : 'opacity-70'}`}>
                <div className="flex flex-col gap-1 text-xs font-bold">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded border border-line px-2 py-0.5 disabled:opacity-30" aria-label={`Naikkan kartu ${i + 1}`}>↑</button>
                  <button disabled={i === cards.length - 1} onClick={() => move(i, 1)} className="rounded border border-line px-2 py-0.5 disabled:opacity-30" aria-label={`Turunkan kartu ${i + 1}`}>↓</button>
                </div>
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#dce4e4]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- foto dari backend */}
                  {c.imageUrl && <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-ink">{c.tag}</span>
                    <b className="truncate">{c.poName} · {c.from} → {c.to}</b>
                    {!c.active && <span className="rounded-full bg-[#eef1f1] px-2 py-0.5 text-[11px] font-extrabold text-muted">Nonaktif</span>}
                    {c.active && !c.poActive && <span className="rounded-full bg-[#fbe9e9] px-2 py-0.5 text-[11px] font-extrabold text-[#9b1c1c]">PO nonaktif: tidak tampil</span>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {c.busClass}
                    {c.boardPoint ? ` · naik di ${c.boardPoint}` : ''}
                    {' · '}
                    {c.comingSoon ? 'Segera hadir' : c.price ? `mulai ${formatRupiah(c.price)}` : 'tanpa harga'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <button onClick={() => toggle(c)} disabled={busyId === c.id} className="text-brand hover:underline disabled:opacity-50">
                    {c.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => setEditing(c)} className="text-ink hover:underline">Ubah</button>
                  <button onClick={() => setRemoving(c)} className="text-red-700 hover:underline">Hapus</button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Data kartu → isian simpan. Foto tidak dikirim (tetap) kecuali diganti di form. */
const inputOf = (c: FeaturedCard): FeaturedInput => ({
  poId: c.poId, busClass: c.busClass, from: c.from, to: c.to, boardPoint: c.boardPoint, price: c.price, oldPrice: c.oldPrice,
  tag: c.tag, comingSoon: c.comingSoon, active: c.active,
});

const toNumber = (v: string) => {
  const n = Number(v.replace(/\D/g, ''));
  return v.trim() && Number.isFinite(n) ? n : null;
};

function FeaturedForm({ card, partners, cities, onCancel, onSaved }: {
  card: FeaturedCard | null;
  partners: Partner[];
  cities: string[];
  onCancel: () => void;
  onSaved: (c: FeaturedCard, isNew: boolean) => void;
}) {
  const [f, setF] = useState<FeaturedInput>(card ? inputOf(card) : EMPTY);
  const [image, setImage] = useState<StoredImage | null>(card?.image && card.imageUrl ? { path: card.image, url: card.imageUrl } : null);
  const [imageChanged, setImageChanged] = useState(false);
  const [customTag, setCustomTag] = useState(card ? !TAGS.includes(card.tag) : false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FeaturedInput>(k: K, v: FeaturedInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const choices = partners.filter((p) => p.active || p.id === f.poId);
  const po = partners.find((p) => p.id === f.poId);
  // Pratinjau memakai komponen kartu beranda yang sama
  const preview = useMemo(
    () => ({
      id: 'pratinjau', poName: po?.short ?? 'PO', logo: po?.logo, image: image?.url, busClass: f.busClass || 'Kelas bus',
      from: f.from || 'Asal', to: f.to || 'Tujuan', boardPoint: f.boardPoint, price: f.price, oldPrice: f.oldPrice,
      tag: f.tag || 'LABEL', comingSoon: f.comingSoon,
    }),
    [po, image, f],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: FeaturedInput = { ...f, boardPoint: f.boardPoint?.trim() || null, ...(imageChanged && { image: image?.path ?? null }) };
    try {
      const saved = card ? await adminApi.updateFeatured(card.id, body) : await adminApi.createFeatured({ ...body, image: image?.path ?? null });
      onSaved(saved, !card);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4 border-brand">
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{card ? `Ubah kartu ${card.poName} ${card.from} → ${card.to}` : 'Kartu unggulan baru'}</h2>
          <ImagePicker
            kind="photo"
            label="Foto / banner bus"
            hint="Dikecilkan otomatis jadi WebP. Tampil 4:3 di beranda."
            value={image}
            onChange={(v) => {
              setImage(v);
              setImageChanged(true);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="PO mitra" hint="Nama & logo diambil dari data Mitra PO">
              <select className={inputCls} value={f.poId} required onChange={(e) => set('poId', e.target.value)}>
                <option value="">Pilih PO</option>
                {choices.map((p) => <option key={p.id} value={p.id}>{p.name}{p.active ? '' : ' (nonaktif)'}</option>)}
              </select>
            </Field>
            <Field label="Kelas / nama armada">
              <input className={inputCls} value={f.busClass} required maxLength={60} placeholder="Double Decker Sleeper" onChange={(e) => set('busClass', e.target.value)} />
            </Field>
            <Field label="Kota asal" hint="Kartu membuka pencarian rute ini">
              <input className={inputCls} value={f.from} required list="kota-cardbus" placeholder="Tangerang" onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="Kota tujuan">
              <input className={inputCls} value={f.to} required list="kota-cardbus" placeholder="Malang" onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="Titik naik (opsional)" className="sm:col-span-2">
              <input className={inputCls} value={f.boardPoint ?? ''} maxLength={120} placeholder="Terminal Poris Plawad" onChange={(e) => set('boardPoint', e.target.value)} />
            </Field>
            <Field label="Harga mulai (Rp, opsional)" hint={f.price ? formatRupiah(f.price) : 'Kosong = tanpa harga'}>
              <input className={inputCls} inputMode="numeric" value={f.price ?? ''} onChange={(e) => set('price', toNumber(e.target.value))} />
            </Field>
            <Field label="Harga coret (Rp, opsional)" hint="Harus lebih besar dari harga">
              <input className={inputCls} inputMode="numeric" value={f.oldPrice ?? ''} onChange={(e) => set('oldPrice', toNumber(e.target.value))} />
            </Field>
          </div>
          <datalist id="kota-cardbus">{cities.map((c) => <option key={c} value={c} />)}</datalist>
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
                  className={`${inputCls} w-40 uppercase`}
                  value={f.tag}
                  maxLength={20}
                  required
                  placeholder="MIS. HEMAT 20%"
                  aria-label="Label badge sendiri"
                  onChange={(e) => set('tag', e.target.value.toUpperCase())}
                />
              )}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.comingSoon} onChange={(e) => set('comingSoon', e.target.checked)} />
              Segera hadir <span className="font-normal text-faint">(belum bisa dipesan)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
              Tampil di beranda
            </label>
          </div>
          {error && <ErrorBox message={error} />}
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy}>{busy ? 'Menyimpan…' : card ? 'Simpan' : 'Tambah kartu'}</button>
            <button type="button" className={btnSecondary} onClick={onCancel}>Batal</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Pratinjau di beranda</p>
          <div className="[&>div]:!grid-cols-1">
            <FeaturedGrid products={[preview]} preview />
          </div>
        </div>
      </form>
    </Card>
  );
}

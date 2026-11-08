'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card, ErrorBox, Field, PageHead, btnPrimary, btnSecondary, inputCls } from '@/components/admin/ui';
import { PoBadge } from '@/components/ui/po-badge';
import { ApiError } from '@/lib/api/client';
import { adminApi, type Partner, type PartnerInput } from '@/lib/api/admin';

const EMPTY: PartnerInput = { id: '', name: '', short: '', level: 1, adminName: '', adminPhone: '', commissionRate: 0.06, active: true };
/** 628xx → 08xx untuk ditampilkan / diedit. */
const localPhone = (p: string | null) => (p ? p.replace(/^62/, '0') : '');

/** Manajemen mitra PO: level kerja sama, admin PO, komisi, aktif/nonaktif (tabel po_partners). */
export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ isNew: boolean; data: PartnerInput } | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminApi
      .partners()
      .then(setPartners)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat mitra'));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <PageHead
        title="Mitra PO"
        sub="PO nonaktif: semua jadwalnya langsung hilang dari pencarian dan tidak bisa dipesan."
        action={
          <button className={btnPrimary} onClick={() => setEditing({ isNew: true, data: EMPTY })}>
            + Mitra baru
          </button>
        }
      />
      {error && <ErrorBox message={error} onRetry={load} />}
      {editing && (
        <PartnerForm
          key={editing.data.id || 'baru'}
          isNew={editing.isNew}
          initial={editing.data}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {!partners && !error && <p className="py-10 text-center text-muted">Memuat…</p>}
      {partners && (
        <div className="grid gap-3 md:grid-cols-2">
          {partners.map((p) => (
            <Card key={p.id} className={p.active ? '' : 'opacity-70'}>
              <div className="flex items-start gap-3">
                <PoBadge name={p.short} logo={p.logo} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{p.name}</h2>
                    <span className="font-mono text-xs text-faint">{p.id}</span>
                    {!p.active && <span className="rounded-full bg-[#eef1f1] px-2 py-0.5 text-[11px] font-extrabold text-muted">Nonaktif</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {p.adminName || 'Admin PO belum diisi'}
                    {p.adminPhone ? ` · ${localPhone(p.adminPhone)}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-extrabold">
                    <span className={`rounded-full px-2 py-0.5 ${p.level >= 2 ? 'bg-[#ede4f5] text-[#5b2380]' : 'bg-teal-soft text-brand-dark'}`}>
                      {p.level >= 2 ? 'Portal Mitra PO' : 'Mode Kuota'}
                    </span>
                    <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-[#8a5a00]">Komisi {Math.round(p.commissionRate * 1000) / 10}%</span>
                    <Link href={`/admin/jadwal?poId=${p.id}`} className="rounded-full bg-[#e5f4ea] px-2 py-0.5 text-[#1f6a3a] hover:underline">
                      {p.liveTrips ?? 0} tayang / {p.trips ?? 0} jadwal
                    </Link>
                  </div>
                </div>
                <button
                  className="text-sm font-semibold text-brand hover:underline"
                  onClick={() =>
                    setEditing({
                      isNew: false,
                      data: {
                        id: p.id, name: p.name, short: p.short, color: p.color, level: p.level, adminName: p.adminName ?? '',
                        adminPhone: localPhone(p.adminPhone), commissionRate: p.commissionRate, active: p.active,
                      },
                    })
                  }
                >
                  Ubah
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PartnerForm({ isNew, initial, onCancel, onSaved }: { isNew: boolean; initial: PartnerInput; onCancel: () => void; onSaved: () => void }) {
  const [f, setF] = useState(initial);
  // Komisi diedit dalam persen agar mudah dibaca (0.06 → "6")
  const [pct, setPct] = useState(String(Math.round(initial.commissionRate * 1000) / 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PartnerInput>(k: K, v: PartnerInput[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const rate = Number(pct.replace(',', '.')) / 100;
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.3) {
      setError('Komisi harus 0–30%');
      return;
    }
    setBusy(true);
    setError(null);
    const body = { ...f, commissionRate: rate, adminName: f.adminName || null, adminPhone: f.adminPhone || null };
    try {
      if (isNew) await adminApi.createPartner(body);
      else await adminApi.updatePartner(f.id, body);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4 border-brand">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-bold">{isNew ? 'Mitra PO baru' : `Ubah ${initial.name}`}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Kode PO" hint="Huruf kecil, mis. gm. Tidak bisa diganti.">
            <input className={inputCls} value={f.id} disabled={!isNew} required pattern="[a-z0-9\-]{2,30}" onChange={(e) => set('id', e.target.value.toLowerCase())} />
          </Field>
          <Field label="Nama PO" className="sm:col-span-2">
            <input className={inputCls} value={f.name} required minLength={3} placeholder="PO Gunung Mulia" onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Nama singkat" hint="Kosong = nama tanpa “PO”">
            <input className={inputCls} value={f.short} onChange={(e) => set('short', e.target.value)} />
          </Field>
          <Field label="Nama admin PO">
            <input className={inputCls} value={f.adminName ?? ''} onChange={(e) => set('adminName', e.target.value)} />
          </Field>
          <Field label="Nomor HP admin PO">
            <input className={inputCls} value={f.adminPhone ?? ''} inputMode="tel" placeholder="08…" onChange={(e) => set('adminPhone', e.target.value)} />
          </Field>
          <Field label="Komisi penjualan aplikasi (%)" hint="0–30%">
            <input className={inputCls} value={pct} inputMode="decimal" required onChange={(e) => setPct(e.target.value)} />
          </Field>
          <fieldset className="text-sm font-medium sm:col-span-2">
            <legend className="mb-1">Level kerja sama</legend>
            <div className="flex flex-wrap gap-2">
              {([
                [1, 'Mode Kuota', 'Jadwal dibuat Admin Pusat'],
                [2, 'Portal Mitra PO', 'PO kelola jadwal sendiri'],
              ] as const).map(([lv, label, hint]) => (
                <label key={lv} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${f.level === lv ? 'border-brand bg-teal-soft' : 'border-slate-300'}`}>
                  <input type="radio" name="level" className="mt-1" checked={f.level === lv} onChange={() => set('level', lv)} />
                  <span>
                    {label}
                    <span className="block text-xs font-normal text-faint">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
          Mitra aktif <span className="font-normal text-faint">(nonaktif = jadwal tidak tampil di aplikasi penumpang)</span>
        </label>
        {error && <ErrorBox message={error} />}
        <div className="flex gap-2">
          <button className={btnPrimary} disabled={busy}>{busy ? 'Menyimpan…' : isNew ? 'Tambah mitra' : 'Simpan'}</button>
          <button type="button" className={btnSecondary} onClick={onCancel}>Batal</button>
        </div>
      </form>
    </Card>
  );
}

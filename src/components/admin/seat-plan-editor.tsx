'use client';

import { useMemo, useState } from 'react';
import { FacilityCell } from '@/components/seat-layout-map';
import {
  MARK_CYCLE, MARK_LABEL, buildLayout, deckRows, markAt, newZone, setMark,
  type PreviewDeck, type SeatPlan, type SeatPlanDeck, type SeatTemplate, type SeatZone,
} from '@/lib/seat-plan';
import { Card, Field, btnSecondary, inputCls } from './ui';

const AISLE = 20;

/**
 * Editor denah kursi satu jadwal: pilih template kelas bus (Executive 2-2, Super Top 2-1, Suite 1-1,
 * Double Decker, Indorent, …), lalu atur lantai (tab Deck Bawah / Deck Atas), zona kelas per lantai,
 * dan ketuk sel pratinjau untuk menjadikannya kursi / kosong / toilet / pintu / tangga.
 * Denah tampil persis sama di aplikasi mobile & web penumpang.
 */
export function SeatPlanEditor({
  plan, templates, legacyLayout, onChange, onTemplate,
}: {
  plan: SeatPlan | null;
  templates: SeatTemplate[];
  /** Jadwal memakai denah data armada (bukan template) */
  legacyLayout: boolean;
  onChange: (plan: SeatPlan | null) => void;
  /** Template dipilih → isi juga tipe armada & format kursi di tab Jadwal */
  onTemplate: (t: SeatTemplate) => void;
}) {
  const built = useMemo(() => (plan ? buildLayout(plan) : null), [plan]);
  const [deckIdx, setDeckIdx] = useState(0);
  const di = plan ? Math.min(deckIdx, plan.decks.length - 1) : 0;

  const editDeck = (i: number, f: (d: SeatPlanDeck) => SeatPlanDeck) =>
    plan && onChange({ ...plan, template: plan.template, decks: plan.decks.map((d, j) => (j === i ? f(d) : d)) });
  const editZone = (i: number, zi: number, patch: Partial<SeatZone>) =>
    editDeck(i, (d) => ({ ...d, zones: d.zones.map((z, j) => (j === zi ? { ...z, ...patch } : z)) }));

  const pick = (t: SeatTemplate) => {
    onChange(structuredClone(t.plan));
    onTemplate(t);
    setDeckIdx(0);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-bold">Template kelas bus</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          Pilih template sesuai armada, lalu sesuaikan. Varian kursi & nomor kursi di tab Harga mengikuti denah ini; harga tetap diatur di tab Harga &amp; Promo.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const on = plan?.template === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => pick(t)}
                className={`rounded-xl border p-3 text-left transition ${on ? 'border-brand bg-teal-soft' : 'border-slate-300 hover:border-brand'}`}
              >
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{t.hint}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={!plan}
            onClick={() => onChange(null)}
            className={`rounded-xl border border-dashed p-3 text-left ${!plan ? 'border-brand bg-teal-soft' : 'border-slate-300 hover:border-brand'}`}
          >
            <span className="block text-sm font-bold">Tanpa denah</span>
            <span className="mt-0.5 block text-xs text-muted">Nomor kursi diketik manual per varian di tab Harga</span>
          </button>
        </div>
        {!plan && legacyLayout && (
          <p className="mt-3 rounded-lg bg-teal-soft p-2.5 text-xs text-brand-dark">
            Jadwal ini memakai denah tetap dari data armada. Pilih template untuk menggantinya dengan denah yang bisa diatur.
          </p>
        )}
      </Card>

      {plan && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" className="flex gap-1 rounded-xl bg-[#eef3f3] p-1">
              {plan.decks.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === di}
                  onClick={() => setDeckIdx(i)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-bold ${i === di ? 'bg-white shadow-sm' : 'text-muted'}`}
                >
                  {d.name || `Lantai ${i + 1}`}
                </button>
              ))}
            </div>
            {plan.decks.length < 3 && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  onChange({
                    ...plan,
                    decks: [...plan.decks, {
                      name: plan.decks.length === 1 ? 'Deck Atas' : `Lantai ${plan.decks.length + 1}`, door: 'Tangga', driver: 'Depan',
                      left: 2, right: 2, continueRows: true, zones: [newZone(`deck${plan.decks.length + 1}`, 'Executive Atas')], cells: [{ r: 1, c: 3, kind: 'stairs' }],
                    }],
                  });
                  setDeckIdx(plan.decks.length);
                }}
              >
                + Lantai (Double Decker)
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <DeckForm
              deck={plan.decks[di]}
              index={di}
              canRemove={plan.decks.length > 1}
              onDeck={(f) => editDeck(di, f)}
              onZone={(zi, patch) => editZone(di, zi, patch)}
              onRemove={() => {
                onChange({ ...plan, decks: plan.decks.filter((_, j) => j !== di) });
                setDeckIdx(0);
              }}
            />
            <Card className="lg:w-[360px]">
              <h3 className="mb-1 font-bold">Pratinjau {plan.decks[di].name}</h3>
              <p className="mb-3 text-xs text-muted">Ketuk sel untuk mengganti: {MARK_CYCLE.map((k) => MARK_LABEL[k]).join(' → ')}.</p>
              {typeof built === 'string' ? (
                <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-sm font-semibold text-red-700">{built}</p>
              ) : built && (
                <DeckPreview
                  deck={built.layout[di]}
                  onCell={(r, c) => {
                    const cur = markAt(plan.decks[di], r, c);
                    const next = MARK_CYCLE[(MARK_CYCLE.indexOf(cur) + 1) % MARK_CYCLE.length];
                    editDeck(di, (d) => setMark(d, r, c, next));
                  }}
                />
              )}
            </Card>
          </div>

          {built && typeof built !== 'string' && (
            <Card>
              <h3 className="mb-2 font-bold">Ringkasan kursi ({built.tiers.reduce((n, t) => n + t.seats.length, 0)})</h3>
              <ul className="space-y-1 text-sm">
                {built.tiers.map((t) => (
                  <li key={t.key}>
                    <b>{t.name}</b> <span className="text-faint">({t.key})</span> · {t.seats.length} kursi
                    <span className="block truncate text-xs text-muted">{t.seats.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DeckForm({
  deck, index, canRemove, onDeck, onZone, onRemove,
}: {
  deck: SeatPlanDeck;
  index: number;
  canRemove: boolean;
  onDeck: (f: (d: SeatPlanDeck) => SeatPlanDeck) => void;
  onZone: (zi: number, patch: Partial<SeatZone>) => void;
  onRemove: () => void;
}) {
  const cols = deck.left + deck.right;
  const num = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Number(v) || min));
  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nama lantai (tab)">
          <input className={inputCls} value={deck.name} onChange={(e) => onDeck((d) => ({ ...d, name: e.target.value }))} placeholder="Deck Bawah" />
        </Field>
        <Field label="Label kiri kepala denah">
          <input className={inputCls} value={deck.door} onChange={(e) => onDeck((d) => ({ ...d, door: e.target.value }))} placeholder="Pintu / Tangga" />
        </Field>
        <Field label="Label kanan kepala denah">
          <input className={inputCls} value={deck.driver} onChange={(e) => onDeck((d) => ({ ...d, driver: e.target.value }))} placeholder="Sopir / Depan" />
        </Field>
        <Field label="Kolom kiri lorong">
          <select className={inputCls} value={deck.left} onChange={(e) => onDeck((d) => ({ ...d, left: Number(e.target.value) }))}>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Kolom kanan lorong">
          <select className={inputCls} value={deck.right} onChange={(e) => onDeck((d) => ({ ...d, right: Number(e.target.value) }))}>
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Format" hint={`${deckRows(deck)} baris`}>
          <p className="py-2 text-sm font-bold">{deck.left}-{deck.right}</p>
        </Field>
      </div>
      {index > 0 && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(deck.continueRows)} onChange={(e) => onDeck((d) => ({ ...d, continueRows: e.target.checked }))} />
          Nomor baris melanjutkan lantai sebelumnya (mis. Deck Atas mulai 4A) agar kode kursi tidak bentrok
        </label>
      )}

      <h3 className="mb-2 mt-5 text-sm font-bold">Kelas di lantai ini (dari depan ke belakang)</h3>
      <div className="space-y-3">
        {deck.zones.map((z, zi) => (
          <div key={zi} className="rounded-xl border border-line p-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Nama kelas / varian">
                <input className={inputCls} value={z.tier.name} onChange={(e) => onZone(zi, { tier: { ...z.tier, name: e.target.value } })} placeholder="First Class" />
              </Field>
              <Field label="Kode varian" hint="huruf kecil; sama = satu harga">
                <input className={inputCls} value={z.tier.key} onChange={(e) => onZone(zi, { tier: { ...z.tier, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') } })} />
              </Field>
              <Field label="Judul bagian (opsional)">
                <input className={inputCls} value={z.title ?? ''} onChange={(e) => onZone(zi, { title: e.target.value || undefined })} placeholder="Panoramic view" />
              </Field>
              <Field label="Jumlah baris">
                <input className={inputCls} type="number" min={1} max={20} value={z.rows} onChange={(e) => onZone(zi, { rows: num(e.target.value, 1, 20) })} />
              </Field>
              <Field label="Jenis">
                <select className={inputCls} value={z.kind} onChange={(e) => onZone(zi, { kind: e.target.value as SeatZone['kind'] })}>
                  <option value="seat">Kursi</option>
                  <option value="bed">Sleeper / kursi tidur</option>
                </select>
              </Field>
              <Field label="Penomoran">
                <select className={inputCls} value={z.codes} onChange={(e) => onZone(zi, { codes: e.target.value as SeatZone['codes'] })}>
                  <option value="grid">Baris + huruf (1A, 1B)</option>
                  <option value="seq">Urut (SS1, SS2)</option>
                </select>
              </Field>
              <Field label="Awalan kode" hint="maks 2 huruf, mis. SS / B">
                <input className={inputCls} value={z.prefix} maxLength={2} onChange={(e) => onZone(zi, { prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} />
              </Field>
              {z.codes === 'grid' && (
                <Field label="Huruf kolom" hint={`${cols} kolom kiri→kanan; kosongkan kolom yang tak dipakai`}>
                  <input
                    className={inputCls}
                    value={(z.letters ?? [...Array(cols).keys()].map((c) => String.fromCharCode(65 + c))).join(',')}
                    onChange={(e) => {
                      const parts = e.target.value.toUpperCase().split(',').map((x) => x.trim().replace(/[^A-Z]/g, '').slice(0, 1));
                      const standard = parts.length === cols && parts.every((x, c) => x === String.fromCharCode(65 + c));
                      onZone(zi, { letters: standard ? undefined : parts });
                    }}
                    placeholder="A,B,C,D"
                  />
                </Field>
              )}
            </div>
            {deck.zones.length > 1 && (
              <button type="button" className="mt-2 text-xs font-semibold text-red-700" onClick={() => onDeck((d) => ({ ...d, zones: d.zones.filter((_, j) => j !== zi) }))}>
                Hapus kelas
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className={btnSecondary} onClick={() => onDeck((d) => ({ ...d, zones: [...d.zones, newZone(`kelas${d.zones.length + 1}`, 'Kelas baru')] }))}>
          + Kelas
        </button>
        {canRemove && (
          <button type="button" className="text-sm font-semibold text-red-700" onClick={onRemove}>Hapus lantai ini</button>
        )}
      </div>
    </Card>
  );
}

/** Pratinjau grid satu lantai; sel kursi / penanda bisa diketuk. */
function DeckPreview({ deck, onCell }: { deck: PreviewDeck; onCell: (r: number, c: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-fit rounded-b-xl rounded-t-[28px] border-[1.4px] border-line bg-white px-3 pb-3 pt-2.5">
        <div className="mb-2 flex justify-between border-b border-line pb-2 text-[11px] font-semibold text-muted">
          <span>{deck.door}</span>
          <span className="font-extrabold text-ink">{deck.name}</span>
          <span>{deck.driver}</span>
        </div>
        <div className="space-y-1.5">
          {deck.rows.map((row, ri) => {
            const head = row.length === 1 && 'section' in row[0] ? row[0] : null;
            if (head) return <p key={ri} className="border-b border-dashed border-line pb-0.5 pt-1.5 text-[11px] font-extrabold text-brand-dark">{head.section}</p>;
            return (
              <div key={ri} className="flex items-center justify-center gap-1.5">
                <span className="w-5 shrink-0 text-right text-[11px] font-bold text-faint">{deck.rowLabels[ri] ?? ''}</span>
                {row.map((c, ci) => {
                  const w = 'w' in c && c.w ? c.w : 42;
                  if ('aisle' in c) return <span key={ci} style={{ width: c.w ?? AISLE }} className="shrink-0" />;
                  if ('kind' in c && c.kind === 'col') return <span key={ci} style={{ width: w }} className="shrink-0 text-center text-[11px] font-bold text-faint">{c.text}</span>;
                  const pos = c.r !== undefined && c.c !== undefined ? { r: c.r, c: c.c } : null;
                  const click = pos ? () => onCell(pos.r, pos.c) : undefined;
                  if ('code' in c) {
                    return (
                      <button
                        key={ci}
                        type="button"
                        onClick={click}
                        title={`${c.code} — ketuk untuk mengganti`}
                        style={{ width: w }}
                        className={`shrink-0 border-[1.4px] border-brand bg-white text-[11px] font-extrabold text-brand hover:bg-teal-soft ${c.kind === 'bed' ? 'h-16 rounded-xl' : 'h-10 rounded-[10px]'}`}
                      >
                        {c.code}
                      </button>
                    );
                  }
                  if ('kind' in c && (c.kind === 'toilet' || c.kind === 'door' || c.kind === 'stairs')) {
                    return (
                      <button key={ci} type="button" onClick={click} className="shrink-0" aria-label={`${MARK_LABEL[c.kind]} — ketuk untuk mengganti`}>
                        <FacilityCell kind={c.kind} width={w} className="hover:border-brand" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={ci}
                      type="button"
                      onClick={click}
                      aria-label="Posisi kosong — ketuk untuk mengganti"
                      style={{ width: w }}
                      className="h-10 shrink-0 rounded-[10px] border border-dashed border-slate-200 hover:border-brand"
                    />
                  );
                })}
                <span className="w-5 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

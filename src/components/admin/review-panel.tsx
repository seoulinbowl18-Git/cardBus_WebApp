'use client';

import { useState } from 'react';
import { Card, StatusPill, btnPrimary, inputCls } from '@/components/admin/ui';
import { REVIEW_ISSUE, type ReviewIssue, type ReviewMessage, type TripStatus } from '@/lib/api/admin';

type IssueTab = (typeof REVIEW_ISSUE)[ReviewIssue]['tab'];

const when = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Validasi jadwal oleh PO (aplikasi CardBus Mitra): status, bagian yang ditandai salah (klik = buka tab
 * tempat memperbaikinya), percakapan Admin Pusat ↔ PO, dan kirim (ulang) ke PO dengan catatan.
 */
export function ReviewPanel({ status, issues, thread, poName, poReady, busy, onOpenTab, onSend }: {
  status: TripStatus;
  issues: ReviewIssue[];
  thread: ReviewMessage[];
  poName: string;
  /** PO punya nomor admin (bisa masuk ke aplikasi Mitra) */
  poReady: boolean;
  busy: boolean;
  onOpenTab: (tab: IssueTab) => void;
  /** Simpan perubahan form lalu kirim ke PO */
  onSend: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  const fix = status === 'fix';
  // Jadwal tayang tidak dikirim ulang dari sini: status review menyembunyikannya dari aplikasi penumpang
  const canSend = status === 'draft' || fix;

  return (
    <Card className={fix ? 'border-[#f0b8b8] bg-[#fffafa]' : status === 'review' ? 'border-[#f3dc9b] bg-[#fffdf6]' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">Validasi PO {poName}</h2>
        <StatusPill status={status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {fix
          ? 'PO menandai bagian di bawah ini salah. Perbaiki di tab terkait, lalu kirim ulang ke PO.'
          : status === 'review'
            ? 'Menunggu PO mengecek di aplikasi CardBus Mitra. Jadwal tayang di aplikasi penumpang setelah PO menyetujui.'
            : status === 'live'
              ? 'Riwayat validasi jadwal ini dengan PO.'
              : 'Kirim jadwal ke PO untuk dicek di aplikasi CardBus Mitra sebelum tayang.'}
      </p>

      {fix && issues.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#9b1c1c]">Perlu diperbaiki</p>
          <div className="flex flex-wrap gap-2">
            {issues.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onOpenTab(REVIEW_ISSUE[k].tab)}
                className="rounded-full border border-[#f0b8b8] bg-white px-3 py-1 text-sm font-semibold text-[#9b1c1c] hover:bg-[#fbe9e9]"
              >
                {REVIEW_ISSUE[k]?.label ?? k} →
              </button>
            ))}
          </div>
        </div>
      )}

      {thread.length > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Percakapan dengan PO">
          {thread.map((m, i) => (
            <li key={i} className={`flex ${m.who === 'pusat' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.who === 'pusat' ? 'bg-teal-soft text-ink' : 'border border-line bg-white'}`}>
                <p className="text-[11px] font-bold text-faint">
                  {m.who === 'pusat' ? 'Admin Pusat' : `PO ${poName}`} · {when(m.at)}
                </p>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canSend && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium" htmlFor="review-note">
            Catatan untuk PO <span className="font-normal text-faint">(opsional)</span>
          </label>
          <textarea
            id="review-note"
            className={`${inputCls} min-h-[72px]`}
            maxLength={500}
            placeholder={fix ? 'Mis. Jam sudah diganti 19.00, harga Rp290.000.' : 'Mis. Jadwal tambahan akhir pekan, mohon cek titik naik.'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {!poReady && (
            <p className="text-xs font-semibold text-[#8a5a00]">
              PO ini belum punya nomor HP admin, jadi belum bisa masuk ke aplikasi Mitra. Isi dulu di menu Mitra PO.
            </p>
          )}
          <button type="button" className={btnPrimary} disabled={busy || !poReady} onClick={() => onSend(note.trim())}>
            {busy ? 'Mengirim…' : fix ? 'Simpan & kirim ulang ke PO' : 'Simpan & kirim ke PO untuk divalidasi'}
          </button>
        </div>
      )}
    </Card>
  );
}

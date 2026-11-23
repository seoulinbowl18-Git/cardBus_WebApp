'use client';

import Link from 'next/link';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useUi } from '@/providers/ui-provider';

/**
 * Seksi "FAQ" Beranda: tab kategori + accordion buka-tutup. Jawaban mengikuti kondisi CardBus saat ini
 * dan Syarat & Ketentuan (lib/legal.ts); tidak ada kebijakan atau angka di luar yang sudah berlaku.
 */
type Item = { q: string; a: ReactNode };
type Category = { key: string; label: string; items: Item[] };

const TermsLink = () => (
  <Link href="/syarat-ketentuan" className="font-semibold text-brand underline-offset-2 hover:underline">
    Syarat &amp; Ketentuan
  </Link>
);

const CATEGORIES: Category[] = [
  {
    key: 'umum',
    label: 'Umum',
    items: [
      {
        q: 'Apakah pesan tiket di CardBus lebih praktis daripada datang langsung ke loket?',
        a: 'Ya. Dari HP atau browser kamu bisa mengecek jadwal bus, memilih kursi yang masih tersedia, lalu membayar lewat QRIS atau Virtual Account tanpa perlu antre ke loket. E-tiket terbit otomatis setelah pembayaran berhasil.',
      },
      {
        q: 'Apakah aplikasi CardBus sudah tersedia di Google Play dan App Store?',
        a: 'Saat ini layanan CardBus sudah bisa dipakai lewat web app di browser, dan web app ini bisa dipasang ke layar utama HP seperti aplikasi. Ketersediaan di toko aplikasi resmi akan dibuka bertahap.',
      },
      {
        q: 'Bagaimana cara menghubungi layanan bantuan CardBus?',
        a: 'Ketuk menu Bantuan di bagian atas halaman untuk menghubungi CS CardBus. Siapkan kode pesanan agar CS bisa membantu lebih cepat.',
      },
    ],
  },
  {
    key: 'pemesanan',
    label: 'Pemesanan & Pembayaran',
    items: [
      {
        q: 'Bisakah saya memilih kursi sendiri saat pesan tiket?',
        a: 'Bisa. Kamu dapat memilih kursi yang masih tersedia pada denah bus yang mendukung pemilihan kursi. Kursi baru menjadi milikmu setelah pembayaran berhasil; sebelum itu kursi hanya ditahan sampai batas waktu bayar.',
      },
      {
        q: 'Metode pembayaran apa saja yang bisa dipakai?',
        a: 'Pembayaran diproses melalui QRIS (bisa dipindai dengan e-wallet atau m-banking) atau Virtual Account bank. Total yang ditagihkan sudah termasuk biaya layanan pembayaran yang ditampilkan sebelum kamu membayar. Pesanan yang tidak dibayar sampai batas waktu akan dibatalkan otomatis.',
      },
      {
        q: 'Apakah jadwal bus bisa berubah setelah tiket dipesan?',
        a: (
          <>
            Jadwal mengikuti operasional masing-masing PO bus. Jika ada perubahan atau kendala, pantau informasi tiketmu di menu{' '}
            <Link href="/pesanan" className="font-semibold text-brand underline-offset-2 hover:underline">
              Tiket Saya
            </Link>{' '}
            dan hubungi layanan bantuan CardBus. Jika perjalanan dibatalkan oleh PO, dana dikembalikan penuh.
          </>
        ),
      },
    ],
  },
  {
    key: 'tiket',
    label: 'Tiket & Keberangkatan',
    items: [
      {
        q: 'Bagaimana cara naik bus setelah tiket terbit?',
        a: 'Buka e-tiket di menu Tiket Saya, lalu datang ke titik naik atau terminal yang kamu pilih paling lambat 30 menit sebelum jam keberangkatan. Tunjukkan e-tiket kepada petugas PO dan pastikan nama penumpang sesuai identitas yang kamu bawa.',
      },
      {
        q: 'Bagaimana jika saya tertinggal bus atau ingin mengubah jadwal/membatalkan tiket?',
        a: (
          <>
            Pembatalan bisa diajukan ke CS CardBus sebelum jam keberangkatan yang tertera di e-tiket. Penumpang yang terlambat atau tidak datang
            dianggap sudah memakai tiketnya. Ketentuan perubahan jadwal, pembatalan, dan pengembalian dana mengikuti aturan PO terkait serta <TermsLink />{' '}
            CardBus.
          </>
        ),
      },
    ],
  },
];

export function Faq() {
  const { openCsHelp } = useUi();
  const base = useId();
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cat = CATEGORIES[tab];

  const select = (i: number) => {
    setTab(i);
    setOpen(null);
    tabRefs.current[i]?.focus();
  };
  const onTabKey = (e: KeyboardEvent) => {
    const n = CATEGORIES.length;
    const next = e.key === 'ArrowRight' ? (tab + 1) % n : e.key === 'ArrowLeft' ? (tab - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
  };

  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-xl font-extrabold text-ink sm:text-2xl">
        FAQ
      </h2>
      <span className="mt-1.5 block h-1 w-12 rounded-full bg-brand" aria-hidden />
      <p className="mt-2 text-sm text-muted">Pertanyaan yang sering diajukan seputar pemesanan tiket di CardBus.</p>

      <div className="mt-4 rounded-2xl border border-line bg-white shadow-[0_6px_18px_-14px_rgba(4,46,49,0.35)]">
        <div
          role="tablist"
          aria-label="Kategori pertanyaan"
          onKeyDown={onTabKey}
          className="flex gap-1.5 overflow-x-auto border-b border-line px-3 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c, i) => {
            const on = i === tab;
            return (
              <button
                key={c.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`${base}-tab-${c.key}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`${base}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                className={`relative shrink-0 whitespace-nowrap rounded-t-lg px-3 pb-3 pt-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  on ? 'text-brand' : 'text-muted hover:text-ink'
                }`}
              >
                {c.label}
                <span className={`absolute inset-x-2 -bottom-px h-[3px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-transparent'}`} aria-hidden />
              </button>
            );
          })}
        </div>

        <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${cat.key}`} className="px-4 sm:px-6">
          <ul className="divide-y divide-line">
            {cat.items.map((item, i) => {
              const id = `${cat.key}-${i}`;
              const expanded = open === id;
              return (
                <li key={id}>
                  <h3>
                    <button
                      type="button"
                      id={`${base}-q-${id}`}
                      aria-expanded={expanded}
                      aria-controls={`${base}-a-${id}`}
                      onClick={() => setOpen(expanded ? null : id)}
                      className="group flex w-full items-start justify-between gap-4 py-4 text-left focus-visible:outline-none"
                    >
                      <span className={`text-[15px] font-semibold leading-snug transition-colors group-focus-visible:underline ${expanded ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>
                        {item.q}
                      </span>
                      <span
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${expanded ? 'rotate-180 bg-brand text-white' : 'bg-teal-soft text-brand'}`}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`${base}-a-${id}`}
                    role="region"
                    aria-labelledby={`${base}-q-${id}`}
                    hidden={!expanded}
                    className="pb-4 pr-11 text-sm leading-relaxed text-muted"
                  >
                    {item.a}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3.5 text-sm sm:px-6">
          <span className="text-muted">Masih punya pertanyaan?</span>
          <button
            type="button"
            onClick={openCsHelp}
            className="rounded-full bg-teal-soft px-4 py-2 font-semibold text-brand transition hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Hubungi Bantuan
          </button>
        </div>
      </div>
    </section>
  );
}

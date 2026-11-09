'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FeaturedProduct, Promo } from '@/lib/home-content';
import { formatRupiah } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

/** Link ke hasil pencarian; tanggal diisi otomatis "hari ini" oleh halaman /cari. */
const routeHref = (from: string, to: string) => `/cari?${new URLSearchParams({ from, to })}`;

/** Sapaan seperti HomeHeader mobile: "Halo, Budi! Mau ke mana?" */
export function Greeting() {
  const { user } = useAuth();
  const first = user?.name?.trim().split(/\s+/)[0] || 'Kak';
  return <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">Halo, {first}! Mau ke mana?</h1>;
}

/** Notifikasi singkat di bawah layar (padanan SnackBar mobile). */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div role="status" className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg">
      {msg}
    </div>
  ) : null;
  return { show: setMsg, node };
}

export function SectionTitle({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold sm:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-xs font-extrabold text-brand">{trailing}</div>}
    </div>
  );
}

function Tag({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'red' | 'teal' }) {
  const cls = { gold: 'bg-gold text-ink', red: 'bg-promo text-white', teal: 'bg-brand text-white' }[tone];
  return <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${cls}`}>{children}</span>;
}

/** Banner promo: foto + gradasi teal gelap + teks + tombol emas (PromoBannerCard mobile). */
export function PromoBanner({ promo, onSoon, tall, preview }: { promo: Promo; onSoon: (m: string) => void; tall?: boolean; preview?: boolean }) {
  const route = promo.from && promo.to && !promo.soonMessage;
  const cta = (
    <span className="mt-2 inline-flex rounded-full bg-gold px-3 py-1.5 text-xs font-extrabold text-ink">{promo.ctaLabel} →</span>
  );
  const body = (
    <>
      {promo.image && (
        // eslint-disable-next-line @next/next/no-img-element -- gambar dari backend (host berbeda per environment)
        <img src={promo.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,46,49,0.94)_0%,rgba(4,46,49,0.7)_50%,rgba(4,46,49,0)_85%)]" />
      <div className="relative flex h-full w-2/3 flex-col justify-center p-4">
        <span><Tag>{promo.tag}</Tag></span>
        <p className="mt-1 line-clamp-2 text-base font-extrabold leading-snug text-white">{promo.title}</p>
        <p className="truncate text-[11px] text-[#dcefee]">{promo.subtitle}</p>
        <span>{cta}</span>
      </div>
    </>
  );
  const cls = `group relative block overflow-hidden rounded-[18px] bg-[#0f857d] text-left ${tall ? 'h-[188px]' : 'h-[150px]'}`;
  if (preview) return <div className={cls}>{body}</div>;
  if (route) return <Link href={routeHref(promo.from!, promo.to!)} className={cls}>{body}</Link>;
  if (promo.link) {
    return <a href={promo.link} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>;
  }
  return (
    <button type="button" onClick={() => onSoon(promo.soonMessage ?? (promo.subtitle || promo.title))} className={`${cls} w-full`}>{body}</button>
  );
}

/** Deretan banner yang bisa digeser (HP) / grid (laptop), dengan titik penanda. */
export function PromoRow({ promos, tall, stacked }: { promos: Promo[]; tall?: boolean; stacked?: boolean }) {
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (!el || !el.firstElementChild) return;
    const w = (el.firstElementChild as HTMLElement).offsetWidth + 12;
    setIndex(Math.round(el.scrollLeft / w));
  };
  if (stacked) {
    return (
      <>
        <div className="grid gap-3 md:grid-cols-2">
          {promos.map((p) => <PromoBanner key={p.id ?? p.title} promo={p} tall={tall} onSoon={toast.show} />)}
        </div>
        {toast.node}
      </>
    );
  }
  return (
    <>
      <div
        ref={ref}
        onScroll={onScroll}
        className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0 ${promos.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
      >
        {promos.map((p) => (
          <div key={p.id ?? p.title} className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-auto">
            <PromoBanner promo={p} tall={tall} onSoon={toast.show} />
          </div>
        ))}
      </div>
      {promos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 lg:hidden" aria-hidden>
          {promos.map((p, i) => (
            <span key={p.id ?? p.title} className={`h-2 rounded-full transition-all ${i === index ? 'w-[22px] bg-brand' : 'w-2 bg-line'}`} />
          ))}
        </div>
      )}
      {toast.node}
    </>
  );
}

const TAG_TONE: Record<string, 'gold' | 'red' | 'teal'> = { PROMO: 'red', DISKON: 'red', TERLARIS: 'gold', BARU: 'teal' };

/**
 * Kartu "Produk unggulan" (PromoCardWidget mobile). Foto & logo bisa dari backend (host lain), jadi memakai
 * <img> biasa. Dipakai juga sebagai pratinjau di Admin Pusat (`preview`: tanpa tautan).
 */
export function FeaturedGrid({ products, preview }: { products: FeaturedProduct[]; preview?: boolean }) {
  const toast = useToast();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p) => {
          const card = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#dce4e4]">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto dari backend (host berbeda per environment)
                  <img src={p.image} alt={`Bus ${p.poName} ${p.busClass}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-2xl font-extrabold text-brand/40">{p.poName.slice(0, 2).toUpperCase()}</span>
                )}
                <span className="absolute left-2 top-2"><Tag tone={TAG_TONE[p.tag] ?? 'gold'}>{p.tag}</Tag></span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center gap-1.5">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo dari backend; lebar mengikuti bentuk logo
                    <img src={p.logo} alt="" loading="lazy" className="h-5 w-auto min-w-5 max-w-[60px] rounded object-contain" />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded bg-brand text-[8px] font-extrabold text-white">{p.poName.slice(0, 2).toUpperCase()}</span>
                  )}
                  <span className="truncate text-sm font-extrabold">{p.poName}</span>
                </div>
                <p className="truncate text-xs text-muted">{p.busClass}</p>
                <p className="mt-2 text-sm font-bold leading-snug">{p.from} → {p.to}</p>
                {p.boardPoint && <p className="truncate text-[11px] text-faint">Naik di {p.boardPoint}</p>}
                <div className="mt-auto pt-3">
                  {p.comingSoon || !p.price ? (
                    <span className="text-xs font-extrabold text-brand">Segera hadir</span>
                  ) : (
                    <>
                      {p.oldPrice && <span className="mr-1 text-[11px] text-faint line-through">{formatRupiah(p.oldPrice)}</span>}
                      <span className="block text-[11px] text-muted">mulai</span>
                      <span className="text-base font-extrabold text-brand">{formatRupiah(p.price)}</span>
                    </>
                  )}
                </div>
              </div>
            </>
          );
          const cls = 'group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md';
          if (preview) return <div key={p.id} className={cls}>{card}</div>;
          return p.comingSoon ? (
            <button key={p.id} type="button" className={cls} onClick={() => toast.show(`PO ${p.poName} ${p.from} → ${p.to}: jadwal segera hadir di CardBus`)}>
              {card}
            </button>
          ) : (
            <Link key={p.id} href={routeHref(p.from, p.to)} className={cls}>{card}</Link>
          );
        })}
      </div>
      {toast.node}
    </>
  );
}

const FEATURES: { label: string; icon: React.ReactNode }[] = [
  { label: 'Pesan Tiket Mudah', icon: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Zm10-2v12" /> },
  { label: 'Aman & Terpercaya', icon: <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Zm-3.5 9 2.5 2.5 4.5-5" /> },
  { label: 'Banyak Pilihan PO Bus', icon: <path d="M5 17V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v11M5 17h14M5 17v2m14-2v2M5 11h14M8 14h.01M16 14h.01" /> },
  { label: 'Cepat & Praktis', icon: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-3-6.7M21 4v4h-4" /> },
];

/** Keunggulan CardBus (FeatureStrip mobile). */
export function FeatureStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
      {FEATURES.map((f) => (
        <div key={f.label} className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-soft text-brand">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {f.icon}
            </svg>
          </span>
          <span className="text-[13px] font-semibold leading-snug">{f.label}</span>
        </div>
      ))}
    </div>
  );
}

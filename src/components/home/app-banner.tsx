'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import type { AppBannerBackground } from '@/lib/app-banner-background';
import { AppBannerArt } from './app-banner-art';

/**
 * Banner "Get the CardBus App": judul + subjudul di kiri, ilustrasi bus di jalan pesisir, dan panel unduh
 * di kanan (Google Play, App Store, QR). Jujur soal ketersediaan: tanpa NEXT_PUBLIC_PLAY_STORE_URL /
 * NEXT_PUBLIC_APP_STORE_URL tombol toko tampil "Segera hadir" (tidak bisa diklik) dan tidak ada angka
 * rating/unduhan. QR mengarah ke tautan Play Store bila ada, selain itu ke web app CardBus ini (bisa
 * dipasang sebagai aplikasi/PWA). QR disembunyikan di HP (tidak bisa memindai layar sendiri).
 */
export function AppBanner({ background = null }: { background?: AppBannerBackground | null }) {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const qrValue = config.playStoreUrl || (origin ? `${origin}/` : '');
  const qrLabel = config.playStoreUrl ? 'Pindai untuk mengunduh' : 'Pindai untuk buka di HP';

  return (
    <section
      aria-labelledby="app-banner-title"
      className="relative isolate overflow-hidden rounded-[28px] bg-[linear-gradient(110deg,#064e52_0%,#076f6a_35%,#087f78_60%,#10a394_100%)] text-white shadow-[0_24px_48px_-28px_rgba(4,46,49,0.7)]"
    >
      {/* Gambar latar musiman (lib/app-banner-background.ts) + lapisan gelap agar teks & panel tetap terbaca */}
      {background && (
        <>
          <Image
            src={background.src}
            alt={background.alt}
            fill
            sizes="(min-width: 1024px) 992px, 100vw"
            className="-z-20 object-cover"
            style={{ objectPosition: background.position }}
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,46,49,0.88)_0%,rgba(4,46,49,0.6)_32%,rgba(4,46,49,0.1)_55%,rgba(4,46,49,0.55)_100%)] lg:bg-[linear-gradient(90deg,rgba(4,46,49,0.92)_0%,rgba(4,46,49,0.72)_34%,rgba(4,46,49,0.08)_58%,rgba(4,46,49,0.3)_100%)]"
            aria-hidden
          />
        </>
      )}
      {/* Cahaya keemasan lembut & lengkung terang */}
      <div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,194,71,0.35)_0%,rgba(255,194,71,0)_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-96 w-96 rounded-full bg-white/[0.05]" aria-hidden />

      <div className="relative lg:min-h-[270px]">
        {/* Kiri: badge logo, judul, subjudul */}
        <div className="relative z-10 px-5 pb-2 pt-6 sm:px-8 sm:pt-8 md:min-h-[240px] md:w-[52%] lg:min-h-0 lg:w-[40%] lg:pb-8 lg:pr-0">
          <div className="flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-sm">
              <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Card<span className="text-gold">Bus</span>
            </span>
          </div>
          <h2 id="app-banner-title" className="mt-4 text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
            Get the <span className="text-gold">CardBus</span> App
          </h2>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-white/90 sm:text-base">
            Pesan tiket bus kapan saja, di mana saja, lebih cepat dan praktis!
          </p>
          <svg viewBox="0 0 200 14" className="mt-3 h-3 w-40 text-gold" fill="none" aria-hidden>
            <path d="M2 10 C 60 2, 130 2, 198 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Ilustrasi bus di jalan pesisir */}
        <div className="relative h-[180px] sm:h-[220px] md:absolute md:right-0 md:top-0 md:left-[46%] md:h-[240px] lg:bottom-0 lg:top-0 lg:left-[30%] lg:right-[420px] lg:h-auto xl:right-[450px]" aria-hidden>
          {!background && <AppBannerArt className="absolute inset-0 h-full w-full" />}
          {background?.caption && (
            <span className="absolute inset-0 grid place-items-center px-2 text-center text-[2.4rem] font-black uppercase leading-none tracking-[0.04em] text-[#e11d24] [text-shadow:0_2px_10px_rgba(255,255,255,0.55),0_1px_2px_rgba(60,10,10,0.35)] sm:text-5xl lg:place-items-end lg:pb-7 lg:pr-5 lg:text-[1.65rem]">
              {background.caption}
            </span>
          )}
        </div>

        {/* Kanan: panel unduh */}
        <div className="relative z-10 mx-3 mb-3 rounded-[22px] bg-[#053f43]/70 p-4 ring-1 ring-white/10 backdrop-blur-md sm:mx-5 sm:mb-5 sm:p-5 lg:absolute lg:inset-y-5 lg:right-5 lg:m-0 lg:flex lg:w-[400px] lg:items-center xl:w-[430px]">
          <div className="flex w-full items-center gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold sm:text-[15px]">Unduh aplikasi CardBus di</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-1">
                <StoreButton href={config.playStoreUrl} kind="play" />
                <StoreButton href={config.appStoreUrl} kind="apple" />
              </div>
            </div>
            <div className="hidden w-px shrink-0 bg-white/15 md:block" aria-hidden />
            <div className="hidden w-[120px] shrink-0 flex-col items-center md:flex">
              <p className="text-center text-xs font-semibold text-white/85">{qrLabel}</p>
              <div className="mt-2.5 rounded-xl bg-white p-2 shadow-sm">
                {qrValue ? (
                  <QRCodeSVG value={qrValue} size={96} fgColor="#0b2b2e" aria-label={qrLabel} />
                ) : (
                  <div className="h-24 w-24" aria-hidden />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Tombol toko aplikasi. Tanpa tautan = "Segera hadir" (tidak bisa diklik). */
function StoreButton({ href, kind }: { href: string; kind: 'play' | 'apple' }) {
  const small = kind === 'play' ? 'Tersedia di' : 'Unduh di';
  const big = kind === 'play' ? 'Google Play' : 'App Store';
  const icon =
    kind === 'play' ? (
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
        <path d="M4 3.2v17.6c0 .5.5.8.9.6l9.6-9.4L4.9 2.6c-.4-.2-.9.1-.9.6Z" fill="#34d399" />
        <path d="m14.5 12-9.6 9.4 11.3-6.5Z" fill="#f87171" />
        <path d="M4.9 2.6 14.5 12l1.7-2.9Z" fill="#60a5fa" />
        <path d="m16.2 9.1-1.7 2.9 1.7 2.9 3.3-1.9c.7-.4.7-1.6 0-2Z" fill="#fbbf24" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
        <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6ZM14.1 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z" />
      </svg>
    );
  const inner = (
    <>
      {icon}
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[10px] font-medium text-white/75">{small}</span>
        <span className="block whitespace-nowrap text-[13px] font-bold min-[400px]:text-sm sm:text-[15px]">{big}</span>
      </span>
    </>
  );
  const base = 'relative flex h-[52px] items-center gap-2 rounded-xl bg-black px-2.5 sm:gap-2.5 sm:px-3 text-white ring-1 ring-white/15';
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} transition hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold`}>
        {inner}
      </a>
    );
  }
  return (
    <div aria-disabled="true" title="Aplikasi segera hadir" className={`${base} cursor-default opacity-80`}>
      {inner}
      <span className="absolute -right-1.5 -top-2 rounded-full bg-gold px-1.5 py-px text-[9px] font-extrabold text-brand-dark shadow">Segera hadir</span>
    </div>
  );
}

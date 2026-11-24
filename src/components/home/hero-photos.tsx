'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/** Foto bus di hero Beranda (public/hero). position = titik fokus potongan agar badan bus tetap terlihat. */
const PHOTOS = [
  { src: '/hero/bus-garudamas.webp', alt: 'Bus PO Garuda Mas', position: '62% 58%' },
  { src: '/hero/bus-agramas.webp', alt: 'Bus PO Agra Mas', position: '58% 60%' },
  { src: '/hero/bus-harapanjaya.webp', alt: 'Bus PO Harapan Jaya', position: '50% 62%' },
];
const INTERVAL_MS = 5000;

/**
 * Foto bus bergantian di sisi kanan hero (crossfade). Tepi kiri & bawah memudar ke teal hero agar sapaan
 * tetap terbaca. Berhenti berganti bila pengguna memilih "kurangi gerakan" atau tab tidak terlihat.
 */
export function HeroPhotos({ className = '' }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') setI((n) => (n + 1) % PHOTOS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [i]);

  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Dua lapis mask: pudar dari kiri, lalu pudar ke bawah */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_0%,#000_38%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_34%,#000_86%,transparent_100%)]">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)]">
          {PHOTOS.map((p, n) => (
            <Image
              key={p.src}
              src={p.src}
              alt={n === i ? p.alt : ''}
              aria-hidden={n !== i}
              fill
              priority={n === 0}
              sizes="(min-width: 1024px) 620px, (min-width: 640px) 55vw, 64vw"
              className={`object-cover transition-opacity duration-1000 ease-out ${n === i ? 'opacity-100' : 'opacity-0'}`}
              style={{ objectPosition: p.position }}
            />
          ))}
        </div>
      </div>
      <div className="pointer-events-auto absolute bottom-3 right-4 flex gap-1.5 sm:bottom-5 sm:right-8" role="group" aria-label="Pilih foto bus">
        {PHOTOS.map((p, n) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Foto ${n + 1} dari ${PHOTOS.length}: ${p.alt}`}
            aria-current={n === i}
            className="grid h-6 w-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span className={`block h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-gold' : 'w-1.5 bg-white/60'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

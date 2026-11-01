/* eslint-disable @next/next/no-img-element -- foto dari backend (host berbeda per environment) */

/** Foto bus dari backend; tanpa foto tampil kotak polos dengan inisial PO. */
export function BusPhoto({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-brand/10 text-lg font-extrabold text-brand ${className}`} aria-hidden>
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export function PoLogo({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={`Logo ${alt}`} loading="lazy" className="h-6 w-auto object-contain" />;
}

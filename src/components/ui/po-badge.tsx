/* eslint-disable @next/next/no-img-element -- logo dari backend (host berbeda per environment) */

/**
 * Logo PO dalam kotak, atau inisial berwarna bila tidak ada logo (PoBadge mobile).
 * Tinggi kotak = `size`; lebarnya mengikuti bentuk logo sampai 2,5× tinggi, agar logo unggahan yang melebar
 * (mis. 512×66) tetap terbaca dan tidak menyusut jadi garis tipis di kotak persegi. Logo persegi tetap size×size.
 */
export function PoBadge({ name, logo, size = 40 }: { name: string; logo?: string | null; size?: number }) {
  return logo ? (
    <span
      style={{ height: size, minWidth: size, maxWidth: size * 2.5 }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white p-1"
    >
      <img src={logo} alt={`Logo ${name}`} loading="lazy" className="block h-auto max-h-full w-auto max-w-full object-contain" />
    </span>
  ) : (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-[10px] bg-brand text-xs font-extrabold text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

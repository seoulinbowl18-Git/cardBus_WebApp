/* eslint-disable @next/next/no-img-element -- logo dari backend (host berbeda per environment) */

/** Logo PO dalam kotak, atau inisial berwarna bila tidak ada logo (PoBadge mobile). */
export function PoBadge({ name, logo, size = 40 }: { name: string; logo?: string | null; size?: number }) {
  const style = { width: size, height: size };
  return logo ? (
    <span style={style} className="grid shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line bg-white p-1">
      <img src={logo} alt={`Logo ${name}`} loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  ) : (
    <span style={style} className="grid shrink-0 place-items-center rounded-[10px] bg-brand text-xs font-extrabold text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

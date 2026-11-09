import { parseFacilities } from '@/lib/facilities';

/** Chip fasilitas: dikenal → ikon khusus; fasilitas baru → ikon generik + teks aslinya (tidak dibuang). */
export function FacilityChips({ codes }: { codes?: string[] | string | null }) {
  const items = parseFacilities(codes);
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Fasilitas">
      {items.map((f) => (
        <li
          key={f.code}
          className={`max-w-[14rem] truncate rounded-full px-2 py-0.5 text-xs font-medium ${f.known ? 'bg-brand/10 text-brand-dark' : 'border border-brand/20 bg-white text-ink'}`}
        >
          <span aria-hidden>{f.icon}</span> {f.label}
        </li>
      ))}
    </ul>
  );
}

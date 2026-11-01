import { facilityInfo } from '@/lib/facilities';

export function FacilityChips({ codes }: { codes?: string[] }) {
  if (!codes?.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {codes.map((c) => {
        const f = facilityInfo(c);
        return (
          <li key={c} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
            <span aria-hidden>{f.icon}</span> {f.label}
          </li>
        );
      })}
    </ul>
  );
}

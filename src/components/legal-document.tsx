import Link from 'next/link';
import type { LegalDocument } from '@/lib/legal';

/** Tampilan dokumen legal, padanan LegalScreen di aplikasi mobile. */
export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/akun" className="text-sm text-brand">← Akun</Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{doc.title}</h1>
        <p className="text-xs text-faint">Terakhir diperbarui: {doc.updated}</p>
        <p className="leading-relaxed text-muted">{doc.intro}</p>
      </header>
      <div className="space-y-4">
        {doc.sections.map((s) => (
          <section key={s.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-extrabold">{s.title}</h2>
            <ul className="space-y-1.5">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2 text-[14px] leading-relaxed text-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

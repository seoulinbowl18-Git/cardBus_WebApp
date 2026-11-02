import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { csWhatsappUrl } from '@/lib/cs';
import { CANCELLATION_POLICY } from '@/lib/legal';

export const metadata: Metadata = { title: 'Tiket Cancel & Pengembalian Dana' };

/** Padanan RefundHistoryScreen di aplikasi mobile: ketentuan pembatalan + chat CS. */
export default function CancellationPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/akun" className="text-sm text-brand">← Akun</Link>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Tiket Cancel & Pengembalian Dana</h1>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-extrabold">Ketentuan Pembatalan & Pengembalian Dana</h2>
        <ol className="space-y-2">
          {CANCELLATION_POLICY.map((t, i) => (
            <li key={t} className="flex gap-2 text-[14px] leading-relaxed text-muted">
              <span className="font-semibold">{i + 1}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>
      <a
        href={csWhatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-2xl bg-brand p-5 text-white shadow-sm transition hover:bg-brand-dark"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15"><Icon name="support" /></span>
        <span className="flex-1">
          <span className="block font-extrabold">Kontak Kami / Hubungi CS</span>
          <span className="block text-sm text-white/80">Chat Admin CardBus lewat WhatsApp untuk membatalkan tiket</span>
        </span>
        <Icon name="chevron" />
      </a>
    </article>
  );
}

import { todayWib } from '@/lib/format';

// Beranda: form cari jadwal. Form GET biasa -> /cari?from=..&to=..&date=.. (tanpa JS pun jalan).
export default function HomePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Tiket Bus, Lebih Mudah.</h1>
        <p className="mt-1 text-slate-600">Cari jadwal dan pesan kursi dari berbagai PO bus.</p>
      </div>
      <form action="/cari" className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Dari
          <input name="from" required minLength={2} placeholder="Wonogiri" className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ke
          <input name="to" required minLength={2} placeholder="Jakarta" className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tanggal
          <input name="date" type="date" required defaultValue={todayWib()} min={todayWib()} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <button className="self-end rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">Cari Bus</button>
      </form>
    </section>
  );
}

/**
 * Latar Hero Beranda: gradasi teal ke tosca dengan ornamen perjalanan (pin lokasi, rute putus-putus,
 * tiket, bus, dan gelombang di bawah). Murni dekoratif: aria-hidden, tidak bisa diklik, dan selalu
 * berada di BELAKANG konten hero (form cari tetap putih solid di atasnya).
 *
 * Semua ornamen SVG inline (tanpa file gambar / dependency) sehingga tidak ada request tambahan
 * maupun layout shift. Pin, rute, dan tiket di pita atas; bus samar di samping sapaan; gelombang di
 * tepi bawah (hero berakhir sejajar bagian bawah kartu cari).
 */
export function HeroBackdrop({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <TealBase arcClassName="-left-[38%] -top-[62%] w-[95%] sm:-left-[12%] sm:-top-[150%] sm:w-[55%]" />

      {/* ── Pita atas: pin lokasi → rute putus-putus → tiket ── */}
      <Pin className="absolute left-[4%] top-2 h-7 w-6 text-white/[0.14] sm:left-[3%] sm:top-4 sm:h-9 sm:w-8" />
      {/* SVG absolut tidak melebar mengikuti left/right, jadi dibungkus div yang diposisikan */}
      <div className="absolute left-[calc(4%+20px)] right-[88px] top-[22px] h-9 text-white/[0.15] sm:left-[calc(3%+30px)] sm:right-[150px] sm:top-[34px] sm:h-12">
        <svg className="h-full w-full" viewBox="0 0 400 40" preserveAspectRatio="none" fill="none">
          <path
            d="M0 10 C 80 -2, 150 2, 210 18 S 330 42, 400 26"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="7 7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <Ticket className="absolute right-3 top-2 h-[42px] w-[68px] rotate-[-14deg] text-white/[0.12] sm:right-[4%] sm:top-5 sm:h-[62px] sm:w-[100px]" />

      {/* ── Pita bawah: gelombang abstrak berlapis ── */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[86px] w-full sm:h-[120px]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 52 C 260 22, 520 30, 760 54 S 1220 92, 1440 40 V120 H0 Z" fill="white" fillOpacity={0.06} />
        <path d="M0 78 C 300 50, 600 66, 880 82 S 1260 92, 1440 68 V120 H0 Z" fill="white" fillOpacity={0.07} />
        <path d="M520 120 C 820 70, 1120 64, 1440 86 V120 Z" fill="white" fillOpacity={0.08} />
      </svg>

      {/* Foto bus ada di HeroPhotos (app/(public)/page.tsx), di ruang kanan sapaan. */}
    </div>
  );
}

/** Gradasi dasar CardBus: dark teal (kiri atas) → teal → tosca lembut (kanan bawah) + lengkung terang. */
function TealBase({ arcClassName }: { arcClassName: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(168deg,#065a5a_0%,#077570_28%,#087f78_52%,#0b8f86_80%,#12a093_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_88%_100%,rgba(64,196,180,0.45)_0%,rgba(64,196,180,0)_70%)]" />
      <div className={`absolute aspect-square rounded-full bg-white/[0.045] ${arcClassName}`} />
    </>
  );
}

/**
 * Versi ringkas untuk header teal halaman lain (Akun, Hasil Pencarian): gradasi & lengkung yang sama
 * dengan Hero, rute putus-putus tipis di tepi atas (di atas judul), tiket kecil di kanan, dan gelombang
 * samar di bawah. Tanpa bus (akan tertutup kartu/chip). Dekoratif saja: aria-hidden, tidak bisa diklik.
 *
 * Pakai di dalam elemen `relative isolate overflow-hidden`; komponen ini memakai -z-10 sehingga selalu
 * di belakang konten header tanpa perlu mengubah elemen anaknya.
 */
export function HeaderBackdrop({
  ticketClassName = 'right-4 top-[52px]',
  ticketSizeClassName = 'h-[28px] w-[46px] sm:h-[40px] sm:w-[66px]',
}: {
  /** Posisi tiket: letakkan di area kosong header agar tidak berimpit dengan tombol/chip. */
  ticketClassName?: string;
  ticketSizeClassName?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <TealBase arcClassName="-left-[30%] -top-[120%] w-[80%] sm:-left-[10%] sm:-top-[260%] sm:w-[45%]" />

      {/* Pita atas (tipis, di atas judul): pin → rute putus-putus */}
      <Pin className="absolute left-3 top-0.5 h-[18px] w-[15px] text-white/[0.14] sm:left-5 sm:top-1.5" />
      <div className="absolute left-8 right-24 top-1.5 h-4 text-white/[0.15] sm:left-11 sm:right-40 sm:top-3">
        <svg className="h-full w-full" viewBox="0 0 400 20" preserveAspectRatio="none" fill="none">
          <path
            d="M0 8 C 90 2, 170 4, 240 11 S 350 18, 400 10"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeDasharray="6 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <Ticket className={`absolute rotate-[-14deg] text-white/[0.12] ${ticketSizeClassName} ${ticketClassName}`} />

      {/* Gelombang samar di tepi bawah */}
      <svg className="absolute inset-x-0 bottom-0 h-12 w-full sm:h-16" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
        <path d="M0 60 C 300 30, 620 40, 900 66 S 1280 96, 1440 54 V120 H0 Z" fill="white" fillOpacity={0.05} />
        <path d="M480 120 C 800 76, 1120 70, 1440 92 V120 Z" fill="white" fillOpacity={0.06} />
      </svg>
    </div>
  );
}

/** Pin lokasi dengan bayangan elips di bawahnya. */
function Pin({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 30" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 0C6.2 0 2 4.3 2 9.8 2 16.6 12 25 12 25s10-8.4 10-15.2C22 4.3 17.8 0 12 0Zm0 6.2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"
      />
      <ellipse cx="12" cy="28" rx="5" ry="1.6" />
    </svg>
  );
}

/** Tiket dengan sobekan setengah lingkaran di sisi dan ikon bus tampak depan (bolong). */
function Ticket({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 62" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8 0h84a8 8 0 0 1 8 8v15a8 8 0 0 0 0 16v15a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V39a8 8 0 0 0 0-16V8a8 8 0 0 1 8-8Z
           M38 14h24a5 5 0 0 1 5 5v22a3 3 0 0 1-3 3h-1v4a2 2 0 0 1-4 0v-4H41v4a2 2 0 0 1-4 0v-4h-1a3 3 0 0 1-3-3V19a5 5 0 0 1 5-5Z
           M38 19v10h24V19H38Zm2 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm20 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
      />
    </svg>
  );
}

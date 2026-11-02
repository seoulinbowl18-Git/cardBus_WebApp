const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export const formatRupiah = (n: number) => rupiah.format(n);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(
    new Date(iso.length === 10 ? `${iso}T00:00:00+07:00` : iso),
  );

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}j ${m}m` : `${h}j`;
};

/** Tanggal + jam dalam WIB, mis. "2 November 2026, 10.25 WIB" (tidak bergantung zona waktu perangkat). */
export const formatDateTimeWib = (iso: string) =>
  `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(iso))} WIB`;

/** Tanggal hari ini (WIB) dalam format YYYY-MM-DD. */
export const todayWib = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Tambah n hari ke tanggal "YYYY-MM-DD" (aritmetika UTC, aman dari zona waktu perangkat). */
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

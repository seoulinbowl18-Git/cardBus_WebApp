# CardBus Web App

Versi web CardBus (Next.js App Router + TypeScript + Tailwind CSS). Memakai **backend API yang sama**
dengan aplikasi mobile Flutter (`cardbus_backend`, Express + PostgreSQL Supabase, di Railway).

Dulu berada di folder `webapp/` repo `cardbus_app`; sejak November 2026 dipisah ke repo ini
(riwayat commit ikut dipindahkan).

## Menjalankan

```bash
git clone https://github.com/seoulinbowl18-Git/cardBus_WebApp.git
cd cardBus_WebApp
cp .env.example .env.local   # sesuaikan NEXT_PUBLIC_API_BASE_URL bila perlu
npm install
npm run dev                  # http://localhost:3000
```

Skrip lain: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Koneksi ke backend

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://cardbusbackend-production.up.railway.app` | Sama dengan `ApiService.defaultBaseUrl` di mobile. Backend lokal: `http://localhost:4000` |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `15000` | Batas waktu request |
| `NEXT_PUBLIC_PAYMENT_POLL_MS` | `5000` | Interval cek status pembayaran |
| `NEXT_PUBLIC_CS_WHATSAPP` | – | Nomor WhatsApp CS |
| `NEXT_PUBLIC_FIREBASE_*` | project `cardbus-d6aa5` | Login Google (lihat di bawah) |

Browser memanggil backend **langsung** (bukan lewat proxy Next.js) agar rate limit per IP di backend
(mis. kirim OTP 5x / 10 menit) tetap dihitung per pengguna. Karena itu **origin web app harus
didaftarkan di `CORS_ORIGINS` backend** (Railway → Variables), dipisah koma, contoh:

```
CORS_ORIGINS=https://cardbus.id,https://www.cardbus.id,http://localhost:3000
```

Tanpa ini, request dari browser akan ditolak CORS (halaman `/cari` tetap jalan karena di-render di server).

## Login Google (Firebase)

Memakai project Firebase yang sama dengan mobile (`cardbus-d6aa5`). Alurnya: pop-up pilih akun Google →
Firebase ID token → `POST /api/auth/google` → JWT backend (backend tidak perlu diubah).

1. ✅ Aplikasi Web **cardBus Web** sudah terdaftar di Firebase; `apiKey` & `appId`-nya menjadi default
   di `src/lib/firebase.ts` (nilai publik, aman ikut ke browser). Env `NEXT_PUBLIC_FIREBASE_*` bisa menimpanya.
2. ✅ Authentication → Sign-in method: **Google** aktif.
3. ⏳ Authentication → Settings → **Authorized domains**: tambahkan domain web setelah deploy
   (mis. `cardbus-webapp-production.up.railway.app`). `localhost` sudah diizinkan secara default.

Di Docker/Railway semua `NEXT_PUBLIC_*` dideklarasikan sebagai build arg di `Dockerfile`, jadi variabel
service Railway ikut terbawa saat build.

## Foto, fasilitas, dan denah kursi

`GET /api/trips` mengirim `image`, `logo` (URL dari `/images/...` di backend), `facilities`, dan
`tiers[].seats` (denah lengkap). Denah di web disusun sama dengan `SeatMap` mobile: A–B kiri lorong,
C ke atas kanan, kode lain (mis. K1) di atas; kursi terisi tampil abu-abu.
Data baru masuk ke database dengan menjalankan `npm run seed` di backend (upsert, aman diulang).

## Admin Pusat (`/admin`)

Panel pemilik CardBus, terpisah dari tampilan penumpang: layout, menu, dan sesi sendiri
(token di `localStorage` kunci `cardbus.admin.token`, klien API terpisah di `lib/api/admin.ts`).

| Halaman | Isi |
| --- | --- |
| `/admin/masuk` | Login OTP WhatsApp khusus admin (`verify-otp` dengan `scope: "admin"`) |
| `/admin` | Ringkasan: omzet, tiket, komisi CardBus, diskon voucher, omzet harian, per PO |
| `/admin/jadwal` | Semua jadwal + filter PO/status, tayangkan / sembunyikan; spanduk jadwal yang ditandai salah oleh PO |
| `/admin/jadwal/baru`, `/admin/jadwal/:id` | Editor: tab Jadwal, Rute (titik naik/turun, durasi, jam khusus), Harga & Promo |
| `/admin/po` | Mitra PO: level, admin PO, komisi, aktif/nonaktif |
| `/admin/unggulan` | Produk Unggulan: kartu rute favorit di beranda (foto WebP, PO, rute, titik naik, harga & harga coret, label badge, segera hadir, aktif, urutan, hapus) |

**Validasi jadwal oleh PO (Mode Kuota)**: jadwal PO Level 1 yang belum tayang bisa dikirim ke PO lewat panel
**Validasi PO** di editor jadwal (atau status *Kirim ke PO untuk divalidasi*) dengan catatan. PO mengecek di aplikasi
CardBus Mitra: *Sesuai* → jadwal langsung Tayang; *Ada yang salah* → status *Perlu koreksi* dengan bagian yang ditandai
(Jam berangkat, Rute / kelas, Titik naik, Hari jalan, Kuota / nomor kursi, Harga). Bagian itu tampil sebagai tombol
yang membuka tab tempat memperbaikinya (tab diberi titik merah), lalu **Simpan & kirim ulang ke PO**. Percakapan
Admin Pusat ↔ PO tersimpan di jadwal (`reviewThread`). PO harus punya nomor HP admin agar bisa masuk ke aplikasi Mitra.

**Logo & foto**: form Mitra PO punya unggah logo; editor jadwal punya tab **Foto** (sampul kartu jadwal + galeri armada:
tambah banyak sekaligus, keterangan, kategori, urutan, jadikan sampul, hapus). Gambar dikecilkan di browser
(`lib/image.ts`, maks 1600 px, WebP) lalu dikirim ke `POST /api/admin/media`; foto baru langsung tampil di kartu
penumpang. **Hapus** mitra / jadwal memakai dialog konfirmasi (mengetik kode PO, atau `HAPUS` untuk jadwal tayang);
pesanan yang sudah ada tetap tersimpan.

Akses dijaga **backend**: setiap endpoint `/api/admin` memeriksa `users.role = 'admin'` di database.
Guard di web hanya untuk tampilan (mengarahkan ke `/admin/masuk`), dan `/admin` diberi `noindex`.
Akun admin dibuat di database (lihat README backend, bagian Admin Pusat).

**Produk unggulan** di beranda dibaca dari `GET /api/featured` di server (`lib/featured.ts`); beranda diperbarui paling
lama tiap 30 detik. Bila backend tidak bisa dihubungi, beranda memakai daftar cadangan `FEATURED` di
`lib/home-content.ts`; bila admin menonaktifkan semua kartu, bagian itu disembunyikan.

Jadwal berstatus **Tayang** langsung muncul di pencarian penumpang (`GET /api/trips` membaca tabel yang sama);
**Draf** dan jadwal milik PO nonaktif tidak tampil.

## Struktur

```
cardBus_WebApp/
├── next.config.ts          # standalone output, header keamanan, domain gambar
├── .env.example            # variabel lingkungan (salin ke .env.local)
├── Dockerfile              # image produksi (Railway / Docker)
└── src/
    ├── app/                # App Router
    │   ├── layout.tsx      # html/body + font Plus Jakarta Sans
    │   ├── (public)/       # tampilan penumpang (URL tanpa awalan): layout = header, menu bawah, AuthProvider
    │   ├── admin/          # Admin Pusat: masuk, ringkasan, jadwal/[id], po (layout & sesi sendiri)
    │   ├── (public)/page.tsx # beranda: form cari jadwal
    │   ├── cari/           # hasil pencarian (Server Component, GET /api/trips)
    │   ├── checkout/       # pilih varian & kursi, penumpang, kontak, metode bayar
    │   ├── masuk/          # login OTP WhatsApp
    │   ├── pesanan/        # Tiket Saya + detail/pembayaran (polling status)
    │   ├── akun/           # profil, foto, penumpang tersimpan, menu; akun/pembatalan = ketentuan refund
    │   ├── promo/          # Promo & Info
    │   ├── syarat-ketentuan/, kebijakan-privasi/  # teks dari lib/legal.ts (= legal_content.dart mobile)
    ├── components/         # SiteHeader, TripCard, SeatPicker, BusPhoto, FacilityChips, RequireAuth
    ├── lib/
    │   ├── config.ts       # baca env
    │   ├── types.ts        # tipe data sesuai respons backend
    │   ├── format.ts       # Rupiah, tanggal WIB
    │   ├── seats.ts        # susunan denah kursi, validasi kontak
    │   ├── facilities.ts   # label fasilitas
    │   ├── firebase.ts     # login Google (Firebase Web SDK, dimuat dinamis)
    │   └── api/
    │       ├── client.ts   # fetch wrapper: base URL, Bearer JWT, timeout, ApiError
    │       └── endpoints.ts# authApi, userApi, tripApi, orderApi
    └── providers/
        └── auth-provider.tsx # sesi JWT (localStorage) + profil
```

## Endpoint yang dipakai

| Fitur | Endpoint |
| --- | --- |
| Login OTP | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` |
| Login Google | `POST /api/auth/google` (`idToken` Firebase) |
| Profil | `GET/PUT /api/user/profile` |
| Cari jadwal | `GET /api/trips?from&to&date` |
| Buat pesanan + tagihan | `POST /api/payments/create` (halaman `/checkout`) |
| Status / daftar pesanan | `GET /api/orders/:id`, `GET /api/orders` |

## Catatan

- Token disimpan di `localStorage` (sama seperti mobile menyimpan sesi). Untuk keamanan lebih,
  pertimbangkan cookie httpOnly lewat route handler Next.js.
- Backend versi lama (sebelum foto/denah ditambahkan) tetap didukung: tanpa `seats` hanya kursi kosong
  yang tampil, tanpa `image` tampil inisial PO.

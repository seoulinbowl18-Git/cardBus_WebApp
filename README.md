# CardBus Web App

Versi web CardBus (Next.js App Router + TypeScript + Tailwind CSS). Memakai **backend API yang sama**
dengan aplikasi mobile Flutter (`cardbus_backend`, Express + MongoDB, di Railway).

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

## Struktur

```
cardBus_WebApp/
├── next.config.ts          # standalone output, header keamanan, domain gambar
├── .env.example            # variabel lingkungan (salin ke .env.local)
├── Dockerfile              # image produksi (Railway / Docker)
└── src/
    ├── app/                # App Router
    │   ├── layout.tsx      # font Plus Jakarta Sans, header, AuthProvider
    │   ├── page.tsx        # beranda: form cari jadwal
    │   ├── cari/           # hasil pencarian (Server Component, GET /api/trips)
    │   ├── checkout/       # pilih varian & kursi, penumpang, kontak, metode bayar
    │   ├── masuk/          # login OTP WhatsApp
    │   ├── pesanan/        # Tiket Saya + detail/pembayaran (polling status)
    │   └── akun/           # profil
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

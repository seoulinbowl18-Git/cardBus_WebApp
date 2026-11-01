# cardBus Web App

Versi web cardBus (Next.js App Router + TypeScript + Tailwind CSS). Memakai **backend API yang sama**
dengan aplikasi mobile Flutter (`cardbus_backend`, Express + MongoDB, di Railway).

## Menjalankan

```bash
cd webapp
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

Browser memanggil backend **langsung** (bukan lewat proxy Next.js) agar rate limit per IP di backend
(mis. kirim OTP 5x / 10 menit) tetap dihitung per pengguna. Karena itu **origin web app harus
didaftarkan di `CORS_ORIGINS` backend** (Railway → Variables), dipisah koma, contoh:

```
CORS_ORIGINS=https://cardbus.id,https://www.cardbus.id,http://localhost:3000
```

Tanpa ini, request dari browser akan ditolak CORS (halaman `/cari` tetap jalan karena di-render di server).

## Struktur

```
webapp/
├── next.config.ts          # standalone output, header keamanan, domain gambar
├── .env.example            # variabel lingkungan (salin ke .env.local)
├── Dockerfile              # image produksi (Railway / Docker)
└── src/
    ├── app/                # App Router
    │   ├── layout.tsx      # font Plus Jakarta Sans, header, AuthProvider
    │   ├── page.tsx        # beranda: form cari jadwal
    │   ├── cari/           # hasil pencarian (Server Component, GET /api/trips)
    │   ├── masuk/          # login OTP WhatsApp
    │   ├── pesanan/        # Tiket Saya + detail/pembayaran (polling status)
    │   └── akun/           # profil
    ├── components/         # SiteHeader, TripCard, RequireAuth
    ├── lib/
    │   ├── config.ts       # baca env
    │   ├── types.ts        # tipe data sesuai respons backend
    │   ├── format.ts       # Rupiah, tanggal WIB
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
| Login Google | `POST /api/auth/google` (`idToken` Firebase) — UI belum dibuat |
| Profil | `GET/PUT /api/user/profile` |
| Cari jadwal | `GET /api/trips?from&to&date` |
| Buat pesanan + tagihan | `POST /api/payments/create` — UI checkout belum dibuat |
| Status / daftar pesanan | `GET /api/orders/:id`, `GET /api/orders` |

## Belum dikerjakan (langkah berikutnya)

- Halaman checkout: pilih varian & kursi, data penumpang, kontak, metode bayar → `orderApi.create`.
- Login Google: pasang Firebase Web SDK (project `cardbus-d6aa5`), kirim ID token ke `authApi.google`.
- Foto, fasilitas, dan denah kursi bus masih berasal dari data lokal di mobile (`MockData`), belum ada di API.
- Token disimpan di `localStorage` (sama seperti mobile menyimpan sesi). Untuk keamanan lebih,
  pertimbangkan cookie httpOnly lewat route handler Next.js.

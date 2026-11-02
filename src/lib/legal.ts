// Isi Syarat & Ketentuan dan Kebijakan Privasi CardBus, disalin dari aplikasi mobile
// (lib/data/legal_content.dart). Draf awal — sebaiknya ditinjau konsultan hukum sebelum rilis resmi.
// Ubah teks di sini DAN di aplikasi mobile agar keduanya tetap sama.

import { CS } from './cs';

export interface LegalSection {
  title: string;
  points: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const contact = `WhatsApp CS ${CS.whatsappLabel}, telepon ${CS.phoneLabel}, atau email ${CS.email}`;

/** Inti kebijakan pembatalan; dipakai juga di halaman Tiket Cancel & Pengembalian Dana. */
export const CANCELLATION_POLICY = [
  'Tiket yang sudah dibayar dapat dibatalkan dengan menghubungi CS CardBus sebelum jam keberangkatan yang tertera di e-tiket.',
  'Harga tiket TIDAK dipotong. Dana dikembalikan penuh, hanya dikurangi biaya transfer bank dan biaya admin payment gateway yang sudah dibayarkan saat transaksi.',
  'Pengembalian dana dikirim ke rekening atau e-wallet atas nama pemesan sesuai data yang diberikan ke CS.',
  'Tiket yang sudah lewat jam keberangkatan, atau penumpang yang sudah naik bus, tidak dapat dibatalkan.',
  'Jika perjalanan dibatalkan oleh PO bus, dana dikembalikan penuh termasuk biaya transfer dan biaya admin.',
];

export const TERMS: LegalDocument = {
  title: 'Syarat & Ketentuan',
  updated: '29 Oktober 2026',
  intro:
    'Dengan mendaftar atau memakai aplikasi maupun situs web CardBus, kamu menyetujui syarat & ketentuan berikut. ' +
    'CardBus adalah platform pemesanan tiket bus yang bekerja sama dengan PO (Perusahaan Otobus) mitra.',
  sections: [
    {
      title: '1. Akun',
      points: [
        'Kamu mendaftar dan masuk memakai nomor WhatsApp (kode OTP) atau akun Google.',
        'Kamu bertanggung jawab menjaga kerahasiaan kode OTP dan akses ke akunmu. Jangan berikan kode OTP kepada siapa pun, termasuk yang mengaku dari CardBus.',
        'Data yang kamu isi (nama, nomor ponsel, email, nama penumpang) harus benar dan sesuai identitas.',
      ],
    },
    {
      title: '2. Pemesanan Tiket',
      points: [
        'Jadwal, harga, kelas bus, dan ketersediaan kursi ditentukan oleh PO mitra dan dapat berubah sewaktu-waktu sebelum pembayaran.',
        'Kursi baru menjadi milikmu setelah pembayaran berhasil. Sebelum itu kursi hanya ditahan sampai batas waktu bayar yang tertera.',
        'Nama penumpang di tiket harus sesuai identitas yang dibawa saat naik bus.',
      ],
    },
    {
      title: '3. Pembayaran',
      points: [
        'Pembayaran diproses oleh payment gateway mitra CardBus melalui QRIS atau Virtual Account.',
        'Total yang ditagihkan sudah termasuk harga tiket dan biaya layanan pembayaran yang ditampilkan sebelum kamu membayar.',
        'Pesanan yang tidak dibayar sampai batas waktu akan dibatalkan otomatis dan kursi dilepas.',
      ],
    },
    {
      title: '4. E-tiket & Keberangkatan',
      points: [
        'E-tiket terbit otomatis setelah pembayaran berhasil dan dapat dilihat di menu Tiket Saya.',
        'Tunjukkan e-tiket kepada petugas PO di titik naik. Datanglah paling lambat 30 menit sebelum jam keberangkatan.',
        'Penumpang yang terlambat atau tidak datang (no-show) dianggap sudah memakai tiketnya.',
        'Keselamatan, kenyamanan, bagasi, dan pelaksanaan perjalanan menjadi tanggung jawab PO yang mengoperasikan bus.',
      ],
    },
    { title: '5. Pembatalan & Pengembalian Dana', points: CANCELLATION_POLICY },
    {
      title: '6. Voucher & Ajak Teman',
      points: [
        'Voucher hanya bisa dipakai sesuai ketentuan yang tertera (nominal, minimum pembelian, masa berlaku) dan tidak dapat diuangkan.',
        'Satu pesanan hanya dapat memakai satu voucher. Voucher yang dipakai pada pesanan yang dibatalkan akan dikembalikan bila masih berlaku.',
        'Hadiah Ajak Teman diberikan setelah perjalanan pertama teman yang diundang selesai. CardBus berhak membatalkan hadiah bila ditemukan penyalahgunaan.',
      ],
    },
    {
      title: '7. Larangan',
      points: [
        'Menjual kembali tiket tanpa izin, memakai akun orang lain, atau memberikan data palsu.',
        'Mencoba membobol, mengganggu, atau menyalahgunakan sistem, promo, maupun voucher CardBus.',
      ],
    },
    {
      title: '8. Batas Tanggung Jawab',
      points: [
        'CardBus berperan sebagai perantara pemesanan. Keterlambatan, perubahan jadwal, atau kejadian selama perjalanan menjadi tanggung jawab PO, namun CardBus akan membantu penyelesaiannya.',
        'CardBus tidak bertanggung jawab atas kerugian akibat data yang kamu berikan tidak benar.',
      ],
    },
    {
      title: '9. Perubahan Ketentuan',
      points: [
        'Syarat & ketentuan ini dapat diperbarui. Versi terbaru selalu tersedia di aplikasi dan situs web, dan dengan tetap memakai CardBus kamu dianggap menyetujuinya.',
      ],
    },
    { title: '10. Hubungi Kami', points: [`Pertanyaan atau keluhan dapat disampaikan melalui ${contact}.`] },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Kebijakan Privasi',
  updated: '29 Oktober 2026',
  intro:
    'CardBus menghargai privasimu. Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa, dan bagaimana kami ' +
    'melindunginya, sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
  sections: [
    {
      title: '1. Data yang Kami Kumpulkan',
      points: [
        'Data akun: nama, nomor WhatsApp, email, dan foto profil (bila kamu mengunggahnya). Jika masuk dengan Google, kami menerima nama, email, dan foto dari akun Google-mu.',
        'Data pemesanan: nama penumpang, penumpang tersimpan, jadwal, kursi, titik naik/turun, dan riwayat pesanan.',
        'Data pembayaran: metode pembayaran, nominal, dan status transaksi. Kami tidak menyimpan PIN atau kata sandi bank / e-wallet-mu.',
        'Data teknis: jenis perangkat, versi aplikasi, dan catatan error untuk menjaga aplikasi tetap berjalan baik.',
      ],
    },
    {
      title: '2. Untuk Apa Data Dipakai',
      points: [
        'Memproses pemesanan, menerbitkan e-tiket, dan mengirim kode OTP serta informasi perjalanan.',
        'Memproses pembayaran, pembatalan, dan pengembalian dana.',
        'Memberikan layanan CS, voucher, dan program Ajak Teman.',
        'Mencegah penipuan dan penyalahgunaan, serta meningkatkan layanan.',
      ],
    },
    {
      title: '3. Dengan Siapa Data Dibagikan',
      points: [
        'PO bus mitra: nama penumpang, nomor ponsel, kursi, dan titik naik, agar petugas dapat memverifikasi penumpang.',
        'Payment gateway: data yang diperlukan untuk memproses pembayaran.',
        'Penyedia layanan: pengirim pesan WhatsApp (OTP), Google/Firebase (login), serta penyedia server dan database yang dipakai CardBus.',
        'Pihak berwenang bila diwajibkan oleh hukum.',
        'Kami tidak menjual data pribadimu kepada siapa pun.',
      ],
    },
    {
      title: '4. Penyimpanan & Keamanan',
      points: [
        'Data disimpan di server dengan koneksi terenkripsi (HTTPS). Akses ke data dibatasi hanya untuk keperluan layanan.',
        'Data pesanan disimpan selama diperlukan untuk layanan, pencatatan transaksi, dan kewajiban hukum, lalu dihapus atau dianonimkan.',
      ],
    },
    {
      title: '5. Hak Kamu',
      points: [
        'Melihat dan memperbarui data akun di menu Akun.',
        'Meminta salinan, koreksi, atau penghapusan data dan akunmu melalui CS. Permintaan penghapusan tidak berlaku untuk data transaksi yang wajib disimpan menurut hukum.',
        'Menarik persetujuan pemakaian data tertentu, misalnya notifikasi perjalanan, kapan saja.',
      ],
    },
    {
      title: '6. Anak-anak',
      points: ['Akun CardBus ditujukan untuk pengguna berusia 17 tahun ke atas. Pemesanan untuk anak dilakukan oleh orang tua atau wali.'],
    },
    {
      title: '7. Perubahan Kebijakan',
      points: ['Kebijakan privasi ini dapat diperbarui. Perubahan penting akan kami informasikan melalui aplikasi dan situs web.'],
    },
    { title: '8. Hubungi Kami', points: [`Pertanyaan tentang privasi dan data pribadi dapat disampaikan melalui ${contact}.`] },
  ],
};

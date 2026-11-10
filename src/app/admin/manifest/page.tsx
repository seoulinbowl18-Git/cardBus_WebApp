'use client';

import { ManifestView } from '@/components/admin/manifest-view';
import { PageHead } from '@/components/admin/ui';

/** Manifest penumpang: rekap harian semua jadwal, bisa disaring per PO / jadwal, diunduh (CSV) atau dicetak. */
export default function ManifestPage() {
  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHead title="Manifest Penumpang" sub="Daftar penumpang per tanggal berangkat: kursi & dek, kelas, kontak WhatsApp, dan status tiket." />
      </div>
      <ManifestView />
    </div>
  );
}

import type { ReviewTag } from '@/lib/types';

/** Kategori ulasan, urut tampil (sama dengan backend services/reviews.js & aplikasi mobile). */
export const REVIEW_TAGS: { key: ReviewTag; label: string }[] = [
  { key: 'staf', label: 'Perilaku Staf' },
  { key: 'nilai_uang', label: 'Nilai Uang' },
  { key: 'penjemputan', label: 'Waktu Penjemputan' },
  { key: 'ketepatan', label: 'Ketepatan Waktu' },
  { key: 'kebersihan', label: 'Kebersihan' },
  { key: 'kenyamanan', label: 'Kenyamanan Kursi' },
];

export const reviewTagLabel = (k: string) => REVIEW_TAGS.find((t) => t.key === k)?.label ?? k;

/** Batas backend: maks. 5 foto per ulasan, 2 MB per foto. */
export const MAX_REVIEW_PHOTOS = 5;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SIDE = 1600;

/**
 * Siapkan foto untuk diunggah: diperkecil ke sisi terpanjang 1600 px dan dikompres JPEG agar di bawah 2 MB
 * (foto kamera HP biasanya 3–8 MB). File kecil berformat JPG/PNG/WebP dikirim apa adanya.
 */
export async function prepareReviewPhoto(file: File): Promise<Blob> {
  if (!/^image\//.test(file.type)) throw new Error('File harus berupa foto');
  const okType = /^image\/(jpeg|png|webp)$/.test(file.type);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (okType && file.size <= MAX_BYTES) return file;
    throw new Error('Foto tidak bisa dibaca. Pakai JPG, PNG, atau WebP.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (okType && scale === 1 && file.size <= MAX_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('Foto terlalu besar (maks. 2 MB)');
}

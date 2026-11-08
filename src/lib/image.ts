/**
 * Kecilkan gambar di browser sebelum diunggah (backend menerima maks 2 MB): sisi terpanjang dibatasi,
 * lalu disimpan sebagai WebP. Browser yang tidak bisa membuat WebP memakai PNG (logo, agar latar transparan
 * tetap) atau JPEG (foto).
 */
const MAX_UPLOAD = 1.9 * 1024 * 1024;

export class ImageError extends Error {}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('File ini bukan gambar yang bisa dibuka browser. Pakai JPG, PNG, atau WebP.'));
    };
    img.src = url;
  });
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function compressImage(file: File, kind: 'logo' | 'photo'): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new ImageError('Pilih file gambar (JPG, PNG, atau WebP).');
  if (file.size > 25 * 1024 * 1024) throw new ImageError('Gambar terlalu besar (maks 25 MB sebelum dikecilkan).');
  const img = await load(file);
  let side = kind === 'logo' ? 512 : 1600;
  for (const quality of [0.85, 0.75, 0.65]) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('Browser tidak bisa mengolah gambar.');
    if (kind === 'photo') {
      ctx.fillStyle = '#ffffff'; // JPEG tanpa transparansi: latar putih, bukan hitam
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let blob = await toBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, kind === 'logo' ? 'image/png' : 'image/jpeg', quality);
    if (blob && blob.size <= MAX_UPLOAD) return blob;
    side = Math.round(side * 0.75);
  }
  throw new ImageError('Gambar tetap terlalu besar setelah dikecilkan. Coba gambar lain.');
}

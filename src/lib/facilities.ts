/** Label fasilitas bus (kode dari backend, sama dengan aplikasi mobile). */
const LABELS: Record<string, { label: string; icon: string }> = {
  ac: { label: 'AC', icon: '❄️' },
  toilet: { label: 'Toilet', icon: '🚻' },
  selimut: { label: 'Selimut', icon: '🛏️' },
  usb: { label: 'USB charger', icon: '🔌' },
  legrest: { label: 'Leg rest', icon: '🦵' },
  makan: { label: 'Makan', icon: '🍱' },
  tv: { label: 'TV', icon: '📺' },
  kompartemen: { label: 'Kompartemen', icon: '🚪' },
};

export const facilityInfo = (code: string) => LABELS[code] ?? { label: code, icon: '•' };

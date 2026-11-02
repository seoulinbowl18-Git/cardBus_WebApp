import { config } from './config';

/**
 * Kontak CS CardBus, sama dengan CsHelpSheet & RefundHistoryScreen di aplikasi mobile.
 * Nomor WhatsApp bisa ditimpa lewat NEXT_PUBLIC_CS_WHATSAPP (format 62xxx).
 */
export const CS = {
  whatsapp: config.csWhatsapp || '6281992690305',
  whatsappLabel: '+62 819-9269-0305',
  phone: '0271624975',
  phoneLabel: '(0271) 624975',
  email: 'yanaluxsi01@gmail.com',
};

export const csWhatsappUrl = (text = 'Halo CS CardBus, saya butuh bantuan terkait pesanan/refund') =>
  `https://wa.me/${CS.whatsapp}?text=${encodeURIComponent(text)}`;

export const csPhoneUrl = `tel:${CS.phone}`;
export const csEmailUrl = `mailto:${CS.email}?subject=${encodeURIComponent('Bantuan CardBus')}`;

/** Ikon garis sederhana (gaya Material Rounded seperti di aplikasi mobile). */
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5',
  ticket: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Zm10-2v12',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zm9 0v13M12 7S10.5 3 8 3.5 7 7 12 7Zm0 0s1.5-4 4-3.5S17 7 12 7Z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  support: 'M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2Zm-3 4c0 2-2 3-5 3',
  call: 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  mail: 'M4 6h16v12H4zm0 0 8 7 8-7',
  chevron: 'm9 6 6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  share: 'M16 8a3 3 0 1 0-3-3M8 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5-9.5 3-1.5m-3 4.5 3 1.5',
  voucher: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Zm6 0v10',
  refund: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4m4-1v10m-2.5-2.5c.5.8 1.4 1.3 2.5 1.3 1.4 0 2.5-.8 2.5-2s-1-1.6-2.5-2-2.5-.8-2.5-2 1.1-2 2.5-2c1 0 1.9.5 2.4 1.2',
  doc: 'M7 3h7l4 4v14H7zm7 0v4h4M10 12h5m-5 4h5',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Zm-3.5 9 2.5 2.5 4.5-5',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4m-4 4h10',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13',
  verified: 'm8.5 12 2.5 2.5 4.5-5M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

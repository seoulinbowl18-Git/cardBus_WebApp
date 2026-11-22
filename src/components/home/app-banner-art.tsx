/**
 * Ilustrasi Banner Aplikasi CardBus (SVG murni, tanpa file gambar): bus CardBus tampak 3/4 (perspektif
 * dua titik hilang, sama dengan gaya hero) melaju di jalan pesisir dengan latar pegunungan berlapis,
 * laut, awan, dan pepohonan. Kedua sisi memudar (mask) agar menyatu dengan gradasi banner. aria-hidden.
 */

// Marka jalan putus-putus berperspektif: dari depan (kiri bawah) mengecil ke cakrawala (kanan).
const P0 = { x: 120, y: 470 }; // titik dekat
const P1 = { x: 640, y: 252 }; // titik cakrawala
const DASHES = [0, 0.2, 0.37, 0.51, 0.63, 0.73, 0.81, 0.875, 0.925].map((t, i, arr) => {
  const next = arr[i + 1] ?? 0.96;
  const len = (next - t) * 0.55; // panjang garis = sebagian jarak ke garis berikutnya
  const w = 7 * (1 - t) + 1.2; // tebal mengecil menjauh
  const a = { x: P0.x + (P1.x - P0.x) * t, y: P0.y + (P1.y - P0.y) * t };
  const b = { x: P0.x + (P1.x - P0.x) * (t + len), y: P0.y + (P1.y - P0.y) * (t + len) };
  return { a, b, w };
});

const BASE = 252; // garis cakrawala (pesisir)

/*
 * Geometri bus berperspektif. Sisi kiri bus (u: 0 = belakang, 1 = depan; v: 0 = atap, 1 = bawah bodi)
 * menyempit ke titik hilang di kiri; muka depan menyempit ke titik hilang di kanan.
 */
const FRONT_X = 640;
const REAR_X = 330;
const NOSE_X = 712;
const TOP_F = 190; // atap di sudut depan
const BOT_F = 317; // bawah bodi di sudut depan
const VPL = { x: -700, y: 255 }; // titik hilang sisi
const VPR = { x: 1500, y: 255 }; // titik hilang muka depan
const lineY = (x: number, y0: number, vp: { x: number; y: number }) => y0 + ((vp.y - y0) / (vp.x - FRONT_X)) * (x - FRONT_X);
const sideX = (u: number) => REAR_X + (FRONT_X - REAR_X) * u;
/** Titik di sisi bus untuk koordinat (u, v). */
const S = (u: number, v: number) => {
  const x = sideX(u);
  const top = lineY(x, TOP_F, VPL);
  const bot = lineY(x, BOT_F, VPL);
  return { x, y: top + (bot - top) * v };
};
const pt = (p: { x: number; y: number }) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
/** Segi empat di sisi bus: u0..u1 × v0..v1. */
const quad = (u0: number, u1: number, v0: number, v1: number) =>
  `M${pt(S(u0, v0))} L${pt(S(u1, v0))} L${pt(S(u1, v1))} L${pt(S(u0, v1))} Z`;
/** Pita bergelombang di sisi bus antara kurva atas & bawah (fungsi v terhadap u). */
const band = (vt: (u: number) => number, vb: (u: number) => number, u0 = 0, u1 = 1) => {
  const n = 28;
  const us = Array.from({ length: n + 1 }, (_, i) => u0 + ((u1 - u0) * i) / n);
  return `M${us.map((u) => pt(S(u, vt(u)))).join(' L')} L${[...us].reverse().map((u) => pt(S(u, vb(u)))).join(' L')} Z`;
};
const frontTop = (x: number) => lineY(x, TOP_F, VPR);
const frontBot = (x: number) => lineY(x, BOT_F, VPR);
/** Titik di muka depan: w 0 = sudut sisi, 1 = ujung depan; v seperti sisi. */
const F = (w: number, v: number) => {
  const x = FRONT_X + (NOSE_X - FRONT_X) * w;
  const top = frontTop(x);
  const bot = frontBot(x);
  return { x, y: top + (bot - top) * v };
};
const fquad = (w0: number, w1: number, v0: number, v1: number) =>
  `M${pt(F(w0, v0))} L${pt(F(w1, v0))} L${pt(F(w1, v1))} L${pt(F(w0, v1))} Z`;
// Livery: sapuan teal bergelombang, garis emas di bawahnya
const tealTop = (u: number) => 0.7 - 0.07 * Math.sin(u * Math.PI * 1.6 + 0.4);
const tealBot = (u: number) => 0.86 - 0.04 * Math.sin(u * Math.PI * 1.6 + 1.2);
const goldBot = (u: number) => tealBot(u) + 0.055;
// Roda: posisi u (dua as belakang, satu as depan)
const WHEELS = [0.14, 0.29, 0.84].map((u) => {
  const p = S(u, 1);
  const h = S(u, 1).y - S(u, 0).y;
  return { cx: p.x, cy: p.y - 1, r: (h / (BOT_F - TOP_F)) * 20 };
});

export function AppBannerArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 460" fill="none" aria-hidden preserveAspectRatio="xMaxYMax meet">
      <defs>
        {/* Pudar ke kiri agar menyatu dengan banner */}
        <linearGradient id="ab-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="ab-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="460">
          <rect width="800" height="460" fill="url(#ab-fade)" />
        </mask>

        <radialGradient id="ab-sky" cx="640" cy="230" r="330" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#effcf9" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#bfece4" stopOpacity="0.45" />
          <stop offset="1" stopColor="#bfece4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ab-sun" cx="720" cy="236" r="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe3a0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ab-tree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fb183" />
          <stop offset="1" stopColor="#1d7a57" />
        </linearGradient>
        <linearGradient id="ab-road" x1="0" y1={BASE} x2="0" y2="460" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7b8e92" />
          <stop offset="0.35" stopColor="#56676b" />
          <stop offset="1" stopColor="#323f43" />
        </linearGradient>
        <linearGradient id="ab-body" x1="0" y1="100" x2="0" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f8f8" />
          <stop offset="1" stopColor="#d7e3e3" />
        </linearGradient>
        <linearGradient id="ab-front" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eef4f4" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="ab-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b5d66" />
          <stop offset="0.5" stopColor="#1d3840" />
          <stop offset="1" stopColor="#10232a" />
        </linearGradient>
        <linearGradient id="ab-teal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a9a90" />
          <stop offset="1" stopColor="#065f5b" />
        </linearGradient>
        <linearGradient id="ab-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd56a" />
          <stop offset="1" stopColor="#f2a900" />
        </linearGradient>
        <linearGradient id="ab-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="ab-rim" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#e6eeee" />
          <stop offset="1" stopColor="#8a9c9c" />
        </radialGradient>
        <radialGradient id="ab-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="0.5" stopColor="#ffe9a8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
        <filter id="ab-blur-s" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id="ab-blur-m" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <g mask="url(#ab-mask)">
        {/* Langit & cahaya matahari di cakrawala */}
        <rect x="160" y="0" width="640" height="300" fill="url(#ab-sky)" />
        <rect x="560" y="120" width="240" height="180" fill="url(#ab-sun)" />

        {/* Pegunungan berlapis (jauh pudar → dekat lebih pekat) */}
        <path d="M160 252 L250 178 L310 206 L390 132 L470 196 L540 150 L630 214 L700 170 L800 222 V252 Z" fill="#cdeee8" opacity="0.55" filter="url(#ab-blur-s)" />
        <path d="M200 252 L290 200 L350 222 L430 176 L520 226 L600 190 L690 234 L800 206 V252 Z" fill="#7fc9bb" opacity="0.7" />
        {/* Laut di kiri jalan */}
        <path d="M120 252 H470 L420 268 H120 Z" fill="#5cc6c0" opacity="0.65" />
        <path d="M150 258 H300 M200 263 H380" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" />
        {/* Awan lembut */}
        <g fill="#ffffff" opacity="0.75" filter="url(#ab-blur-s)">
          <ellipse cx="380" cy="92" rx="46" ry="14" />
          <ellipse cx="410" cy="82" rx="28" ry="14" />
          <ellipse cx="610" cy="70" rx="38" ry="11" />
        </g>
        {/* Pepohonan pesisir */}
        <g fill="url(#ab-tree)">
          <circle cx="470" cy="244" r="16" />
          <circle cx="498" cy="238" r="20" />
          <circle cx="528" cy="246" r="13" />
          <circle cx="742" cy="238" r="18" />
          <circle cx="772" cy="232" r="22" />
          <circle cx="798" cy="242" r="15" />
        </g>
        <rect x="440" y="248" width="360" height="8" fill="#1e7c58" opacity="0.9" />
        {/* Pagar pembatas jalan */}
        <path d="M-140 450 L436 256" stroke="#d9e5e5" strokeWidth="3" />
        <g stroke="#b9c9c9" strokeWidth="2">
          {[0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((t) => {
            const x = -140 + (436 + 140) * t;
            const y = 450 + (256 - 450) * t;
            return <path key={t} d={`M${x} ${y} v${(10 * (1 - t) + 3).toFixed(1)}`} />;
          })}
        </g>

        {/* Jalan berperspektif */}
        <path d="M-220 460 L800 460 L800 250 L430 254 Z" fill="url(#ab-road)" />
        {/* Bahu jalan kiri */}
        <path d="M-220 460 L430 254" stroke="#e8f1f1" strokeOpacity="0.65" strokeWidth="2.5" />
        <path d="M-196 460 L438 255" stroke="#ffc247" strokeOpacity="0.55" strokeWidth="1.5" />
        {/* Marka tengah */}
        <g fill="#ffffff" fillOpacity="0.92">
          {DASHES.map(({ a, b, w }, i) => {
            // segi empat tipis tegak lurus arah jalan
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const L = Math.hypot(dx, dy) || 1;
            const nx = (-dy / L) * (w / 2);
            const ny = (dx / L) * (w / 2);
            return (
              <path
                key={i}
                d={`M${a.x + nx} ${a.y + ny} L${b.x + nx} ${b.y + ny} L${b.x - nx} ${b.y - ny} L${a.x - nx} ${a.y - ny} Z`}
              />
            );
          })}
        </g>
        {/* Jejak cahaya keemasan (kesan bergerak) */}
        <path d="M60 452 C 260 360, 470 300, 690 262" stroke="#ffd56a" strokeOpacity="0.55" strokeWidth="3" filter="url(#ab-blur-s)" />
        <path d="M120 458 C 300 380, 500 318, 720 270" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" filter="url(#ab-blur-s)" />

      </g>

      {/* ===== Bus CardBus (tidak ikut dipudarkan) ===== */}
      {/* Bayangan lembut di jalan */}
      <path
        d={`M${pt({ x: REAR_X - 14, y: S(0, 1).y + 4 })} L${pt({ x: FRONT_X, y: BOT_F + 10 })} L${pt({ x: NOSE_X + 26, y: frontBot(NOSE_X) + 6 })} L${pt({ x: NOSE_X - 30, y: S(0.2, 1).y - 6 })} Z`}
        fill="#06181b"
        opacity="0.5"
        filter="url(#ab-blur-m)"
      />

      {/* Sisi bus */}
      <path d={quad(0, 1, 0, 1)} fill="url(#ab-body)" />
      {/* Rok bawah lebih gelap & kilau memanjang di badan atas */}
      <path d={quad(0, 1, 0.9, 1)} fill="#c3d2d2" />
      <path d={band(() => 0.45, () => 0.5, 0.02, 0.98)} fill="url(#ab-shine)" opacity="0.8" />
      {/* Lampu belakang */}
      <path d={quad(0, 0.016, 0.68, 0.86)} fill="#e5484d" />
      <path d={`M${pt(S(0, 0))} L${pt(S(1, 0))}`} stroke="#ffffff" strokeWidth="2" />
      <path d={`M${pt(S(0.01, 0.025))} L${pt(S(1, 0.025))}`} stroke="#ffd56a" strokeOpacity="0.55" strokeWidth="1" />
      {/* Pita jendela + tiang */}
      <path d={quad(0.03, 0.86, 0.09, 0.42)} fill="url(#ab-glass)" />
      <g stroke="#eef4f4" strokeWidth="3">
        {[0.2, 0.37, 0.53, 0.69].map((u) => (
          <path key={u} d={`M${pt(S(u, 0.09))} L${pt(S(u, 0.42))}`} />
        ))}
      </g>
      {/* Pantulan kaca */}
      <g fill="#ffffff" opacity="0.14">
        {[0.06, 0.4, 0.72].map((u) => (
          <path key={u} d={`M${pt(S(u, 0.4))} L${pt(S(u + 0.06, 0.11))} L${pt(S(u + 0.1, 0.11))} L${pt(S(u + 0.04, 0.4))} Z`} />
        ))}
      </g>
      {/* Pintu depan */}
      <path d={quad(0.885, 0.975, 0.09, 0.88)} fill="url(#ab-glass)" />
      <path d={`M${pt(S(0.9, 0.35))} L${pt(S(0.96, 0.14))}`} stroke="#ffffff" strokeOpacity="0.18" strokeWidth="4" />
      {/* Livery teal–emas */}
      <path d={band(tealTop, tealBot, 0, 0.88)} fill="url(#ab-teal)" />
      <path d={band(tealBot, goldBot, 0, 0.88)} fill="url(#ab-gold)" />
      <path d={band((u) => tealTop(u) - 0.035, (u) => tealTop(u) - 0.015, 0, 0.6)} fill="#8fe0d4" opacity="0.7" />
      {/* Logo & tulisan CardBus (mengikuti kemiringan sisi) */}
      {(() => {
        const o = S(0.2, 0.62);
        const h = S(0.2, 1).y - S(0.2, 0).y;
        const k = h / (BOT_F - TOP_F);
        const slope = (S(0.5, 0.62).y - o.y) / (S(0.5, 0.62).x - o.x);
        return (
          <g transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) skewY(${((Math.atan(slope) * 180) / Math.PI).toFixed(2)}) scale(${k.toFixed(3)})`}>
            <rect x="0" y="-19" width="20" height="20" rx="5" fill="#087f78" />
            <path d="M4.5 -13h11v7h-11z" fill="#ffffff" />
            <path d="M6 -3h2M12 -3h2" stroke="#ffffff" strokeWidth="2" />
            <text
              x="26"
              y="0"
              fill="#087f78"
              fontSize="22"
              fontWeight="800"
              letterSpacing="-0.3"
              style={{ fontFamily: 'var(--font-jakarta), ui-sans-serif, system-ui, sans-serif' }}
            >
              Card<tspan fill="#0b5f5b">Bus</tspan>
            </text>
          </g>
        );
      })()}
      {/* Garis bawah bodi */}
      <path d={`M${pt(S(0, 0.97))} L${pt(S(1, 0.97))}`} stroke="#9fb1b1" strokeWidth="2" />
      {/* Lekuk roda */}
      {WHEELS.map(({ cx, cy, r }) => (
        <path key={`a${cx}`} d={`M${(cx - r * 1.2).toFixed(1)} ${cy.toFixed(1)} a${(r * 1.2).toFixed(1)} ${(r * 1.25).toFixed(1)} 0 0 1 ${(r * 2.4).toFixed(1)} 0 Z`} fill="#1a2b2f" />
      ))}

      {/* Muka depan */}
      {(() => {
        const a = F(0, 0), b = F(1, 0), c = F(1, 1), d = F(0, 1);
        // sudut atap depan dibulatkan
        return (
          <path
            d={`M${pt(a)} L${pt({ x: b.x - 9, y: b.y - 0.6 })} Q${pt(b)} ${pt({ x: b.x, y: b.y + 9 })} L${pt(c)} L${pt(d)} Z`}
            fill="url(#ab-front)"
          />
        );
      })()}
      <path d={`M${pt(F(0, 0))} L${pt(F(0, 1))}`} stroke="#c9d8d8" strokeWidth="1.5" />
      <path d={`M${pt(F(0, 0))} L${pt({ x: F(1, 0).x - 9, y: F(1, 0).y - 0.6 })}`} stroke="#ffffff" strokeWidth="2" />
      {/* Kaca depan besar + pantulan */}
      <path d={fquad(0.06, 0.95, 0.06, 0.5)} fill="url(#ab-glass)" />
      <path d={`M${pt(F(0.15, 0.48))} L${pt(F(0.38, 0.08))} L${pt(F(0.52, 0.08))} L${pt(F(0.29, 0.48))} Z`} fill="#ffffff" opacity="0.16" />
      {/* Livery depan */}
      <path d={fquad(0, 1, 0.62, 0.74)} fill="url(#ab-teal)" />
      <path d={fquad(0, 1, 0.74, 0.79)} fill="url(#ab-gold)" />
      {/* Logo depan */}
      <path d={fquad(0.4, 0.6, 0.55, 0.6)} fill="#ffffff" />
      {/* Lampu depan menyala */}
      <circle cx={F(0.86, 0.86).x} cy={F(0.86, 0.86).y} r="15" fill="url(#ab-lamp)" />
      <path d={fquad(0.74, 0.97, 0.83, 0.89)} fill="#fffbe8" />
      <path d={fquad(0.05, 0.2, 0.83, 0.89)} fill="#fff4cc" />
      {/* Bemper */}
      <path d={fquad(0, 1, 0.93, 1)} fill="#9db0b0" />
      {/* Spion */}
      <path d={`M${pt(F(0.96, 0.05))} c 10 -1 14 5 14 18 h -4 c 0 -9 -2 -13 -10 -13 Z`} fill="#15292f" />
      <path d={`M${(F(1, 0).x + 10).toFixed(1)} ${(F(1, 0).y + 22).toFixed(1)} h4 v14 h-4 Z`} fill="#15292f" />

      {/* Roda */}
      {WHEELS.map(({ cx, cy, r }) => (
        <g key={cx}>
          <ellipse cx={cx} cy={cy} rx={r * 0.86} ry={r} fill="#121d20" />
          <ellipse cx={cx + 1} cy={cy} rx={r * 0.46} ry={r * 0.55} fill="url(#ab-rim)" />
          <ellipse cx={cx + 1} cy={cy} rx={r * 0.17} ry={r * 0.2} fill="#5b6c6c" />
        </g>
      ))}
    </svg>
  );
}

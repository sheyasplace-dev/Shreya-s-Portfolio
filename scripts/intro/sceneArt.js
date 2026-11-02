import { f, ruffle, seeded, wobblyRect } from '../lib/handDrawn.js';

// The drawn parts of the desktop scene, in the original banner's language: flat folk colour, inked outlines.
const INK = '#1a0606';
const GOLD = '#ffb21c';
const ORANGE = '#ff6f17';
const CREAM = '#fff1df';

// ── The banner's own hand-inked border (drawn in the banner's 3168 × 1344 units) ──
export function bannerFrame({ width, height }) {
  return `<svg class="banner__frame" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${wobblyRect(47, 47, width - 94, height - 94, 3, 5, 60)}" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
  </svg>`;
}

// ── Gold lotus-mandala flourish tucked into the bottom-right of the red band, as in the original ──
function scallops(cx, cy, r, from, to, n) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) { d += `M${f(x)} ${f(y)}`; continue; }
    const chord = 2 * r * Math.sin(Math.abs(to - from) / n / 2);
    d += `A${f(chord / 2)} ${f(chord / 2)} 0 0 1 ${f(x)} ${f(y)}`;
  }
  return d;
}

export function bannerFlourish() {
  const cx = 600, cy = 600;
  const petals = [];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (Math.PI / 2) * ((i + 0.5) / 7);
    const tip = [cx + Math.cos(a) * 285, cy + Math.sin(a) * 285];
    const l = [cx + Math.cos(a - 0.17) * 190, cy + Math.sin(a - 0.17) * 190];
    const r = [cx + Math.cos(a + 0.17) * 190, cy + Math.sin(a + 0.17) * 190];
    const base = [cx + Math.cos(a) * 160, cy + Math.sin(a) * 160];
    petals.push(`<path d="M${f(base[0])} ${f(base[1])}Q${f(l[0])} ${f(l[1])} ${f(tip[0])} ${f(tip[1])}Q${f(r[0])} ${f(r[1])} ${f(base[0])} ${f(base[1])}Z"/>`);
  }
  const dots = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (Math.PI / 2) * ((i + 0.5) / 9);
    dots.push(`<circle cx="${f(cx + Math.cos(a) * 470)}" cy="${f(cy + Math.sin(a) * 470)}" r="13"/>`);
  }
  return `<svg class="banner__flourish" viewBox="0 0 600 600" aria-hidden="true">
    <g fill="none" stroke="${GOLD}" stroke-width="11" stroke-linecap="round">
      <path d="${scallops(cx, cy, 130, Math.PI, Math.PI * 1.5, 4)}"/>
      <path d="${scallops(cx, cy, 340, Math.PI, Math.PI * 1.5, 7)}"/>
      <path d="${scallops(cx, cy, 410, Math.PI, Math.PI * 1.5, 9)}" opacity=".85"/>
    </g>
    <g fill="${ORANGE}" stroke="${GOLD}" stroke-width="10" stroke-linejoin="round">${petals.join('')}</g>
    <g fill="${GOLD}">${dots.join('')}</g>
  </svg>`;
}

// ── Coins, drawn like the ones in the original: gold, thick, inked ──
export const COIN = `<svg viewBox="0 0 40 30" aria-hidden="true">
  <ellipse cx="20" cy="17" rx="17" ry="11" fill="#d98a00" stroke="${INK}" stroke-width="2.2"/>
  <ellipse cx="20" cy="13.5" rx="17" ry="11" fill="#ffc21a" stroke="${INK}" stroke-width="2.2"/>
  <ellipse cx="20" cy="13.5" rx="11.5" ry="7" fill="none" stroke="#e08a00" stroke-width="1.6"/>
  <path d="M15 12.5c2-2 8-2 10 0M16 15c2 1.5 6 1.5 8 0" fill="none" stroke="#e08a00" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

export const SPARKLE = `<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="${GOLD}" d="M10 0c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10Z"/></svg>`;

// ── Toran: the marigold-and-mango-leaf hanging that says "welcome" over a Bengali doorway ──
function marigold(cx, cy, r, phase) {
  return `<g class="t-flower">
    <path d="${ruffle(cx, cy, r, 11, 0.12, phase)}" fill="#f07400" stroke="${INK}" stroke-width="${f(r * 0.09)}"/>
    <path d="${ruffle(cx, cy, r * 0.74, 9, 0.14, phase + 1)}" fill="#ff9a1a"/>
    <path d="${ruffle(cx, cy, r * 0.48, 7, 0.16, phase + 2)}" fill="#ffc23a"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.15)}" fill="#b24e00"/>
  </g>`;
}

function mangoLeaf(x, y, length, width, angle, delay) {
  const L = length, W = width;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"><g class="t-leaf" style="--d:${f(delay)}s">
    <path d="M0 0C${f(W)} ${f(L * 0.22)} ${f(W * 0.7)} ${f(L * 0.78)} 0 ${f(L)}C${f(-W * 0.7)} ${f(L * 0.78)} ${f(-W)} ${f(L * 0.22)} 0 0Z" fill="url(#t-leaf)" stroke="${INK}" stroke-width="${f(Math.max(1, W * 0.09))}"/>
    <path d="M0 ${f(L * 0.08)}L0 ${f(L * 0.9)}" stroke="#a8d58a" stroke-width="${f(Math.max(0.7, W * 0.06))}" stroke-linecap="round" opacity=".8"/>
  </g></g>`;
}

export function toran({ width, unit }) {
  const rand = seeded(23);
  const u = unit; // banner height in px
  const ropeY = u * 0.03, sag = u * 0.014;
  const ropeAt = (x) => ropeY + sag * 4 * (x / width) * (1 - x / width);
  const step = Math.max(18, u * 0.066);
  const inset = u * 0.07;
  const leaves = [], flowers = [];
  let i = 0;
  for (let x = inset; x <= width - inset + 0.1; x += step, i++) {
    const y = ropeAt(x);
    if (i % 2 === 0) flowers.push(marigold(x, y, u * 0.027, rand() * 6));
    else leaves.push(mangoLeaf(x, y + u * 0.006, u * (0.078 + rand() * 0.014), u * 0.026, (rand() - 0.5) * 14, -rand() * 5));
  }
  // Marigold strings hanging at both ends, framing the doorway.
  const strands = [inset * 0.4, width - inset * 0.4].map((x, side) => {
    const r = u * 0.026, gap = r * 1.7;
    const blooms = Array.from({ length: 8 }, (_, k) => marigold(0, k * gap + r * 0.6, r, side * 3 + k));
    return `<g transform="translate(${f(x)} ${f(ropeAt(x))})"><g class="t-strand" style="--d:${side * -2.3}s">
      <path d="M0 0V${f(8 * gap)}" stroke="#6b2e0e" stroke-width="${f(Math.max(1.2, u * 0.003))}"/>
      ${mangoLeaf(0, 7.4 * gap, u * 0.09, u * 0.028, 0, 0)}
      ${blooms.join('')}
    </g></g>`;
  });
  const height = ropeY + sag + u * 0.5;
  return {
    height,
    svg: `<svg class="pandal__toran" viewBox="0 0 ${f(width)} ${f(height)}" width="${f(width)}" height="${f(height)}" aria-hidden="true">
      <defs><linearGradient id="t-leaf" x1="0" x2="1"><stop offset="0" stop-color="#2c6e2f"/><stop offset="1" stop-color="#55a043"/></linearGradient></defs>
      <path d="M0 ${f(ropeAt(0))}Q${f(width / 2)} ${f(ropeY + sag * 2)} ${f(width)} ${f(ropeAt(width))}" fill="none" stroke="#6b2e0e" stroke-width="${f(Math.max(1.5, u * 0.004))}"/>
      ${leaves.join('')}
      ${strands.join('')}
      ${flowers.join('')}
    </svg>`,
  };
}

// ── Alpona: rice-paste floor art at the threshold, drawn in when the scene opens ──
export function alpona({ width, height }) {
  const cx = width / 2;
  const R = Math.min(height * 0.88, width * 0.15, 240);
  const cy = height + R * 0.18;
  const parts = [];
  const line = (d, w = 2) => parts.push(`<path class="a-line" pathLength="1" d="${d}" stroke-width="${w}"/>`);
  const circle = (r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 1 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-r * 2)} 0`;

  line(circle(R * 0.56));
  line(circle(R * 0.98), 1.6);
  for (let i = 0; i < 28; i++) {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 28;
    const t = [cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9];
    const b1 = [cx + Math.cos(a - 0.07) * R * 0.6, cy + Math.sin(a - 0.07) * R * 0.6];
    const b2 = [cx + Math.cos(a + 0.07) * R * 0.6, cy + Math.sin(a + 0.07) * R * 0.6];
    const c1 = [cx + Math.cos(a - 0.1) * R * 0.8, cy + Math.sin(a - 0.1) * R * 0.8];
    const c2 = [cx + Math.cos(a + 0.1) * R * 0.8, cy + Math.sin(a + 0.1) * R * 0.8];
    line(`M${f(b1[0])} ${f(b1[1])}Q${f(c1[0])} ${f(c1[1])} ${f(t[0])} ${f(t[1])}Q${f(c2[0])} ${f(c2[1])} ${f(b2[0])} ${f(b2[1])}`, 1.8);
  }
  const fills = [];
  for (let i = 0; i < 18; i++) {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 18;
    fills.push(`<circle cx="${f(cx + Math.cos(a) * R * 0.5)}" cy="${f(cy + Math.sin(a) * R * 0.5)}" r="${f(R * 0.016 + 1)}"/>`);
  }
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 8;
    const t = [cx + Math.cos(a) * R * 0.44, cy + Math.sin(a) * R * 0.44];
    const l = [cx + Math.cos(a - 0.3) * R * 0.3, cy + Math.sin(a - 0.3) * R * 0.3];
    const r = [cx + Math.cos(a + 0.3) * R * 0.3, cy + Math.sin(a + 0.3) * R * 0.3];
    const b = [cx + Math.cos(a) * R * 0.17, cy + Math.sin(a) * R * 0.17];
    fills.push(`<path d="M${f(b[0])} ${f(b[1])}Q${f(l[0])} ${f(l[1])} ${f(t[0])} ${f(t[1])}Q${f(r[0])} ${f(r[1])} ${f(b[0])} ${f(b[1])}Z"/>`);
  }
  fills.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.14)}"/>`);

  // A creeper running out along the floor on each side, fading away.
  const vineY = height - R * 0.3;
  for (const dir of [-1, 1]) {
    const x0 = cx + dir * R * 1.04, x1 = cx + dir * Math.min(width * 0.44, R * 3.4);
    let d = `M${f(x0)} ${f(vineY)}`;
    const span = Math.abs(x1 - x0), wave = Math.max(40, R * 0.24);
    const n = Math.floor(span / wave);
    for (let k = 1; k <= n; k++) {
      const x = x0 + dir * k * wave;
      d += `Q${f(x - dir * wave / 2)} ${f(vineY + (k % 2 ? -1 : 1) * R * 0.05)} ${f(x)} ${f(vineY)}`;
      const up = k % 2 ? -1 : 1;
      const lx = x - dir * wave / 2, ly = vineY + up * R * 0.05;
      fills.push(`<path d="M${f(lx)} ${f(ly)}q${f(dir * R * 0.02)} ${f(up * R * 0.07)} ${f(dir * R * 0.08)} ${f(up * R * 0.08)}q${f(-dir * R * 0.06)} ${f(-up * R * 0.02)} ${f(-dir * R * 0.08)} ${f(-up * R * 0.08)}Z" opacity="${f(1 - k / (n + 1))}"/>`);
      fills.push(`<circle cx="${f(x)}" cy="${f(vineY - up * R * 0.07)}" r="${f(R * 0.012 + 1)}" opacity="${f(1 - k / (n + 1))}"/>`);
    }
    parts.push(`<path class="a-line" pathLength="1" d="${d}" stroke-width="1.6" mask="url(#a-fade)"/>`);
  }

  return `<svg class="pandal__alpona" viewBox="0 0 ${f(width)} ${f(height)}" width="${f(width)}" height="${f(height)}" aria-hidden="true">
    <defs>
      <radialGradient id="a-fade-g" cx="${f(cx)}" cy="${f(vineY)}" r="${f(Math.min(width * 0.44, R * 3.4))}" gradientUnits="userSpaceOnUse">
        <stop offset=".3" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
      <mask id="a-fade" maskUnits="userSpaceOnUse"><rect width="${f(width)}" height="${f(height)}" fill="url(#a-fade-g)"/></mask>
    </defs>
    <g fill="none" stroke="${CREAM}" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>
    <g class="a-fill" fill="${CREAM}">${fills.join('')}</g>
  </svg>`;
}

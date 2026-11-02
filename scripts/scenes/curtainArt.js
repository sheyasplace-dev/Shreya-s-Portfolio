import { seeded, f } from '../lib/handDrawn.js';

// The olive curtain from the work-experience artwork, drawn as SVG so it stays crisp at any size:
// spotted fabric in soft vertical folds, ending in a row of scallops edged with a dark band of white "teeth".
// Its scallops hang deeper at the sides than in the middle, like a stage valance.

const C = {
  base: '#6f6b34',
  light: '#8f8b4a',
  shade: '#4f4c22',
  band: '#2b2916',
  tooth: '#f2efe6',
  dot: '#f3efe0',
  ring: '#34321a',
};

// Scallop geometry for a width: equal widths, an odd count so one sits in the middle.
export function scallops(width) {
  let n = Math.max(3, Math.round(width / 300));
  if (n % 2 === 0) n += 1;
  const w = width / n;
  return Array.from({ length: n }, (_, i) => {
    const u = Math.abs(((i + 0.5) / n) * 2 - 1); // 0 in the middle, ~1 at the sides
    return { x: i * w, w, depth: w * (0.3 + 0.36 * u * u) };
  });
}

// The deepest scallop, and the middle one (how far the valance reaches at the sides and over the heading).
export function hemDepths(width) {
  const s = scallops(width);
  return { max: Math.max(...s.map((p) => p.depth)), middle: s[(s.length - 1) / 2].depth };
}

// A point on scallop p's lower edge, t from 0 to 1, and the unit normal pointing into the fabric.
const sag = (t) => Math.pow(Math.max(0, 1 - (2 * t - 1) ** 2), 0.62); // a rounded arc, steep where two meet

function edge(p, t) {
  const x = p.x + p.w * t;
  const y = p.depth * sag(t);
  const h = 0.002;
  const dy = (p.depth * (sag(Math.min(1, t + h)) - sag(Math.max(0, t - h)))) / (p.w * (Math.min(1, t + h) - Math.max(0, t - h)));
  const len = Math.hypot(1, dy);
  return { x, y, nx: dy / len, ny: -1 / len };
}

// Scallop p's lower edge as an open line, moved `inset` into the fabric.
function edgeLine(p, top, inset = 0) {
  const pts = [];
  for (let i = 0; i <= 32; i++) {
    const e = edge(p, i / 32);
    pts.push(`${f(e.x + e.nx * inset)} ${f(top + e.y + e.ny * inset)}`);
  }
  return `M${pts.join(' L')}`;
}

function scallopPath(p, top, inset = 0) {
  return `M${f(p.x)} ${f(top - 2)} L${edgeLine(p, top, inset).slice(1)} L${f(p.x + p.w)} ${f(top - 2)}Z`;
}

// Width and height of the body (the flat part above the scallops). The hem hangs below `height`.
export function curtainSVG({ width, height }) {
  const rand = seeded(23);
  const list = scallops(width);
  const deepest = Math.max(...list.map((p) => p.depth));
  const unit = list[0].w; // everything else scales with a scallop's width
  const band = Math.min(40, Math.max(12, unit * 0.1));

  // Spots: one tile, scattered, some with a dark ring.
  const tile = Math.round(Math.min(220, Math.max(120, unit * 0.62)));
  const spot = Math.max(1.8, unit * 0.012);
  let dots = '';
  for (let i = 0; i < 30; i++) {
    const x = rand() * tile, y = rand() * tile, r = spot * (0.6 + rand() * 0.9);
    const ring = rand() < 0.4 ? ` stroke="${C.ring}" stroke-width="${f(r * 0.45)}"` : '';
    dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.1)}" ry="${f(r * 0.85)}" fill="${C.dot}"${ring}/>`;
  }

  // Folds: lighter down the middle of each scallop, shaded where two meet.
  const folds = list.map((p) => `<rect x="${f(p.x)}" y="0" width="${f(p.w + 1)}" height="${f(height + deepest)}" fill="url(#fold)"/>`).join('');
  const shape = `<rect width="${f(width)}" height="${f(height + 1)}"/>` + list.map((p) => `<path d="${scallopPath(p, height)}"/>`).join('');

  let hem = '';
  for (const p of list) {
    // Gathered ridges following the scallop's curve.
    let ridges = '';
    for (let k = 1; k <= 3; k++) {
      const inset = band + k * unit * 0.07;
      ridges += `<path d="${edgeLine(p, height, inset)}" fill="none" stroke="${C.light}" stroke-opacity=".32" stroke-width="${f(unit * 0.03)}" stroke-linecap="round"/>`;
    }
    // The dark band and its white teeth, pointing up into the fabric.
    let teeth = '';
    // Evenly spaced along the curve (not across it), so they stay as close where the scallop turns steep.
    const along = [0];
    for (let i = 1; i <= 200; i++) { const a = edge(p, (i - 1) / 200), b = edge(p, i / 200); along.push(along[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
    const total = along[200];
    const count = Math.round(total / Math.max(11, unit * 0.06));
    for (let i = 0; i < count; i++) {
      const target = ((i + 0.5) / count) * total;
      let j = 1; while (along[j] < target) j++;
      const t = (j - 1 + (target - along[j - 1]) / (along[j] - along[j - 1])) / 200;
      const e = edge(p, t);
      const tx = -e.ny, ty = e.nx; // along the edge
      const half = (total / count) * 0.3;
      const len = band * (1.35 + rand() * 0.35);
      const bx = e.x + e.nx * band * 0.12, by = height + e.y + e.ny * band * 0.12;
      const tipx = e.x + e.nx * len, tipy = height + e.y + e.ny * len;
      teeth += `<path d="M${f(bx - tx * half)} ${f(by - ty * half)} Q${f(bx)} ${f(by + band * 0.08)} ${f(bx + tx * half)} ${f(by + ty * half)} Q${f((bx + tipx) / 2 + tx * half * 0.4)} ${f((by + tipy) / 2 + ty * half * 0.4)} ${f(tipx)} ${f(tipy)} Q${f((bx + tipx) / 2 - tx * half * 0.4)} ${f((by + tipy) / 2 - ty * half * 0.4)} ${f(bx - tx * half)} ${f(by - ty * half)}Z" fill="${C.tooth}"/>`;
    }
    hem += `<g>
      <path d="${scallopPath(p, height)}" fill="${C.band}"/>
      <path d="${scallopPath(p, height, band)}" fill="url(#cloth)"/>
      <path d="${scallopPath(p, height, band)}" fill="url(#spots)"/>
      ${ridges}
      <path d="${edgeLine(p, height, band * 0.9)}" fill="none" stroke="${C.band}" stroke-opacity=".5" stroke-width="${f(band * 0.4)}"/>
      ${teeth}
    </g>`;
  }

  return `<svg class="curtain__art" xmlns="http://www.w3.org/2000/svg" width="${f(width)}" height="${f(height + deepest + 4)}" viewBox="0 0 ${f(width)} ${f(height + deepest + 4)}" aria-hidden="true">
    <defs>
      <pattern id="spots" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${dots}</pattern>
      <linearGradient id="fold" x1="0" x2="1">
        <stop offset="0" stop-color="${C.shade}" stop-opacity=".55"/>
        <stop offset=".18" stop-color="${C.shade}" stop-opacity="0"/>
        <stop offset=".5" stop-color="${C.light}" stop-opacity=".28"/>
        <stop offset=".82" stop-color="${C.shade}" stop-opacity="0"/>
        <stop offset="1" stop-color="${C.shade}" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.base}"/>
        <stop offset="1" stop-color="${C.light}"/>
      </linearGradient>
      <clipPath id="curtain-shape">${shape}</clipPath>
    </defs>
    <rect width="${f(width)}" height="${f(height + 1)}" fill="${C.base}"/>
    <rect width="${f(width)}" height="${f(height + 1)}" fill="url(#spots)"/>
    ${hem}
    <g clip-path="url(#curtain-shape)">${folds}</g>
  </svg>`;
}

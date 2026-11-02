// The G3: a red-and-cream Kerala town bus, side on, facing right. Drawn as SVG on a 1000 × 420 frame, so the
// window buttons laid over it (internships.js) can be placed in percentages of the same frame.
// `line: true` draws it as a technical drawing instead (outlines only), with numbered callouts.

export const BUS = { width: 1000, height: 420, wheelRadius: 56 };
// The three passenger windows, as [x, y, w, h] on the frame.
export const WINDOWS = [0, 1, 2].map((i) => [90 + i * 230, 92, 210, 116]);

const BODY = 'M60 70H880Q905 70 912 90L948 250Q952 262 952 275V330Q952 345 937 345H55Q40 345 40 330V90Q40 70 60 70Z';

function wheel(cx) {
  const spokes = [0, 60, 120, 180, 240, 300]
    .map((a) => `<rect x="-2" y="-30" width="4" height="22" rx="2" transform="rotate(${a})" fill="#8d8c86"/>`).join('');
  return `<g transform="translate(${cx} 345)"><g class="bus__wheel">
    <circle r="56" fill="#1f1d1b"/>
    <circle r="50" fill="none" stroke="#3a3733" stroke-width="3"/>
    <circle r="33" fill="#cfccc4"/>
    ${spokes}
    <circle r="10" fill="#77746d"/>
  </g></g>`;
}

export function busSVG({ line = false, callouts = [] } = {}) {
  const pad = line ? 70 : 0;
  const vb = `${-pad} ${-pad} ${BUS.width + pad * 2} ${BUS.height + pad * 2}`;
  const windows = WINDOWS.map(([x, y, w, h]) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#77796f"/>
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="3" fill="#2f3b3b"/>
    <path class="bus__glint" d="M${x + 30} ${y + 6}h46l-60 ${h - 12}h-10v-${h - 40}z" fill="#ffffff" opacity=".1"/>
    <rect x="${x + 6}" y="${y + 52}" width="${w - 12}" height="6" fill="#77796f"/>`).join('');
  const marks = callouts.map(([x, y, dx, dy, n]) => `
    <g class="bus__callout"><line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}"/>
    <circle cx="${x}" cy="${y}" r="4"/>
    <text x="${x + dx + (dx >= 0 ? 8 : -8)}" y="${y + dy + 8}" text-anchor="${dx >= 0 ? 'start' : 'end'}">${n}</text></g>`).join('');

  return `<svg class="bus__svg${line ? ' bus--line' : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <clipPath id="bus-body${line ? '-line' : ''}"><path d="${BODY}"/></clipPath>
      <radialGradient id="bus-shadow"><stop offset="0" stop-color="#5a3c00" stop-opacity=".35"/><stop offset="1" stop-color="#5a3c00" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="bus__shadow" cx="500" cy="402" rx="500" ry="16" fill="url(#bus-shadow)"/>
    <rect x="70" y="58" width="790" height="14" rx="4" fill="#c9c6bc"/>
    <path d="M846 72V50Q846 42 854 42H896Q904 42 906 50L912 72Z" fill="#c9c6bc"/>
    <rect x="856" y="48" width="44" height="18" rx="2" fill="#26231f"/>
    <text class="bus__board" x="878" y="62" text-anchor="middle" fill="#f2b33a">G3</text>
    <g clip-path="url(#bus-body${line ? '-line' : ''})">
      <path d="${BODY}" fill="#ece6d6"/>
      <rect x="30" y="218" width="940" height="140" fill="#b4302a"/>
      <rect x="30" y="212" width="940" height="8" fill="#c9c6bc"/>
      <rect x="30" y="310" width="940" height="14" fill="#c97a2e"/>
    </g>
    <path d="${BODY}" fill="none" stroke="#8a2420" stroke-width="3"/>
    ${windows}
    <rect x="782" y="92" width="78" height="226" rx="4" fill="none" stroke="#6d1c18" stroke-width="3"/>
    <rect x="790" y="100" width="62" height="100" rx="3" fill="#2f3b3b"/>
    <path d="M872 92H904L934 214H872Z" fill="#2f3b3b" stroke="#77796f" stroke-width="5" stroke-linejoin="round"/>
    <path d="M912 104L962 96V112H958" fill="none" stroke="#26231f" stroke-width="4"/>
    <circle cx="934" cy="286" r="10" fill="#f6f1e2" stroke="#6d1c18" stroke-width="3"/>
    <rect x="898" y="330" width="62" height="12" rx="4" fill="#4a4743"/>
    <text class="bus__name" x="470" y="284" text-anchor="middle" fill="#f6ead2">KSRTC</text>
    <circle cx="112" cy="268" r="30" fill="none" stroke="#f6ead2" stroke-width="3"/>
    <text class="bus__number" x="112" y="282" text-anchor="middle" fill="#f6ead2">G3</text>
    <path d="M160 345A70 70 0 0 1 300 345Z" fill="#2a211e"/>
    <path d="M720 345A70 70 0 0 1 860 345Z" fill="#2a211e"/>
    ${wheel(230)}
    ${wheel(790)}
    ${marks}
  </svg>`;
}

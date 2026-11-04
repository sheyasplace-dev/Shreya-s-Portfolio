// A Jamdani border, woven on a grid: every motif is built from square "threads", which gives it the stepped
// edges of extra-weft weaving. Colours come from a slate-blue Jamdani sari. Bands, top to bottom:
//   stripes · a zig-zag chain of small crosses with flowers · stripes ·
//   a river of woven waves with little boats (nouka) sailing it · stripes · flowers on a scalloped garland · stripes.
// The static bands repeat as one 48-thread tile (an SVG pattern); the waves and boats are separate layers so
// they can drift as the page scrolls.

export const JAMDANI = {
  ground: '#5d7280',
  deep: '#4d606d',
  beige: '#dccaa8',
  rust: '#b06e47',
  pale: '#aabdc1',
};

const TILE = 48;   // threads across one repeat of the static bands
const ROWS = 50;
export const WAVE = 12; // threads across one wave
export const BOAT_GAP = 96; // threads between boats

const FLOWER = ['..X..', '.XXX.', 'XXOXX', '.XXX.', '..X..'];
const CROSS = ['.X.', 'XXX', '.X.'];
export const BOAT = [ // a nouka: upturned bow and stern, a sail
  '........SS.......',
  '........SSS......',
  '........SSSS.....',
  '........SSSSS....',
  '........SSSSSS...',
  '........SSSSSSS..',
  '........M........',
  'HH......M......HH',
  '.HHHHHHHHHHHHHHH.',
  '..HHLLLLLLLLLHH..',
  '....HHHHHHHHH....',
];

// A loom: cells by colour, written out as one SVG path per colour (runs of threads merged along each row).
function loom() {
  const rows = new Map();
  const put = (x, y, color) => {
    if (y < 0) return;
    let row = rows.get(y);
    if (!row) rows.set(y, (row = new Map()));
    row.set(x, color);
  };
  const stamp = (art, x0, y0, colors) => art.forEach((line, dy) => [...line].forEach((ch, dx) => {
    if (colors[ch]) put(x0 + dx, y0 + dy, colors[ch]);
  }));
  const paths = (c) => {
    const byColor = {};
    for (const [y, row] of rows) {
      const xs = [...row.keys()].sort((a, b) => a - b);
      for (let i = 0; i < xs.length; i++) {
        const color = row.get(xs[i]);
        let j = i;
        while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1 && row.get(xs[j + 1]) === color) j++;
        (byColor[color] ||= []).push(`M${xs[i] * c} ${y * c}h${(j - i + 1) * c}v${c}h-${(j - i + 1) * c}z`);
        i = j;
      }
    }
    return Object.entries(byColor).map(([color, d]) => `<path fill="${color}" d="${d.join('')}"/>`).join('');
  };
  return { put, stamp, paths };
}

const line = (L, y, color, width = TILE) => { for (let x = 0; x < width; x++) L.put(x, y, color); };

function staticTile() {
  const L = loom();
  const C = JAMDANI;
  // Stripes.
  line(L, 0, C.beige); line(L, 2, C.rust); line(L, 4, C.beige);
  line(L, 15, C.beige); line(L, 16, C.deep);
  line(L, 35, C.beige); line(L, 36, C.rust);
  line(L, 46, C.beige); line(L, 48, C.rust); line(L, 49, C.beige);

  // Zig-zag chain of crosses (rows 5–14), with a flower in each bay.
  for (let x = 0; x < TILE; x += 2) {
    const k = x % 16;
    const y = 5 + Math.abs(k - 8) * 0.875;
    L.stamp(CROSS, x - 1, Math.round(y), { X: C.beige });
  }
  for (let x = 0; x < TILE; x += 16) {
    L.stamp(FLOWER, x - 2, 5, { X: C.pale, O: C.rust });     // over the chain where it dips
    L.stamp(FLOWER, x + 8 - 2, 9, { X: C.pale, O: C.rust }); // under it where it rises
  }

  // The river's sky: a scatter of small woven stars (rows 17–28).
  [[5, 19], [17, 23], [29, 18], [40, 22], [11, 26], [35, 26]].forEach(([x, y]) => L.stamp(CROSS, x, y, { X: C.pale }));
  [[23, 20], [45, 19], [2, 24]].forEach(([x, y]) => L.put(x, y, C.beige));

  // Flowers on a scalloped garland (rows 38–45), a rust bead where the scallops meet.
  for (let x = 0; x < TILE; x += 12) {
    const sag = [0, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 0];
    sag.forEach((s, dx) => L.put(x + dx, 42 + s, C.pale));
    L.stamp(FLOWER, x + 4, 38, { X: C.beige, O: C.rust });
    L.put(x, 41, C.rust);
  }
  return L;
}

function waveStrip(width) {
  const L = loom();
  const crest = [2, 2, 1, 1, 0, 0, 0, 1, 1, 2, 2, 2];
  for (let x = 0; x < width; x++) {
    const s = crest[x % WAVE];
    L.put(x, 30 + s, JAMDANI.beige);
    L.put(x, 33 + crest[(x + 6) % WAVE], JAMDANI.pale);
  }
  return L;
}

function boat() {
  const L = loom();
  L.stamp(BOAT, 0, 0, { S: JAMDANI.beige, M: JAMDANI.beige, H: JAMDANI.rust, L: JAMDANI.beige });
  return L;
}

// The border for a given width; `c` is the size of one thread in px.
export function jamdaniBorder({ width, c }) {
  const height = ROWS * c;
  const waveW = Math.ceil(width / c) + WAVE * 2;
  const boatsAcross = Math.ceil(width / (BOAT_GAP * c)) + 2;
  const boats = Array.from({ length: boatsAcross }, (_, i) =>
    `<g transform="translate(${(i - 1) * BOAT_GAP * c + 20 * c} ${20 * c})"><g class="jb-boat" style="--b:${i}">${boat().paths(c)}</g></g>`).join('');
  return `<svg class="jamdani" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" aria-hidden="true">
    <defs>
      <pattern id="jamdani-tile" width="${TILE * c}" height="${height}" patternUnits="userSpaceOnUse">
        <rect width="${TILE * c}" height="${height}" fill="${JAMDANI.ground}"/>
        ${staticTile().paths(c)}
      </pattern>
      <clipPath id="jamdani-river"><rect y="${17 * c}" width="${width}" height="${18 * c}"/></clipPath>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#jamdani-tile)"/>
    <g clip-path="url(#jamdani-river)">
      <g class="jb-waves">${waveStrip(waveW).paths(c)}</g>
      <g class="jb-fleet">${boats}</g>
    </g>
  </svg>`;
}

// The sari's body, for a faint backdrop: a diamond lattice of small crosses, with a flower in most diamonds and,
// here and there, a little woven character — a fish, a bird, a boat. One square tile, repeated.
const FIELD = 64; // threads across the tile
const FISH = ['....XXX..X', '..XXXXXXXX', '.XXOXXXXX.', '..XXXXXXXX', '....XXX..X'];
const BIRD = ['..XX....', '.XOX....', '..XX....', '..XXX...', '.XXXXXX.', '..XXXXXX', '...X.X..'];
const SKIFF = ['....X....', '....XX...', '....XXX..', '....X....', 'XXXXXXXXX', '.XXXXXXX.'];

export function jamdaniField(c) {
  const L = loom();
  const wrap = (x) => ((x % FIELD) + FIELD) % FIELD;
  const put = (x, y, color) => L.put(wrap(x), ((y % FIELD) + FIELD) % FIELD, color);
  const stamp = (art, cx, cy, colors) => art.forEach((row, dy) => [...row].forEach((ch, dx) => {
    if (colors[ch]) put(cx - (row.length >> 1) + dx, cy - (art.length >> 1) + dy, colors[ch]);
  }));
  // Lattice: crosses every 4 threads along both diagonals.
  for (let i = 0; i < FIELD; i += 4) {
    for (const [x, y] of [[i, i], [i, -i], [i + 32, i], [i + 32, -i]]) stamp(CROSS, x, y, { X: JAMDANI.ground });
  }
  // What sits in each diamond.
  const centers = [[16, 0], [48, 0], [0, 16], [32, 16], [16, 32], [48, 32], [0, 48], [32, 48]];
  const fill = [FLOWER, FISH, FLOWER, BIRD, FLOWER, FLOWER, SKIFF, FLOWER];
  centers.forEach(([x, y], i) => stamp(fill[i], x, y, { X: JAMDANI.ground, O: JAMDANI.rust }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FIELD * c}" height="${FIELD * c}" shape-rendering="crispEdges">${L.paths(c)}</svg>`;
}

// A pale khaki Jamdani, for the calendar's backdrop. Two weaves:
//   the body — stepped diamonds in charcoal, marigold, teal and red, and small tulip butis between them;
//   the border — a charcoal column of hollow diamonds and hourglasses with coloured wings, edged by rails of
//   little arrows. Both are square tiles, repeated.
export const KHAKI = { ground: '#d6cf98', ink: '#33312b', orange: '#e3962f', teal: '#4f9c86', red: '#d8343c', light: '#f1ead0' };
const DIAMOND = ['....X....', '...XXX...', '..XXXXX..', '.XXXXXXX.', 'XXXXOXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
const TULIP = ['..X..', '.XXX.', '..X..', '.....', 'X...X', 'XX.XX', '.XXX.']; // a bud over a little cup
const HOURGLASS = ['XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXOXXX..', '...XXXXX...', '....XXX....', '...XXXXX...', '..XXXOXXX..', '.XXXXXXXXX.', 'XXXXXXXXXXX'];
const WING = ['WW..', 'WWW.', 'WWWW', 'WWWW', 'WWWW', 'WWW.', 'WW..'];

function tiled(W, H) {
  const L = loom();
  const put = (x, y, color) => L.put(((x % W) + W) % W, ((y % H) + H) % H, color);
  const stamp = (art, cx, cy, colors, flip = false) => art.forEach((row, dy) => [...row].forEach((ch, dx) => {
    const x = flip ? row.length - 1 - dx : dx;
    if (colors[ch]) put(cx - (row.length >> 1) + x, cy - (art.length >> 1) + dy, colors[ch]);
  }));
  return { L, put, stamp };
}

export function khakiField(c) {
  const T = 60;
  const { L, stamp } = tiled(T, T);
  const K = KHAKI;
  [[8, 8, K.teal], [38, 8, K.orange], [23, 38, K.red], [53, 38, K.ink]].forEach(([x, y, col]) => stamp(DIAMOND, x, y, { X: col, O: K.light }));
  [[23, 16, K.red], [53, 16, K.teal], [8, 46, K.orange], [38, 46, K.ink], [23, 28, K.orange], [53, 28, K.red], [8, 58, K.teal], [38, 58, K.red]]
    .forEach(([x, y, col]) => stamp(TULIP, x, y, { X: col }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${T * c}" height="${T * c}" shape-rendering="crispEdges">${L.paths(c)}</svg>`;
}

export function khakiBorder(c) {
  const W = 28, H = 96;
  const { L, put, stamp } = tiled(W, H);
  const K = KHAKI;
  const bar = (y) => { for (let x = 6; x <= 22; x++) { put(x, y, K.ink); put(x, y + 1, K.ink); } };
  const stem = (y0, y1) => { for (let y = y0; y <= y1; y++) put(14, y, K.ink); };
  for (const [top, wing] of [[0, K.orange], [48, K.teal]]) {
    bar(top);
    stem(top + 2, top + 3);
    for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 7 && d >= 4) put(14 + dx, top + 11 + dy, K.ink);
      else if (d <= 1) put(14 + dx, top + 11 + dy, K.light);
    }
    stem(top + 19, top + 20);
    bar(top + 21);
    stem(top + 23, top + 27);
    stamp(HOURGLASS, 14, top + 32, { X: K.ink, O: K.light });
    stamp(WING, 6, top + 32, { W: wing });
    stamp(WING, 22, top + 32, { W: wing }, true);
    stem(top + 37, top + 47);
  }
  // Rails of little arrows down both edges.
  for (let y = 0; y < H; y++) { put(1, y, K.ink); put(26, y, K.ink); }
  for (let y = 0; y < H; y += 4) for (const x of [1, 26]) { put(x - 1, y - 1, K.ink); put(x + 1, y - 1, K.ink); }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * c}" height="${H * c}" shape-rendering="crispEdges">${L.paths(c)}</svg>`;
}

// Madras check, for the blogs page: blocks of colour where the warp and weft cross, gold threads running through
// each block, and a fine twill over it all. One repeat of 3 × 4 blocks (the fourth row starts the cycle again).
export function madrasField(block = 150) {
  const rows = [
    ['#0f5e4a', '#8e2f3a', '#8f8a1c'],
    ['#8e2f3a', '#c2154f', '#d77b45'],
    ['#a8682f', '#d9614a', '#eaaa26'],
  ];
  const W = block * 3, H = block * 3;
  let rects = '';
  rows.forEach((row, r) => row.forEach((c, k) => { rects += `<rect x="${k * block}" y="${r * block}" width="${block}" height="${block}" fill="${c}"/>`; }));
  // Gold threads: a band of three through the middle of every block, both ways, and a hairline at each seam.
  const band = (o) => [-6, 0, 6].map((d) => o + d);
  let threads = '';
  for (let i = 0; i < 3; i++) {
    const mid = i * block + block * 0.55;
    for (const t of band(mid)) {
      threads += `<rect x="0" y="${t}" width="${W}" height="1.6" fill="#f2c96b" opacity=".75"/>`;
      threads += `<rect x="${t}" y="0" width="1.6" height="${H}" fill="#f2c96b" opacity=".75"/>`;
    }
    threads += `<rect x="0" y="${i * block}" width="${W}" height="1" fill="#f2c96b" opacity=".45"/>`;
    threads += `<rect x="${i * block}" y="0" width="1" height="${H}" fill="#f2c96b" opacity=".45"/>`;
  }
  // Twill: fine diagonal ribs, light and dark, so the colour reads as cloth rather than paint.
  const twill = `<pattern id="twill" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="2" height="4" fill="#000" opacity=".14"/><rect x="2" width="1" height="4" fill="#fff" opacity=".07"/></pattern>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${twill}</defs>${rects}${threads}<rect width="${W}" height="${H}" fill="url(#twill)"/></svg>`;
}

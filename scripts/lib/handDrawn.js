// Small helpers for drawing in SVG with a hand-made wobble.

// Deterministic random, so a drawing looks the same on every visit and every resize.
export function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export const f = (n) => (Math.round(n * 10) / 10).toString();

// Smooth closed curve through points (Catmull-Rom as cubic Béziers).
function closedCurve(p) {
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} `
      + `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

// A rectangle traced by hand: points every `step`, nudged by slow layered wobble (never jitter).
export function wobblyRect(x, y, w, h, amp, seed, step = 26) {
  const rand = seeded(seed);
  const phase = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const perimeter = 2 * (w + h);
  const n = Math.max(12, Math.round(perimeter / step));
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * perimeter;
    let d = t, px, py, nx, ny;
    if (d < w) { px = x + d; py = y; nx = 0; ny = -1; }
    else if ((d -= w) < h) { px = x + w; py = y + d; nx = 1; ny = 0; }
    else if ((d -= h) < w) { px = x + w - d; py = y + h; nx = 0; ny = 1; }
    else { d -= w; px = x; py = y + h - d; nx = -1; ny = 0; }
    const s = step * 3.5;
    const o = amp * (0.55 * Math.sin(t / s + phase[0]) + 0.3 * Math.sin(t / (s * 0.4) + phase[1]) + 0.15 * Math.sin(t / (s * 0.15) + phase[2]));
    points.push([px + nx * o, py + ny * o]);
  }
  return closedCurve(points);
}

// A ruffled circle — the outline of a marigold layer.
export function ruffle(cx, cy, r, lobes, depth, phase = 0) {
  const points = [];
  const n = lobes * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + depth * Math.sin(a * lobes + phase));
    points.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return closedCurve(points);
}

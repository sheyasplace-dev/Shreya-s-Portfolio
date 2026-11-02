export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Progress of `p` through the window [start, end], clamped to 0–1.
export const segment = (p, start, end) => clamp((p - start) / (end - start));

// CSS-style cubic-bezier easing (solved by bisection; x is monotonic for x1, x2 in [0, 1]).
export function cubicBezier(x1, y1, x2, y2) {
  const coord = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (coord(t, x1, x2) < x) lo = t; else hi = t;
    }
    return coord(t, y1, y2);
  };
}

export const ease = {
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  iris: cubicBezier(0.5, 0, 0.15, 1),
  glide: cubicBezier(0.55, 0, 0.2, 1),
  out: cubicBezier(0.16, 1, 0.3, 1),
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

// Runs onFrame(p) every animation frame for `duration` ms; resolves after p === 1.
export function animate(duration, onFrame) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration);
      onFrame(p);
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

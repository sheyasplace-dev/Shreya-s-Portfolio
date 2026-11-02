import { animate, ease, lerp, segment, clamp } from '../lib/motion.js';

const RING = { gold: 3, ink: 4.5, lift: 22, blur: 48 };

// The camera pulls back from the final frame into a lens, and the lens flies to its place on the page.
//
// Three things move on their own curves, so the result reads as camera motion rather than a wipe:
//   ρ  – the iris radius, in source pixels. It closes first, from "covers the screen" down to the focus circle,
//        so the edges of the film are never seen once the scene starts to shrink.
//   s  – the scale of the whole scene. It shrinks after a tiny push-in (anticipation).
//   C  – the circle's centre. It glides along a gentle arc from her face to the medallion slot.
// Once the lens is small, the picture turns slightly inside it and settles upright, like a coin catching the light.
//
// `from` is the focus circle on screen ({ x, y } point, `r` in source px, `k` source→screen scale);
// `to` is the medallion ({ x, y, r } in screen px). At p = 1 the lens matches `to` exactly.
export function circleReveal({ intro, stage, rim, from, to, onProgress, duration = 2700 }) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cover = Math.max(
    Math.hypot(from.x, from.y), Math.hypot(vw - from.x, from.y),
    Math.hypot(from.x, vh - from.y), Math.hypot(vw - from.x, vh - from.y),
  );
  const rho0 = cover / from.k + 2;
  const sEnd = to.r / (from.r * from.k);

  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist, ny = dx / dist; // perpendicular, for the arc
  const bow = Math.min(dist * 0.22, 70);

  return animate(duration, (p) => {
    const rho = lerp(rho0, from.r, ease.iris(segment(p, 0, 0.48)));
    const pushIn = 1 + 0.035 * Math.sin(Math.PI * segment(p, 0, 0.3));
    const s = lerp(1, sEnd, ease.glide(segment(p, 0.2, 1))) * pushIn;

    const tc = ease.glide(segment(p, 0.25, 1));
    const arc = Math.sin(Math.PI * tc) * bow;
    const cx = from.x + dx * tc + nx * arc;
    const cy = from.y + dy * tc + ny * arc;

    const turn = -9 * Math.sin(Math.PI * ease.sine(segment(p, 0.35, 1)));
    const r = rho * from.k * s;

    stage.style.transform =
      `translate(${cx}px, ${cy}px) rotate(${turn}deg) scale(${s}) translate(${-from.x}px, ${-from.y}px)`;
    intro.style.clipPath = `circle(${r}px at ${cx}px ${cy}px)`;

    // A gold rim grows on the lens edge as it gets small enough to read as an object.
    const a = ease.inOut(segment(p, 0.32, 0.92));
    rim.style.width = rim.style.height = `${r * 2}px`;
    rim.style.transform = `translate(${cx - r}px, ${cy - r}px)`;
    rim.style.opacity = clamp(a * 3);
    rim.style.boxShadow = [
      `0 0 0 ${RING.gold * a}px var(--gold)`,
      `0 0 0 ${RING.ink * a}px rgba(64, 3, 0, ${0.5 * a})`,
      `0 ${RING.lift * a}px ${RING.blur * a}px -18px rgba(64, 3, 0, ${0.42 * a})`,
    ].join(', ');

    onProgress?.(p);
  });
}

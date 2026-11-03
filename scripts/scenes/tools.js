import { clamp, segment } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';

// Tools: the section holds still while you scroll, and the twenty stickers fly in one after another — each from
// its own edge or corner of the screen — tumbling as they come, and stick down all around Shreya. Scroll back and
// they peel away again. Once down, they can be dragged about.
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// Back-out: overshoots a touch and settles, like a sticker pressed into place.
const backOut = (t, s = 1.4) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

export function createTools(root, { reduced }) {
  const walk = root.querySelector('.tools__walk');
  const stage = root.querySelector('[data-stack]');
  const figure = root.querySelector('.stack__figure');
  const stickers = [...root.querySelectorAll('[data-sticker]')];
  let places = [], top = 0, run = 1, frame = 0;
  root.querySelector('.tools__stage').style.setProperty('--grain', `url(${grainTexture({ rgb: [90, 60, 70], strength: 34 })})`);

  // Where each sticker lands: scattered around the figure and over the whole stage, never on her, never on each
  // other. Chosen by darts thrown from a fixed seed, so the arrangement is the same on every visit.
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const narrow = w < 600;
    const size = narrow ? Math.min(54, w * 0.14) : Math.min(100, w * 0.075, h * 0.13);
    stage.style.setProperty('--sticker', `${size.toFixed(1)}px`);
    const fh = h * (narrow ? 0.48 : 0.7), fw = fh * (897 / 1338);
    const body = { x0: w / 2 - fw * 0.44, x1: w / 2 + fw * 0.44, y0: h / 2 - fh * 0.5, y1: h / 2 + fh * 0.5 };
    const gap = size * (narrow ? 1.25 : 1.5);
    const rand = seeded(11);
    places = [];
    for (let i = 0; i < stickers.length; i++) {
      let best = null, bestScore = -Infinity;
      for (let tries = 0; tries < 500; tries++) {
        const x = size * 0.62 + rand() * (w - size * 1.24);
        const y = size * 0.62 + rand() * (h - size * 1.24);
        // Off her: outside her outline (a little inset box), with a margin.
        const m = size * 0.5;
        if (x > body.x0 - m && x < body.x1 + m && y > body.y0 - m && y < body.y1 + m) continue;
        const near = places.reduce((d, p) => Math.min(d, Math.hypot(p.x - x, p.y - y)), Infinity);
        if (near < gap) continue;
        // Prefer room around it, but also staying fairly close to her, so they gather rather than drift to corners.
        const pull = Math.hypot((x - w / 2) / w, (y - h / 2) / h);
        const score = Math.min(near, gap * 2.2) - pull * size * 1.6;
        if (score > bestScore) { best = { x, y }; bestScore = score; }
      }
      if (!best) best = { x: size + rand() * (w - 2 * size), y: size + rand() * (h - 2 * size) };
      best.rot = (rand() - 0.5) * 22;
      places.push(best);
    }
    // Where each flies in from: beyond the nearest edge or corner along its line out from her, so they arrive
    // from all around.
    places.forEach((p, i) => {
      const dx = p.x - w / 2, dy = p.y - h / 2, len = Math.hypot(dx, dy) || 1;
      const far = Math.max(w, h) * 0.8 + size;
      p.fx = (dx / len) * far * (0.85 + rand() * 0.3);
      p.fy = (dy / len) * far * (0.85 + rand() * 0.3);
      p.spin = (rand() < 0.5 ? -1 : 1) * (160 + rand() * 260);
      const el = stickers[i];
      el.style.left = `${p.x.toFixed(1)}px`;
      el.style.top = `${p.y.toFixed(1)}px`;
      el.style.setProperty('--rot', `${p.rot.toFixed(1)}deg`);
    });
    top = root.getBoundingClientRect().top + window.scrollY;
    run = Math.max(1, walk.offsetHeight - window.innerHeight);
  }

  function render() {
    frame = 0;
    // From as the section reaches the top of the screen, to just before it lets go.
    const p = reduced ? 1 : clamp((window.scrollY - top) / (run * 0.88));
    const n = stickers.length;
    stickers.forEach((el, i) => {
      const s = places[i];
      const t = segment(p, (i / n) * 0.75, (i / n) * 0.75 + 0.25);   // each gets its own slice of the scroll
      const e = backOut(t);
      el.style.setProperty('--mx', `${(s.fx * (1 - e)).toFixed(1)}px`);
      el.style.setProperty('--my', `${(s.fy * (1 - e)).toFixed(1)}px`);
      el.style.setProperty('--spin', `${(s.spin * (1 - t)).toFixed(1)}deg`);
      el.classList.toggle('is-down', t >= 1);
    });
  }

  // Dragging: the sticker follows the pointer, and stays where it's dropped.
  function draggable(el) {
    let sx = 0, sy = 0, ox = 0, oy = 0, id = null;
    el.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      el.setPointerCapture(id);
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(el.style.getPropertyValue('--dx')) || 0;
      oy = parseFloat(el.style.getPropertyValue('--dy')) || 0;
      el.classList.add('is-dragging');
      el.style.zIndex = String(10 + (Date.now() % 1000));
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      el.style.setProperty('--dx', `${ox + e.clientX - sx}px`);
      el.style.setProperty('--dy', `${oy + e.clientY - sy}px`);
    });
    const drop = (e) => { if (e.pointerId !== id) return; id = null; el.classList.remove('is-dragging'); };
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
  }

  return {
    start() {
      layout();
      render();
      stickers.forEach(draggable);
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { layout(); render(); });
    },
  };
}

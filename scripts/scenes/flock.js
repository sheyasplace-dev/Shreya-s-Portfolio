import { clamp, ease, lerp, segment } from '../lib/motion.js';

// The two birds, lifted from the photograph: each a body and two wings, on the photograph's own pixel grid.
// box: [x, y, w, h] in the 608 × 868 photograph; up/down: each wing's shoulder, in % of the box;
// upAxis/downAxis: the direction each wing points from its shoulder, in degrees (screen, y down).
const BIRDS = [
  { name: 'a', box: [210, 352, 136, 200], up: [47.79, 41.5], down: [47.79, 48.5], upAxis: -77, downAxis: 97, phase: 0 },
  { name: 'b', box: [324, 320, 128, 162], up: [40.82, 41.98], down: [42.19, 48.15], upAxis: -74, downAxis: 70, phase: 1.9 },
];
// The pair's bounding box in the photograph, for the flight.
const PAIR = { x: 210, y: 320, w: 242, h: 232 };

function birdEl(b) {
  const el = document.createElement('div');
  el.className = 'bird';
  const [x, y, w, h] = b.box;
  Object.assign(el.style, {
    left: `${((x - PAIR.x) / PAIR.w) * 100}%`,
    top: `${((y - PAIR.y) / PAIR.h) * 100}%`,
    width: `${(w / PAIR.w) * 100}%`,
    height: `${(h / PAIR.h) * 100}%`,
  });
  el.style.setProperty('--up-o', `${b.up[0]}% ${b.up[1]}%`);
  el.style.setProperty('--down-o', `${b.down[0]}% ${b.down[1]}%`);
  el.style.setProperty('--up-axis', `${b.upAxis}deg`);
  el.style.setProperty('--down-axis', `${b.downAxis}deg`);
  el.innerHTML = ['up', 'down', 'body']
    .map((l) => `<img class="bird__${l}" src="assets/birds/bird-${b.name}-${l}.png" alt="" decoding="async">`).join('');
  return el;
}

// One wingbeat pose. Seen from below, a beat reads mostly as the wings foreshortening: each shortens along its
// own length (anchored at the shoulder, so its base never moves) and swings a few degrees. `stroke` runs -1..1,
// `amount` 0..1 scales the whole beat (0 is the painted pose).
function pose(el, stroke, amount) {
  el.style.setProperty('--short', (1 - 0.3 * amount * (0.5 + 0.5 * stroke)).toFixed(4));
  el.style.setProperty('--swing', `${(4 * amount * stroke).toFixed(2)}deg`);
  el.style.setProperty('--lift', `${(-2 * amount * stroke).toFixed(2)}px`);
}

// A breaker, tied to the scroll in three movements, like the curtain before the work page:
//   1. drops — the projects page holds still (sticky) while the birds' sky comes down over it from the top;
//   2. flies — the sky holds still while the two birds cross it from right to left, wings beating;
//   3. lifts — the sky scrolls away with the page, onto the blogs.
// While dropping, the sky is fixed to the screen; from then on it sits in its own section (which overlaps the
// end of the projects' runway by one screen), so the two hand over at the same position.
export function createFlock(root, { reduced }) {
  const stage = document.querySelector('[data-pstage]');
  const pin = stage.querySelector('.pstage__pin');
  const flight = root.querySelector('[data-flock-flight]');
  const sky = root.querySelector('[data-flock-sky]');
  const pair = root.querySelector('[data-flock-pair]');
  const flyers = BIRDS.map((b) => { const el = birdEl(b); pair.append(el); return { b, el }; });

  let t = null, frame = 0, beating = false;

  function measure() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const fall = vh * 0.8;
    stage.style.setProperty('--pin', `${Math.min(0, vh - pin.offsetHeight)}px`);
    stage.style.setProperty('--runway', `${fall}px`);
    const k = Math.min(1.5, (vw * 0.62) / PAIR.w, (vh * 0.5) / PAIR.h);
    pair.style.width = `${PAIR.w * k}px`;
    pair.style.height = `${PAIR.h * k}px`;
    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const start = stageTop + pin.offsetHeight - vh; // the projects pinned; the sky starts to drop
    const flyTop = root.getBoundingClientRect().top + window.scrollY; // the sky is down: the flight begins
    t = { start, fall, flyTop, run: Math.max(1, flight.offsetHeight - vh) };
  }

  function render() {
    frame = 0;
    if (!t) return;
    const s = window.scrollY, vw = window.innerWidth, vh = window.innerHeight;
    if (s < t.start) {
      sky.classList.add('is-away');
      sky.classList.remove('is-fixed');
    } else if (s < t.start + t.fall) {
      const p = ease.inOut(clamp((s - t.start) / t.fall));
      sky.classList.add('is-fixed');
      sky.classList.remove('is-away');
      sky.style.transform = `translate3d(0, ${lerp(-vh - 20, 0, p).toFixed(1)}px, 0)`;
    } else {
      sky.classList.remove('is-fixed', 'is-away');
      sky.style.transform = '';
    }
    // The flight: in from the right, out to the left, along a shallow arc; into the distance at the end.
    const q = segment(clamp((s - t.flyTop) / t.run), 0.04, 0.92);
    const w = pair.offsetWidth, h = pair.offsetHeight;
    const x = (vw + 24) + (-(w + 24) - (vw + 24)) * q;
    const y = vh * 0.5 - h * 0.55 - Math.sin(q * Math.PI) * vh * 0.06;
    pair.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    pair.style.opacity = (1 - segment(q, 0.8, 1)).toFixed(3);
  }

  function beat(now) {
    if (!beating) return;
    flyers.forEach(({ b, el }) => pose(el, Math.sin(2 * Math.PI * 1.25 * now / 1000 + b.phase), 1));
    requestAnimationFrame(beat);
  }

  return {
    start() {
      if (reduced) {
        root.classList.add('is-still');
        sky.classList.remove('is-away');
        return;
      }
      measure();
      render();
      // Wings beat only while the sky is on screen.
      new IntersectionObserver(([e]) => {
        const was = beating;
        beating = e.isIntersecting;
        if (beating && !was) requestAnimationFrame(beat);
      }).observe(sky);
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { measure(); render(); });
    },
  };
}

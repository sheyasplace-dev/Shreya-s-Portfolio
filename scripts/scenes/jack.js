import { clamp } from '../lib/motion.js';

// "Jack of all trades": a notepad page that floats down like a loose sheet as you scroll in — swaying, tilting,
// turning — then settles flat and is taped down. Above it, a pencil fish swims through the maroon, riding the
// swell between two faint waves, its tail beating with the distance.

const FISH = `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <g class="jfish__tail"><path d="M168 45 C186 30 198 18 214 12 C206 30 206 60 214 78 C198 72 186 60 168 45Z"/>
      <path d="M182 40 L204 24 M182 50 L204 66" stroke-width="1.4"/></g>
    <path d="M8 46 C30 18 92 10 140 26 C156 32 166 38 170 45 C166 52 156 58 140 64 C92 80 30 74 8 46Z"/>
    <path d="M44 22 C46 36 46 56 44 70" />
    <path d="M70 28 c6 4 6 10 0 14 M70 50 c6 4 6 10 0 14 M92 26 c6 4 6 10 0 14 M92 48 c6 4 6 10 0 14 M114 30 c6 4 6 10 0 14 M114 50 c5 4 5 9 0 12" stroke-width="1.5"/>
    <path d="M96 14 C104 4 120 2 130 10" stroke-width="1.8"/>
    <path d="M86 70 C94 82 106 84 112 78" stroke-width="1.8"/>
    <circle cx="26" cy="40" r="3.2" fill="currentColor"/>
    <path d="M10 50 C16 52 20 52 24 50" stroke-width="1.6"/>
  </g>
</svg>`;

export function createJack(root, { reduced, casefile }) {
  const sea = root.querySelector('[data-jack-sea]');
  const fish = root.querySelector('[data-jack-fish]');
  const waves = root.querySelector('[data-jack-waves]');
  const sheet = root.querySelector('[data-jack-sheet]');
  const psst = root.querySelector('[data-jack-psst]');
  const paper = root.querySelector('.jack__paper');
  const cells = root.querySelector('.cells');

  // The window in the paper sits exactly where the skills are.
  function cutWindow() {
    paper.style.setProperty('--cx', `${cells.offsetLeft}px`);
    paper.style.setProperty('--cy', `${cells.offsetTop}px`);
    paper.style.setProperty('--cw', `${cells.offsetWidth}px`);
    paper.style.setProperty('--ch', `${cells.offsetHeight}px`);
  }
  fish.innerHTML = FISH;
  const tail = fish.querySelector('.jfish__tail');

  let frame = 0;
  const wave = (x, w, k) => Math.sin((x / w) * Math.PI * 2 * 2.2 + k);

  function drawWaves() {
    const w = sea.offsetWidth, h = sea.offsetHeight;
    const line = (mid, amp, k) => {
      let d = '';
      for (let x = 0; x <= w; x += 8) d += `${x ? 'L' : 'M'}${x} ${(mid + wave(x, w, k) * amp + Math.sin(x * 0.09) * 1.2).toFixed(1)}`;
      return `<path d="${d}"/>`;
    };
    waves.setAttribute('viewBox', `0 0 ${w} ${h}`);
    waves.innerHTML = line(h * 0.25, h * 0.08, 0.4) + line(h * 0.78, h * 0.08, 0.4);
  }

  function render() {
    frame = 0;
    const r = sea.getBoundingClientRect();
    const vh = window.innerHeight, w = sea.offsetWidth, h = sea.offsetHeight;
    // Across the strip while it travels from the bottom of the screen to the top.
    const p = reduced ? 0.42 : clamp((vh - r.top) / (vh + r.height));
    const fw = fish.offsetWidth;
    const x = -fw + p * (w + fw * 1.4);
    const cx = x + fw * 0.4;
    // Ride the swell: follow the waves' shape, between them.
    const y = h * 0.5 - fish.offsetHeight / 2 + wave(cx, w, 0.4) * h * 0.09;
    const slope = Math.cos((cx / w) * Math.PI * 2 * 2.2 + 0.4) * h * 0.09 * (Math.PI * 2 * 2.2 / w);
    const tilt = (Math.atan(slope) * 180) / Math.PI;
    // It swims left to right: the drawing faces left, so mirror it.
    fish.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(-tilt).toFixed(2)}deg) scaleX(-1)`;
    tail.style.transform = `rotate(${(Math.sin(x / 26) * 9).toFixed(2)}deg)`;
    float(vh);
  }

  // The sheet: drifting down from above and to the side, rocking like paper on air, until it lands.
  function float(vh) {
    if (reduced) return;
    const t = sheet.parentElement.getBoundingClientRect();
    const p = clamp((vh * 0.95 - t.top) / (vh * 0.75));
    const e = 1 - (1 - p) ** 3;          // slows as it nears the wall
    const u = 1 - e;                      // how far it still has to fall
    const sway = Math.sin(p * Math.PI * 2.2);
    const x = sway * 70 * u + 120 * u;
    const y = -vh * 0.45 * u;
    const rz = sway * 9 * u - 4 * u;
    const rx = 28 * u * (0.6 + 0.4 * Math.cos(p * Math.PI * 3));
    sheet.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(60 * u).toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
    // A big soft shadow while it's in the air, a tight one once it's flat on the wall.
    paper.style.setProperty('--drop', `${(14 + 60 * u).toFixed(0)}px`);
    paper.style.setProperty('--blur', `${(16 + 40 * u).toFixed(0)}px`);
    paper.style.setProperty('--shade', (0.55 - 0.25 * u).toFixed(2));
    sheet.style.setProperty('--taped', clamp((p - 0.9) / 0.1).toFixed(3));
    const q = clamp((p - 0.25) / 0.75), v = 1 - (1 - q) ** 3;
    psst.style.transform = `translate3d(${(-90 * (1 - v)).toFixed(1)}px, ${(60 * (1 - v)).toFixed(1)}px, 0) rotate(${(-5 * (1 - v)).toFixed(2)}deg)`;
    psst.style.opacity = Math.min(1, q * 2).toFixed(3);
  }

  return {
    start() {
      // Each skill opens the page it names in data-target (see casefile.js).
      root.querySelectorAll('template[data-pick-page]').forEach((t) => casefile.register(t.dataset.pickPage, {
        label: t.dataset.label,
        build: () => ({ content: t.content.cloneNode(true), variant: 'works' }),
      }));
      root.querySelectorAll('[data-target]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.target) casefile.open(b.dataset.target);
      }));
      drawWaves();
      cutWindow();
      document.fonts?.ready.then(cutWindow);
      render();
      window.addEventListener('resize', cutWindow);
      if (reduced) return;
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { drawWaves(); render(); });
    },
  };
}

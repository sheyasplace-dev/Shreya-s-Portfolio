import { clamp } from '../lib/motion.js';

// About → Contents: a 1px rule rises from the bottom of the screen to the top as you scroll, Contents revealed
// beneath it. The rule follows the scroll with a little weight (it eases after it), and a scanline glitch
// flickers along it while it moves.
export function createWipe(root, { reduced }) {
  const about = document.querySelector('[data-about]');
  const read = root.querySelector('[data-wipe-read]');
  let top = 0, run = 1, shown = 0, last = 0, frame = 0;

  function measure() {
    const vh = window.innerHeight;
    // About holds with its bottom on the screen's bottom while the rule rises.
    about.style.setProperty('--about-pin', `${Math.min(0, vh - about.offsetHeight)}px`);
    root.style.setProperty('--wipe-run', `${vh}px`);
    top = root.getBoundingClientRect().top + window.scrollY;
    run = vh;
  }

  function paint(p) {
    root.style.setProperty('--cut', `${((1 - p) * 100).toFixed(3)}%`);
    root.style.setProperty('--rule-on', p > 0.002 && p < 0.998 ? '1' : '0');
    read.textContent = `contents ${String(Math.round(p * 100)).padStart(2, '0')}%`;
  }

  function tick(now) {
    frame = 0;
    const target = clamp((window.scrollY - top) / run);
    const dt = Math.min(64, now - (last || now));
    last = now;
    const before = shown;
    shown += (target - shown) * (1 - Math.exp(-dt / 90));
    if (Math.abs(target - shown) < 0.0005) shown = target;
    paint(shown);
    // The faster it moves, the more it glitches.
    const speed = Math.min(1, Math.abs(shown - before) * 60);
    root.style.setProperty('--glitch', (speed * 0.9).toFixed(3));
    root.style.setProperty('--jit', `${((Math.random() - 0.5) * 24 * speed).toFixed(1)}px`);
    root.style.setProperty('--seg', `${(10 + Math.random() * 26).toFixed(0)}px`);
    if (shown !== target) frame = requestAnimationFrame(tick);
    else { last = 0; root.style.setProperty('--glitch', '0'); }
  }

  return {
    start() {
      if (reduced) return;
      measure();
      shown = clamp((window.scrollY - top) / run);
      paint(shown);
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(tick); }, { passive: true });
      window.addEventListener('resize', () => { measure(); paint(shown); });
    },
  };
}

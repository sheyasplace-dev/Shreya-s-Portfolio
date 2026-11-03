import { clamp, segment } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';

// What I bring to the table: the section holds still while you scroll, and a katori is set down on the thali for
// each strength, one after another, as its line on the menu is written in. A dish and its line light up together.
const backOut = (t, s = 1.3) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

export function createTable(root, { reduced }) {
  const walk = root.querySelector('.table__walk');
  const bowls = [...root.querySelectorAll('.katori')];
  const lines = [...root.querySelectorAll('.menu__item')];
  root.querySelector('.table__stage').style.setProperty('--grain', `url(${grainTexture({ rgb: [80, 30, 20], strength: 30 })})`);
  let top = 0, run = 1, frame = 0;

  function measure() {
    top = root.getBoundingClientRect().top + window.scrollY;
    run = Math.max(1, walk.offsetHeight - window.innerHeight);
  }

  function render() {
    frame = 0;
    const p = reduced ? 1 : clamp((window.scrollY - top + window.innerHeight * 0.15) / (run * 0.85));
    root.style.setProperty('--plate', segment(p, 0, 0.12).toFixed(3));
    const n = bowls.length;
    bowls.forEach((b, i) => {
      const t = segment(p, 0.1 + (i / n) * 0.72, 0.1 + (i / n) * 0.72 + 0.16);
      b.style.setProperty('--serve', backOut(t).toFixed(4));
      b.style.setProperty('--lift', (1 - t).toFixed(4));
      b.classList.toggle('is-served', t >= 1);
      lines[i].style.setProperty('--write', clamp(t * 1.4).toFixed(3));
    });
  }

  // A dish and its line light up together.
  function pair(i, on) {
    bowls[i].classList.toggle('is-lit', on);
    lines[i].classList.toggle('is-lit', on);
  }

  return {
    start() {
      measure();
      render();
      [...bowls, ...lines].forEach((el) => {
        const i = Number(el.dataset.dish);
        el.addEventListener('pointerenter', () => pair(i, true));
        el.addEventListener('pointerleave', () => pair(i, false));
        el.addEventListener('focus', () => pair(i, true));
        el.addEventListener('blur', () => pair(i, false));
      });
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { measure(); render(); });
    },
  };
}

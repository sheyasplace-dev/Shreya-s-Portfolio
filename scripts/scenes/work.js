import { clamp, ease, lerp } from '../lib/motion.js';
import { curtainSVG, hemDepths } from './curtainArt.js';

// The curtain between "tell me about yourself" and the work page, tied to the scroll:
//   1. falls  — the contents page holds still (sticky) while the curtain drops over the whole screen;
//   2. holds  — a beat, fully closed;
//   3. rises  — it lifts with the work page as that scrolls up, and its hem stays on as the page's valance.
// In 1–2 the curtain is fixed to the screen; from 3 on it is simply part of the work section, so it scrolls
// exactly with the page. The two hand over at the same position, so there is no jump.
export function createWork(root, { reduced }) {
  const stage = document.querySelector('[data-stage]');
  const pinned = stage.querySelector('[data-pin]'); // the about and contents pages, scrolling as one
  const runway = stage.querySelector('[data-runway]');
  const curtain = root.querySelector('[data-curtain]');
  const img = root.querySelector('img');

  let t = null; // timeline, measured on start and resize
  let frame = 0;
  let width = 0;

  root.classList.add('is-armed');

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // The curtain's flat part: the screen, plus a strip that stays above the hem as the valance.
    // (With reduced motion it never falls, so only the valance is drawn.)
    const strip = Math.round(clamp(vh * 0.012, 8, 14));
    const body = reduced ? strip : vh + strip;
    const fall = reduced ? 0 : vh * 0.75;
    const hold = reduced ? 0 : vh * 0.3;
    const depth = hemDepths(vw);

    if (vw !== width || curtain.dataset.h !== String(body)) {
      curtain.innerHTML = curtainSVG({ width: vw, height: body });
      curtain.dataset.h = String(body);
      width = vw;
    }
    root.style.setProperty('--curtain-h', `${body}px`);
    root.style.setProperty('--valance-body', `${strip}px`);
    root.style.setProperty('--valance', `${strip + depth.middle}px`);

    // The pages above pin where their bottom meets the bottom of the screen, for as long as the runway lasts.
    stage.style.setProperty('--pin', `${Math.min(0, vh - pinned.offsetHeight)}px`);
    stage.style.setProperty('--runway', `${fall + hold}px`);

    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const start = stageTop + pinned.offsetHeight - vh; // the scroll at which it starts to fall
    t = { start, fall, hold, body, deepest: depth.max };
  }

  function render() {
    frame = 0;
    if (!t) return;
    const s = window.scrollY;
    const { start, fall, hold, body, deepest } = t;
    if (reduced || s >= start + fall + hold) {
      // Risen: part of the page.
      curtain.classList.remove('is-fixed', 'is-away');
      curtain.style.transform = '';
    } else if (s < start) {
      curtain.classList.add('is-away');
      curtain.classList.remove('is-fixed');
    } else {
      // Falling, then closed. y is where the bottom of the flat part sits on screen.
      const p = clamp((s - start) / fall);
      const y = lerp(-deepest - 8, body, ease.inOut(p));
      curtain.classList.add('is-fixed');
      curtain.classList.remove('is-away');
      curtain.style.transform = `translate3d(0, ${(y - body).toFixed(2)}px, 0)`;
    }
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function onResize() {
    measure();
    render();
  }

  // The heading and the picture settle in as they reach the screen.
  function observe() {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  // Laid out before the intro ends, so the page below the greeting already has its final length.
  measure();
  curtain.classList.add('is-away');

  return {
    // Called once the greeting is on screen.
    start() {
      observe();
      img.sizes = img.getAttribute('sizes');
      img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      measure();
      render();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
    },
    // The pages above change height as their pictures load; the timeline follows.
    remeasure: onResize,
  };
}

import { clamp, ease, segment } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';

// Contact, the last page: as it scrolls in, a letter drifts down, rocking, and slips into the post box's slot.
const LETTER = `<svg viewBox="0 0 120 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="2" y="2" width="116" height="72" rx="3" fill="#fbf3e2" stroke="#6e1418" stroke-width="2"/>
  <path d="M3 4l57 40 57-40" fill="none" stroke="#6e1418" stroke-width="2"/>
  <rect x="88" y="10" width="20" height="24" fill="#f2b632" stroke="#6e1418" stroke-width="1.4" stroke-dasharray="2 2"/>
  <path d="M93 22c3-6 7-6 10 0" fill="none" stroke="#2f5a32" stroke-width="1.6"/>
</svg>`;

export function createContact(root, { reduced }) {
  const box = root.querySelector('[data-pbox]');
  const letter = root.querySelector('[data-letter]');
  letter.innerHTML = LETTER;
  root.style.setProperty('--grain', `url(${grainTexture({ rgb: [70, 10, 0], strength: 30 })})`);

  let frame = 0;
  function render() {
    frame = 0;
    const r = box.getBoundingClientRect(), vh = window.innerHeight;
    // From when the box's top enters the screen until it's a third of the way up.
    const p = reduced ? 1 : clamp((vh - r.top) / (vh * 0.7));
    const fall = ease.out(segment(p, 0, 0.72));
    const post = ease.inOut(segment(p, 0.72, 1));
    const sway = Math.sin(fall * Math.PI * 2) * 18 * (1 - fall);
    letter.style.setProperty('--x', `${((1 - fall) * -160 + sway).toFixed(1)}px`);
    letter.style.setProperty('--y', `${((1 - fall) * -260 + post * 34).toFixed(1)}px`);
    letter.style.setProperty('--r', `${((1 - fall) * -22 + sway * 0.4).toFixed(2)}deg`);
    letter.style.setProperty('--in', post.toFixed(3));
  }

  return {
    start() {
      render();
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -8% 0px' });
      root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
      if (reduced) return;
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', render);
    },
  };
}

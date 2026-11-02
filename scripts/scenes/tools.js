import { clamp, segment } from '../lib/motion.js';

// Tools: the tools hang on a sage wall; below, three cats, each hugging a fish, walk along a Persian rug as you
// scroll. Their walk is a flip-book of three poses (cut from the same window in every frame, so nothing jumps),
// stepping with the distance they've covered.
const CATS = ['red', 'green', 'blue'];
const GAIT = [0, 1, 2, 1];   // the poses, in walking order
const STRIDE = 0.05;         // rug-widths walked per pose

export function createTools(root, { reduced }) {
  const rug = root.querySelector('.rug');
  const troupe = root.querySelector('[data-troupe]');
  const walk = root.querySelector('.tools__walk');

  const cats = CATS.map((name) => {
    const el = document.createElement('div');
    el.className = `cat cat--${name}`;
    el.innerHTML = '<span class="cat__shadow"></span>'
      + [0, 1, 2].map((f) => `<img src="assets/tools/cat-${name}-${f}.webp" alt="" decoding="async">`).join('');
    troupe.append(el);
    return { el, poses: [...el.querySelectorAll('img')], pose: -1 };
  });

  let top = 0, run = 1, frame = 0;

  function measure() {
    top = root.getBoundingClientRect().top + window.scrollY;
    run = Math.max(1, walk.offsetHeight - window.innerHeight);
  }

  function render() {
    frame = 0;
    const p = reduced ? 0.55 : clamp((window.scrollY - top) / run);
    const w = rug.offsetWidth, catW = cats[0].el.offsetWidth;
    // Right to left along the rug: in from beyond the right edge, out past the left.
    const travel = segment(p, 0.03, 0.97);
    const lead = w + catW * 0.2 - travel * (w + catW * 3.6);
    const step = Math.floor(travel / STRIDE);
    cats.forEach((c, i) => {
      const x = lead + i * catW * 1.08;
      const pose = reduced ? 1 : GAIT[(step + i) % GAIT.length];
      c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${pose === 1 ? -2 : 0}px, 0)`;
      if (pose !== c.pose) {
        c.poses.forEach((img, k) => img.classList.toggle('is-on', k === pose));
        c.pose = pose;
      }
    });
  }

  return {
    start() {
      measure();
      render();
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -6% 0px' });
      root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
      if (reduced) return;
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { measure(); render(); });
    },
  };
}

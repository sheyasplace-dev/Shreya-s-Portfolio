import { clamp, cubicBezier, segment } from '../lib/motion.js';

// Soft to start, long to settle: the tiger eases into its place rather than stopping on it.
const prowl = cubicBezier(0.42, 0, 0.18, 1);

// "tell me about yourself": the words settle in as they reach the screen. She and the sofa wait in place while
// the tiger alone comes in from the top-left corner to settle in front of them, tied to the scroll (and
// reversing with it).
export function createAbout(root, { reduced }) {
  const home = root.querySelector('[data-tiger-home]');
  const tiger = home.querySelector('[data-tiger]');
  const images = [...home.querySelectorAll('img[data-lazy]')];
  const hello = document.getElementById('hello');
  const cue = hello.querySelector('[data-cue]');

  let path = null;   // measured on load and resize
  let shown = 0;     // the progress on screen, which glides after the scroll's
  let frame = 0;
  let last = 0;

  root.classList.add('is-armed', 'is-waiting');

  // The path is drawn in screen space: from just off the top-left corner to its resting spot, easing
  // all the way in, so it never overshoots and is never cut off by the bottom of the screen. Progress
  // runs over a set stretch of scroll that ends exactly where it rests in the page — from then on it
  // simply scrolls with everything else.
  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = home.getBoundingClientRect();
    const side = r.width < vw * 0.75; // side-by-side layout
    const w = r.width, h = r.height;
    // Measured from the stage around the section, which (unlike the section) never sticks.
    const stageTop = root.closest('[data-stage]').getBoundingClientRect().top;
    const docTop = stageTop + window.scrollY + (r.top - root.getBoundingClientRect().top);
    const maxScroll = document.documentElement.scrollHeight - vh;

    // Where its top is on screen at the moment it comes to rest: side by side, with the section filling
    // the screen; stacked, a little above the middle, with the words below still to come.
    let land = side ? vh - h - Math.max(16, vh * 0.04) : vh * 0.44 - h / 2;
    land = Math.max(land, docTop - maxScroll); // never later than the page can scroll

    path = {
      w, h, docTop, land,
      range: vh * (side ? 0.62 : 0.6),
      startX: -w * 0.96 - r.left, // offset from home that puts it just off the left edge
      startY: -h * 0.9,           // and just off the top
    };
  }

  function progressAt(scrollY) {
    const top = path.docTop - scrollY;
    return clamp((path.land + path.range - top) / path.range);
  }

  function render(p) {
    const { range, land, startX, startY } = path;
    const e = prowl(p);
    // Across a little ahead of down, so it arcs over the words into its corner instead of through them.
    const ex = prowl(Math.min(1, p * 1.25));
    const ey = e ** 1.5;
    const top = land + range * (1 - p); // where its resting place is on screen right now
    const x = startX * (1 - ex);
    const y = startY + (land - startY) * ey - top;
    // A slow rise and fall in its stride, fading out as it settles.
    const stride = Math.sin(p * Math.PI * 3) * path.h * 0.012 * (1 - e);
    const turn = -7 * (1 - e) + Math.sin(p * Math.PI * 3 + 0.8) * 1.2 * (1 - e);
    const s = 0.94 + 0.06 * e;
    tiger.style.transform = `translate3d(${x.toFixed(2)}px, ${(y + stride).toFixed(2)}px, 0) rotate(${turn.toFixed(3)}deg) scale(${s.toFixed(4)})`;
    tiger.style.opacity = segment(p, 0, 0.22).toFixed(3);
    home.style.setProperty('--land', segment(p, 0.6, 1).toFixed(3));
  }

  function tick(now) {
    frame = 0;
    const target = progressAt(window.scrollY);
    const dt = Math.min(64, now - (last || now));
    last = now;
    // A light follow, so a notchy wheel still reads as one smooth move.
    shown += (target - shown) * (1 - Math.exp(-dt / 70));
    if (Math.abs(target - shown) < 0.0008) shown = target;
    render(shown);
    if (shown !== target) frame = requestAnimationFrame(tick);
    else last = 0;
  }

  function onScroll() {
    hello.classList.toggle('is-scrolled', window.scrollY > 40);
    if (!frame && path) frame = requestAnimationFrame(tick);
  }

  function onResize() {
    measure();
    shown = progressAt(window.scrollY);
    render(shown);
  }

  // The words: each settles in as it reaches the lower part of the screen.
  function observeWords() {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  return {
    // Called once the greeting is on screen: only then does the illustration start loading.
    start() {
      observeWords();
      // The cue scrolls to the moment the tiger is at rest.
      cue.addEventListener('click', (event) => {
        event.preventDefault();
        const top = path ? path.docTop - path.land : root.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      });
      window.addEventListener('scroll', onScroll, { passive: true });
      for (const img of images) {
        img.sizes = img.getAttribute('sizes');
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
      }
      Promise.all(images.map((img) => img.decode().catch(() => {}))).then(() => {
        if (images.some((img) => !img.naturalWidth)) return home.remove();
        root.classList.remove('is-waiting');
        if (reduced) return; // it simply rests in place
        measure();
        shown = progressAt(window.scrollY);
        render(shown);
        window.addEventListener('resize', onResize);
      });
    },
  };
}

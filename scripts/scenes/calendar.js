import { clamp, ease } from '../lib/motion.js';
import { khakiField, khakiBorder, KHAKI } from './jamdani.js';

// Where I've worked: a wall calendar. The stage holds still while the scroll lifts each page up over the
// binding (it turns edge-on and is gone), revealing the next. Each page rests for a moment before the next
// lift, so there's time to look. The index jumps straight to a page; "know more" opens that job's own page,
// over the site, with its own scroll — the browser's back button closes it.
export function createCalendar(root, { reduced, casefile }) {
  const pages = [...root.querySelectorAll('[data-page]')];
  const index = [...root.querySelectorAll('[data-goto]')];
  const names = index.map((b) => b.lastChild.textContent.trim());
  const hashes = pages.map((p) => `work-${p.querySelector('.cal-page__name').id.replace('cal-', '')}`);

  let flip = 0, top = 0, frame = 0, current = -1;

  // The backdrop: the khaki Jamdani's weave, rewoven in a single cream thread on red (the eyes of the
  // diamonds stay red), at the same thread size as the experience page's border.
  const c = window.innerWidth >= 1100 ? 5 : window.innerWidth >= 700 ? 4 : 3;
  const mono = (svg) => svg.replace(/fill="(#[0-9a-f]{6})"/g, (_, hex) => `fill="${hex === KHAKI.light ? '#9a3b2c' : '#f6e7d8'}"`);
  const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(mono(svg))}")`;
  root.style.setProperty('--sari', svgUrl(khakiField(c)));
  root.style.setProperty('--sari-border', svgUrl(khakiBorder(c)));
  root.style.setProperty('--sari-border-w', `${28 * c}px`);

  function measure() {
    flip = window.innerHeight * 0.9; // scroll per page
    root.style.setProperty('--cal-length', `${window.innerHeight + (pages.length - 1) * flip + window.innerHeight * 0.35}px`);
    top = root.getBoundingClientRect().top + window.scrollY;
  }

  function show(i) {
    if (i === current) return;
    current = i;
    index.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    // Only the page on top can be clicked (stacked pages all stay open without the flip).
    if (!reduced) pages.forEach((p, j) => { p.inert = j !== i; });
  }

  function render() {
    frame = 0;
    const r = clamp((window.scrollY - top) / flip, 0, pages.length - 1);
    // Rest on the first and last fifth of each stretch; lift in between.
    const fs = pages.map((_, i) => (i < pages.length - 1 ? ease.inOut(clamp((r - i - 0.2) / 0.6)) : 0));
    pages.forEach((p, i) => {
      const f = fs[i];
      // Darkening as it lifts; and, beneath a page that's lifting, shadow that clears as it goes.
      const under = i > 0 ? 0.35 * (1 - clamp(fs[i - 1] * 2)) : 0;
      p.style.setProperty('--flip', f.toFixed(4));
      p.style.setProperty('--shade', Math.max(f * 0.9, under).toFixed(3));
      p.style.zIndex = String(pages.length - i);
      p.style.visibility = f >= 0.5 ? 'hidden' : '';
    });
    show(Math.min(pages.length - 1, Math.floor(r + 0.5)));
  }

  function goTo(i) {
    window.scrollTo({ top: top + i * flip, behavior: reduced ? 'auto' : 'smooth' });
  }

  // Each job's own page (see casefile.js), with the next job offered at the top.
  pages.forEach((p, i) => casefile.register(hashes[i], {
    label: names[i],
    next: hashes[(i + 1) % pages.length],
    build: () => ({ content: p.querySelector('.cal-page__story').content.cloneNode(true) }),
  }));

  function wire() {
    index.forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.goto);
      if (reduced) pages[i].scrollIntoView({ behavior: 'auto', block: 'center' });
      else goTo(i);
    }));
    pages.forEach((p, i) => p.querySelector('[data-more]').addEventListener('click', () => casefile.open(hashes[i])));
  }

  if (reduced) root.classList.add('is-static');
  else measure();

  return {
    start() {
      wire();
      if (reduced) return show(0);
      measure();
      render();
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { measure(); render(); });
    },
  };
}

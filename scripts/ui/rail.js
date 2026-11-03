// The section rail on the right edge: marks the section in view, takes on that section's tone (ink on light pages,
// cream on dark ones), and glides to a section when its tick is clicked.
// (The active section is read from the scroll position rather than an IntersectionObserver: several sections pin
// themselves in place while they play, which observers report unreliably.)
export function createRail(root, { reduced }) {
  const items = [...root.querySelectorAll('[data-rail-item]')];
  // Where each section starts. Contents sits over About during the wipe, so it's watched through the wipe and
  // counted from one screen later (data-rail-shift, in screens), when it's fully revealed.
  const targets = items.map((a) => document.querySelector(a.dataset.railWatch || a.getAttribute('href')));
  const shift = items.map((a) => Number(a.dataset.railShift || 0));
  const startOf = (k) => targets[k].getBoundingClientRect().top + shift[k] * window.innerHeight;
  let current = -1, frame = 0;

  // Where a section really starts in the page. Pinned (sticky) pages report where they're stuck, not where they
  // sit, so their stickiness is switched off for the moment of measuring (nothing repaints in between).
  function naturalTop(k) {
    const stuck = [];
    for (let el = targets[k]; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).position === 'sticky') { stuck.push([el, el.style.position]); el.style.position = 'static'; } // static: its top offset doesn't apply
    }
    const top = startOf(k) + window.scrollY;
    stuck.forEach(([el, pos]) => { el.style.position = pos; });
    return top;
  }

  function update() {
    frame = 0;
    const line = window.innerHeight * 0.45;
    let i = 0;
    targets.forEach((t, k) => { if (t && startOf(k) <= line) i = k; });
    if (i === current) return;
    current = i;
    items.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    root.dataset.tone = items[i].dataset.tone;
  }

  items.forEach((a, k) => a.addEventListener('click', (e) => {
    const t = targets[k];
    if (!t) return;
    e.preventDefault();
    const top = naturalTop(k);
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }));

  return {
    start() {
      root.classList.add('is-on');
      update();
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update);
    },
  };
}

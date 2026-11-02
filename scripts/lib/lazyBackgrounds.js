// Marks [data-lazy-bg] elements `is-near` when they come within a couple of screens, so their CSS background
// pictures (keyed on that class) download then rather than during the intro.
export function lazyBackgrounds() {
  const els = document.querySelectorAll('[data-lazy-bg]');
  if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('is-near'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-near');
      io.unobserve(e.target);
    }
  }, { rootMargin: '200% 0px' });
  els.forEach((el) => io.observe(el));
}

// Runs `cb` once, when `el` comes within a couple of screens.
export function whenNear(el, cb) {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    cb();
  }, { rootMargin: '200% 0px' });
  io.observe(el);
}

// The contents page: each entry glides to its section (the page's own scroll scenes play on the way).
export function createContents(root, { reduced }) {
  return {
    start() {
      // The picture loads once the intro is over, so it never competes with the opening.
      const img = root.querySelector('img[data-src]');
      if (img) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; }
      root.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const r = target.getBoundingClientRect();
        // "end": its bottom at the bottom of the screen — for a section with a scene that begins just below it.
        const top = r.top + window.scrollY + (a.dataset.jumpAlign === 'end' ? r.height - window.innerHeight : 0);
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }));
    },
  };
}

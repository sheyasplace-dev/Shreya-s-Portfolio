// A full page that opens over the site (the calendar's "know more", the bus's windows). Each page is registered
// under a hash; opening one adds a history entry, so the browser's Back button closes it and lands exactly where
// you were. A page can name a next page, offered in the top bar.
export function createCasefile(el, { reduced }) {
  const body = el.querySelector('[data-casefile-body]');
  const closeButton = el.querySelector('[data-casefile-close]');
  const nextButton = el.querySelector('[data-casefile-next]');
  const pages = new Map(); // hash → { label, build: () => ({ content, variant }), next }

  let opener = null;
  let current = null;

  function show(hash) {
    const page = pages.get(hash);
    if (!page) return;
    const { content, variant = '' } = page.build();
    current = hash;
    body.replaceChildren(content);
    el.classList.remove(...[...el.classList].filter((c) => c.startsWith('casefile--')));
    if (variant) el.classList.add(`casefile--${variant}`);
    nextButton.hidden = !page.next;
    if (page.next) {
      nextButton.innerHTML = `next: ${pages.get(page.next).label} <span aria-hidden="true">→</span>`;
      nextButton.dataset.next = page.next;
    }
    if (el.hidden) {
      opener = document.activeElement;
      el.hidden = false;
      document.documentElement.classList.add('has-casefile');
      requestAnimationFrame(() => el.classList.add('is-open'));
    }
    el.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
  }

  function close() {
    if (el.hidden) return;
    current = null;
    el.classList.remove('is-open');
    document.documentElement.classList.remove('has-casefile');
    const done = () => { el.hidden = true; body.replaceChildren(); };
    if (reduced) done(); else setTimeout(done, 450);
    opener?.focus({ preventScroll: true });
  }

  // Closing goes through history, so the URL and the Back button stay in step.
  const requestClose = () => (history.state?.casefile ? history.back() : close());

  closeButton.addEventListener('click', requestClose);
  // Links inside a page that open another page (data-open-case="hash").
  body.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open-case]');
    if (!a || !pages.has(a.dataset.openCase)) return;
    e.preventDefault();
    const hash = a.dataset.openCase;
    history.pushState({ casefile: hash }, '', `#${hash}`);
    show(hash);
  });
  nextButton.addEventListener('click', () => {
    const hash = nextButton.dataset.next;
    history.replaceState({ casefile: hash }, '', `#${hash}`);
    show(hash);
  });
  window.addEventListener('popstate', (e) => {
    if (e.state?.casefile) show(e.state.casefile);
    else close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) requestClose();
  });

  return {
    register(hash, page) { pages.set(hash, page); },
    open(hash) {
      history.pushState({ casefile: hash }, '', `#${hash}`);
      show(hash);
    },
  };
}

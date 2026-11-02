import { madrasField } from './jamdani.js';

// Blogs: a gallery of covers on a cream catalogue page, laid over Madras check. Each work links to its Substack
// post once its data-href is filled in (in index.html); until then it's shown but not clickable.
export function createBlogs(root) {
  root.style.setProperty('--madras', `url("data:image/svg+xml,${encodeURIComponent(madrasField())}")`);

  root.querySelectorAll('[data-href]').forEach((a) => {
    const url = a.dataset.href.trim();
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.removeAttribute('href');
      a.classList.add('is-pending');
    }
  });

  root.classList.add('is-armed');
  return {
    start() {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -8% 0px' });
      root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    },
  };
}

// The one-line pages (open source, website design): a picture shows while you hover the line, and a click opens
// that section's own page. Each section names its page in data-proj (the hash) and data-label.
export function createProjects(roots, { casefile }) {
  const sections = [...roots];

  sections.forEach((root) => {
    const opener = root.querySelector('[data-proj-open]');
    const label = root.dataset.label || root.id || 'project';

    opener?.setAttribute('aria-label', `Open ${label}`);
    opener?.setAttribute('aria-controls', root.dataset.proj);

    casefile.register(root.dataset.proj, {
      label,
      build: () => ({ content: root.querySelector('template[data-proj-page]').content.cloneNode(true) }),
    });
  });

  return {
    start() {
      sections.forEach((root) => {
        const opener = root.querySelector('[data-proj-open]');
        if (!opener) return;

        const open = (e) => {
          e.preventDefault();
          casefile.open(root.dataset.proj);
        };

        opener.addEventListener('click', open);
        opener.addEventListener('keydown', (e) => {
          if ((e.key === ' ' || e.key === 'Spacebar') && e.target === opener) {
            e.preventDefault();
            open(e);
          }
        });
      });
    },
  };
}

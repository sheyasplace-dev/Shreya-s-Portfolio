// Open source: a single line that shows a picture while you hover it, and opens the projects' page on click.
export function createProjects(root, { casefile }) {
  const link = root.querySelector('[data-proj-open]');
  const page = root.querySelector('template[data-proj-page]');

  casefile.register('open-source-projects', {
    label: 'Open source project',
    build: () => ({ content: page.content.cloneNode(true) }),
  });

  return {
    start() {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        casefile.open('open-source-projects');
      });
    },
  };
}

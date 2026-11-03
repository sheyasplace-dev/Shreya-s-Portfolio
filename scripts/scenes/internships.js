import { clamp, cubicBezier, ease, segment } from '../lib/motion.js';
import { busSVG, BUS, WINDOWS } from './busArt.js';

// Early internships: the G3 drives in from the left as you scroll, wheels turning with the distance, and pulls
// up; then all three windows' shutters roll down together, each with a company's name on it, ready to click.
// As the page moves on, the shutters go back up. A window opens that stop's page (casefile.js), drawn like a
// bus-depot blueprint.

// Rolls away gently, cruises, and brakes into its stop.
const pullIn = cubicBezier(0.35, 0, 0.25, 1);

export function createInternships(root, { reduced, casefile }) {
  const bus = root.querySelector('[data-bus]');
  const windows = [...root.querySelectorAll('[data-window]')];
  const templates = [...root.querySelectorAll('template[data-intern]')];

  let top = 0, run = 0, frame = 0, startX = 0, leave = 0;

  bus.querySelector('[data-bus-art]').innerHTML = busSVG();


  // The window buttons sit exactly over the drawn windows.
  windows.forEach((w, i) => {
    const [x, y, ww, hh] = WINDOWS[i];
    Object.assign(w.style, {
      left: `${(x / BUS.width) * 100}%`,
      top: `${(y / BUS.height) * 100}%`,
      width: `${(ww / BUS.width) * 100}%`,
      height: `${(hh / BUS.height) * 100}%`,
    });
  });

  // Each stop's page: the blueprint bus with numbered callouts for the five points.
  const callouts = [[195, 150, -40, -150, 1], [425, 150, 0, -150, 2], [655, 150, 40, -150, 3], [230, 345, -60, 100, 4], [820, 200, 150, -110, 5]];
  templates.forEach((t, i) => casefile.register(t.dataset.intern, {
    label: t.dataset.label,
    next: templates[(i + 1) % templates.length].dataset.intern,
    build: () => {
      const content = t.content.cloneNode(true);
      // One callout on the drawing per point in the list.
      const n = content.querySelectorAll('.ticket__parts li').length;
      content.querySelector('[data-plan]').innerHTML = busSVG({ line: true, callouts: callouts.slice(0, n) });
      return { content, variant: 'ticket' };
    },
  }));
  windows.forEach((w) => w.addEventListener('click', () => casefile.open(w.dataset.window)));

  function measure() {
    const vh = window.innerHeight;
    run = vh * 1.5;
    root.style.setProperty('--ride-length', `${vh * 2.6}px`); // the drive, then a stay with the shutters down
    const sectionTop = root.getBoundingClientRect().top + window.scrollY;
    top = sectionTop - vh * 0.25; // it sets off as the page comes up
    leave = sectionTop + root.offsetHeight - vh; // the screen at which the next page starts to come up
    const r = bus.getBoundingClientRect();
    startX = -(r.left + r.width + 40); // just out of sight on the left
  }

  function render() {
    frame = 0;
    const t = clamp((window.scrollY - top) / run);
    const drive = pullIn(segment(t, 0.05, 0.62));
    const x = startX * (1 - drive);
    const w = bus.offsetWidth;
    const wheelPx = (BUS.wheelRadius / BUS.width) * w;
    const spin = ((x - startX) / wheelPx) * (180 / Math.PI);
    const moving = 1 - drive;
    const bob = Math.sin((x - startX) / (w * 0.05)) * 1.4 * moving;
    bus.style.transform = `translate3d(${x.toFixed(1)}px, ${bob.toFixed(2)}px, 0)`;
    bus.style.setProperty('--spin', `${spin.toFixed(1)}deg`);
    // Down together once it has stopped; up again as the next page comes in.
    const down = ease.inOut(segment(t, 0.64, 0.8));
    const up = ease.inOut(clamp((window.scrollY - leave) / (window.innerHeight * 0.5)));
    const blind = (down * (1 - up)).toFixed(3);
    windows.forEach((win) => win.style.setProperty('--blind', blind));
    root.classList.toggle('is-parked', blind >= 0.9);

  }

  return {
    start() {
      if (reduced) {
        root.classList.add('is-static', 'is-parked');
        windows.forEach((w) => w.style.setProperty('--blind', '1'));
        return;
      }
      measure();
      render();
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', () => { bus.style.transform = ''; measure(); render(); });
    },
  };
}

import { clamp } from '../lib/motion.js';
import { jamdaniBorder, jamdaniField, JAMDANI, WAVE, BOAT_GAP, BOAT } from './jamdani.js';

const STOP = ['.X.', 'XXX', '.X.']; // the woven cross from the border, as a waypoint
// The route ends at a nouka from the border's river.

// Experience: the Jamdani border (its boats sail on as the page scrolls), and a dotted route that draws itself
// down beside the words, reaching each paragraph as it comes up the screen.
export function createExperience(root, { reduced }) {
  const borderBox = root.querySelector('[data-exp-border]');
  const body = root.querySelector('[data-exp-body]');
  const route = root.querySelector('[data-exp-route]');
  const paras = [...body.querySelectorAll('p')];

  let fleet = null, waves = null, ink = null, stops = [];
  let c = 4, width = 0, top = 0, frame = 0;

  root.classList.add('is-armed');

  function weave() {
    const vw = document.documentElement.clientWidth;
    c = vw >= 1100 ? 5 : vw >= 700 ? 4 : 3;
    if (vw === width) return;
    width = vw;
    borderBox.innerHTML = jamdaniBorder({ width: vw, c });
    root.style.setProperty('--field', `url("data:image/svg+xml,${encodeURIComponent(jamdaniField(c))}")`);
    fleet = borderBox.querySelector('.jb-fleet');
    waves = borderBox.querySelector('.jb-waves');
  }

  // A meandering line down the lane, through a stop beside each paragraph's first line.
  function chart() {
    const h = body.offsetHeight;
    const lane = 18;
    const ys = paras.map((p) => p.offsetTop + 13);
    const pts = [[lane, 0], ...ys.map((y, i) => [lane + (i % 2 ? 7 : -7), y])];
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const bend = (i % 2 ? 1 : -1) * 14;
      d += ` C${x0 + bend} ${y0 + (y1 - y0) * 0.4} ${x1 + bend} ${y1 - (y1 - y0) * 0.4} ${x1} ${y1}`;
    }
    // Woven art centred on (x, y), threads of size t.
    const weave = (art, x, y, t, colors) => {
      const w = art[0].length, h = art.length;
      let paths = '';
      art.forEach((row, dy) => [...row].forEach((ch, dx) => {
        if (colors[ch]) paths += `<path fill="${colors[ch]}" d="M${x + (dx - w / 2) * t} ${y + (dy - h / 2) * t}h${t}v${t}h-${t}z"/>`;
      }));
      return paths;
    };
    const last = pts.length - 1;
    const stopsArt = pts.slice(1).map(([x, y], i) => i + 1 === last
      ? `<g class="route-stop route-stop--boat">${weave(BOAT, x + 4, y - 6, 2.4, { S: JAMDANI.ground, M: JAMDANI.deep, H: JAMDANI.rust, L: JAMDANI.beige })}</g>`
      : `<g class="route-stop">${weave(STOP, x, y, 4, { X: JAMDANI.rust })}</g>`).join('');
    route.setAttribute('viewBox', `0 0 46 ${h}`);
    route.innerHTML = `
      <defs><mask id="route-mask" maskUnits="userSpaceOnUse" x="-20" y="-20" width="90" height="${h + 40}">
        <path class="route-ink" d="${d}" fill="none" stroke="#fff" stroke-width="8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
      </mask></defs>
      <path class="route-trail" d="${d}" mask="url(#route-mask)"/>
      ${stopsArt}`;
    ink = route.querySelector('.route-ink');
    stops = [...route.querySelectorAll('.route-stop')];
    top = root.getBoundingClientRect().top + window.scrollY;
  }

  function render() {
    frame = 0;
    const vh = window.innerHeight;
    const s = window.scrollY;
    // Boats sail right and the water runs left, both only while the border is anywhere near the screen.
    const d = s - top + vh;
    if (!reduced && d > -vh && d < vh * 3 && fleet) {
      fleet.style.transform = `translateX(${((d * 0.3) % (BOAT_GAP * c)).toFixed(1)}px)`;
      waves.style.transform = `translateX(${(-((d * 0.18) % (WAVE * c))).toFixed(1)}px)`;
    }
    // The route reaches as far as the point 70% of the way down the screen, and, as the page runs out,
    // on to the bottom of it, so the last stop is always reached.
    if (!ink) return;
    const b = body.getBoundingClientRect();
    const end = document.documentElement.scrollHeight - vh;
    const line = vh * (0.7 + 0.3 * clamp((s - (end - vh * 0.5)) / (vh * 0.5)));
    const reach = reduced ? b.height : clamp(line - b.top, 0, b.height);
    ink.style.strokeDashoffset = String(1 - reach / b.height);
    stops.forEach((el, i) => el.classList.toggle('is-reached', paras[i].offsetTop + 13 <= reach));
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function onResize() {
    weave();
    chart();
    render();
  }

  function observe() {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  weave(); // before the intro ends, so the page has its final length

  return {
    start() {
      observe();
      chart();
      render();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      // Webfonts change where the paragraphs fall: chart again once they're in.
      document.fonts?.ready.then(() => { chart(); render(); });
    },
  };
}

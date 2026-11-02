import { clamp, ease, segment } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';

// Contact: a red Bengali post box on a mustard wall. As the page scrolls in, a letter drifts down and slips
// through the slot. Drawn by hand in SVG (a slightly wobbly outline, painted shading), like the rest of the site.
const BOX = `<svg class="pbox__svg" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="pb-red" x1="0" x2="1">
      <stop offset="0" stop-color="#9e1418"/><stop offset=".45" stop-color="#c8232a"/><stop offset="1" stop-color="#8a1014"/>
    </linearGradient>
  </defs>
  <ellipse cx="112" cy="292" rx="88" ry="7" fill="#7a4a06" opacity=".22"/>
  <path d="M110 6c-4 0-7 3-7 7v4h14v-4c0-4-3-7-7-7z" fill="#a8161b"/>
  <path d="M30 70c4-30 38-54 80-54s76 24 80 54z" fill="url(#pb-red)" stroke="#5e0b0e" stroke-width="2.5"/>
  <path d="M18 70h184l-2 12H20z" fill="#b51d23" stroke="#5e0b0e" stroke-width="2.5"/>
  <path d="M32 82h156l-2 196H35z" fill="url(#pb-red)" stroke="#5e0b0e" stroke-width="2.5"/>
  <path d="M24 274h172l-1 14H25z" fill="#a8161b" stroke="#5e0b0e" stroke-width="2.5"/>
  <rect x="58" y="100" width="104" height="14" rx="3" fill="#1b0a07"/>
  <rect x="50" y="128" width="120" height="122" rx="4" fill="none" stroke="#6e0d10" stroke-width="2"/>
  <text x="110" y="168" text-anchor="middle" class="pbox__bn">চিঠির</text>
  <text x="110" y="206" text-anchor="middle" class="pbox__bn">বাক্স</text>
  <rect x="78" y="220" width="64" height="20" rx="3" fill="none" stroke="#f5dcc0" stroke-width="1.4" opacity=".8"/>
  <text x="110" y="235" text-anchor="middle" class="pbox__time">১১.১১</text>
  <circle cx="160" cy="190" r="4" fill="#5e0b0e"/>
  <path d="M44 90c2 60 1 120 4 176" stroke="#f08a7e" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>
</svg>`;

const LETTER = `<svg viewBox="0 0 120 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="2" y="2" width="116" height="72" rx="3" fill="#fbf3e2" stroke="#7a1418" stroke-width="2"/>
  <path d="M3 4l57 40 57-40" fill="none" stroke="#7a1418" stroke-width="2"/>
  <rect x="88" y="10" width="20" height="24" fill="none" stroke="#c8232a" stroke-width="1.6" stroke-dasharray="2 2"/>
  <path d="M93 22c3-6 7-6 10 0" fill="none" stroke="#2f5a32" stroke-width="1.6"/>
</svg>`;

export function createContact(root, { reduced }) {
  const box = root.querySelector('[data-pbox]');
  const letter = root.querySelector('[data-letter]');
  box.insertAdjacentHTML('afterbegin', BOX);
  letter.innerHTML = LETTER;
  root.style.setProperty('--grain', `url(${grainTexture({ rgb: [120, 70, 0], strength: 26 })})`);

  let frame = 0;
  function render() {
    frame = 0;
    const r = root.getBoundingClientRect(), vh = window.innerHeight;
    // From when the section's top is near the bottom of the screen to when it reaches the top third.
    const p = reduced ? 1 : clamp((vh - r.top) / (vh * 0.75));
    const fall = ease.out(segment(p, 0, 0.75));
    const post = ease.inOut(segment(p, 0.75, 1));
    const sway = Math.sin(fall * Math.PI * 2) * 14 * (1 - fall);
    // Down from above and to the right, rocking, until it's over the slot; then in.
    letter.style.setProperty('--x', `${((1 - fall) * 140 + sway).toFixed(1)}px`);
    letter.style.setProperty('--y', `${((1 - fall) * -180 + post * 46).toFixed(1)}px`);
    letter.style.setProperty('--r', `${((1 - fall) * 24 + sway * 0.4).toFixed(2)}deg`);
    letter.style.setProperty('--in', post.toFixed(3));
  }

  return {
    start() {
      render();
      if (reduced) return;
      window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { passive: true });
      window.addEventListener('resize', render);
    },
  };
}

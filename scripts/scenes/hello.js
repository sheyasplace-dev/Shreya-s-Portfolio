import { ease, lerp, wait } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';

// The first screen after the intro: the medallion and the greeting.
export function createHello(root) {
  const medallion = root.querySelector('[data-medallion]');
  const pane = medallion.querySelector('[data-medallion-window]');
  const atmos = root.querySelector('[data-atmos]');
  atmos.style.setProperty('--grain', `url(${grainTexture()})`);
  let images = [];

  return {
    // Whatever the intro ended on: the film's last frame, or her sticker on the banner's magenta.
    // The medallion crops it to the same focus circle the transition lands on (see hello.css).
    usePortrait({ layers, width, focus, background }) {
      medallion.style.setProperty('--src-w', width);
      medallion.style.setProperty('--fx', focus.x);
      medallion.style.setProperty('--fy', focus.y);
      medallion.style.setProperty('--fr', focus.r);
      pane.style.background = background || '';
      images = layers.map((src) => {
        const img = new Image();
        img.alt = '';
        img.decoding = 'async';
        img.src = src;
        return img;
      });
      pane.replaceChildren(...images);
    },

    // Resolves once the portrait is decoded and the type has settled, so measurements are final.
    ready() {
      const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      const decoded = images.map((img) => img.decode().catch(() => {}));
      return Promise.race([Promise.all([...decoded, fonts]), wait(1500)]);
    },

    medallionTarget() {
      const r = medallion.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    },

    // The page settles back as the camera pulls out, so both layers move as one shot.
    settle(p) {
      atmos.style.transform = `scale(${lerp(1.14, 1, ease.out(p))})`;
    },

    fillMedallion() {
      medallion.classList.add('is-filled');
      atmos.style.transform = '';
    },

    reveal() {
      root.classList.add('is-revealed');
    },
  };
}

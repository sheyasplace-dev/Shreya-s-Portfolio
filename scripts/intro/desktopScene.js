import { ease, lerp, segment, wait } from '../lib/motion.js';
import { grainTexture } from '../lib/texture.js';
import { COIN, SPARKLE, alpona, bannerFlourish, bannerFrame, toran } from './sceneArt.js';

// Laptops and desktops: the opening film's story, staged live from the original artwork's layers.
//
// A doorway being dressed for a guest. The original banner hangs on the wall with a toran over it and
// alpona at its foot. Her name is painted on, she steps in — sticker outline and all, as in the film —
// coins fall, light runs across the letters, the lotus water ripples, and the camera leans in.
// The layers move by different amounts, so the push-in has depth and nothing important leaves the screen.
//
// Same interface as HeroStage, so main.js runs either one.

// Falling coins in the banner's left margin, where the original keeps them. x: fraction of the column.
const COINS = [
  { x: 0.1, w: 1, delay: 0, dur: 6.4 },
  { x: 0.55, w: 0.8, delay: -1.6, dur: 5.6 },
  { x: 0.3, w: 1.1, delay: -3.1, dur: 7.2 },
  { x: 0.7, w: 0.9, delay: -4.4, dur: 6 },
  { x: 0.2, w: 0.75, delay: -5.3, dur: 5.2 },
];
const SPARKLES = [
  { x: 0.62, y: 0.2, s: 0.9, d: 0 },
  { x: 0.15, y: 0.52, s: 0.7, d: -1.1 },
  { x: 0.68, y: 0.82, s: 0.8, d: -2.2 },
];

// How far each layer travels when the camera leans in (and with the pointer). Nearer layers move more;
// the banner and toran stay small enough that their edges never leave the screen.
const DEPTH = {
  wall: { push: 0.02, drift: 3 },
  floor: { push: 0.03, drift: 5 },
  banner: { push: 0.05, drift: 7 },
  figure: { push: 0.24, drift: 14 },
  toran: { push: 0.06, drift: 12 },
};

const px = (n) => `${n}px`;

export class DesktopScene {
  constructor(root, config, { reduced = false } = {}) {
    this.root = root;
    this.cfg = config;
    this.reduced = reduced;
    this.stage = root.querySelector('[data-intro-stage]');
    this.t = 0;
    this.running = false;
    this.done = false;
    this.endedCallbacks = [];
    this.failedCallbacks = [];
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this._failed = false;

    root.classList.add('is-scene');
    this.el = document.createElement('div');
    this.el.className = 'pandal';
    this.el.innerHTML = this.markup();
    this.stage.append(this.el);

    const q = (s) => this.el.querySelector(s);
    this.parts = {
      wall: q('[data-wall]'), floor: q('[data-floor]'), banner: q('[data-banner]'), panel: q('[data-panel]'),
      name: q('[data-name]'), light: q('[data-light]'), coins: q('[data-coins]'), figure: q('[data-figure]'),
      art: q('[data-art]'), sticker: q('[data-sticker]'), ripples: [...this.el.querySelectorAll('[data-ripple]')],
      toran: q('[data-toran]'),
    };
    this.parts.wall.style.setProperty('--grain', `url(${grainTexture({ rgb: [60, 0, 10], strength: 30 })})`);

    this.media = new Audio();
    this.media.preload = 'auto';
    this.media.muted = true;
    this.media.src = config.audio;

    this.onResize = () => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.layout();
        this.render(this.t);
      });
    };
    this.onPointer = (e) => {
      this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
  }

  markup() {
    const { name, figure } = this.cfg;
    const w = figure.water;
    return `
      <div class="pandal__wall" data-wall></div>
      <div class="pandal__floor" data-floor></div>
      <div class="pandal__banner" data-banner>
        <div class="banner__panel" data-panel>
          <div class="banner__band"></div>
          ${bannerFlourish()}
          <img class="banner__name" data-name src="${name.src}" alt="শ্রেয়া লাহিড়ী" decoding="async">
          <div class="banner__light" data-light></div>
          <div class="banner__coins" data-coins>
            ${COINS.map((c) => `<span class="coin" style="--x:${c.x};--w:${c.w};--delay:${c.delay}s;--dur:${c.dur}s">${COIN}</span>`).join('')}
            ${SPARKLES.map((s) => `<span class="spark" style="--x:${s.x};--y:${s.y};--s:${s.s};--d:${s.d}s">${SPARKLE}</span>`).join('')}
          </div>
          <div class="banner__figure" data-figure>
            <img class="figure__sticker" data-sticker src="${figure.sticker}" alt="" decoding="async">
            <img class="figure__art" data-art src="${figure.src}" alt="Illustrated Shreya in sunglasses and a bandana, holding a hilsa fish above a lotus" decoding="async">
            <svg class="figure__ripple" viewBox="0 0 ${figure.width} ${figure.height}" aria-hidden="true">
              <ellipse data-ripple cx="${w.x}" cy="${w.y}" rx="${w.rx}" ry="${w.ry}"/>
              <ellipse data-ripple cx="${w.x}" cy="${w.y}" rx="${w.rx}" ry="${w.ry}"/>
            </svg>
          </div>
        </div>
        ${bannerFrame(this.cfg.banner)}
      </div>
      <div class="pandal__toran" data-toran></div>`;
  }

  mount() {
    this.layout();
    window.addEventListener('resize', this.onResize);
    if (!this.reduced) window.addEventListener('pointermove', this.onPointer, { passive: true });

    const images = [this.parts.name, this.parts.art, this.parts.sticker];
    this.ready = Promise.race([
      Promise.all(images.map((img) => img.decode())).then(() => true),
      wait(9000).then(() => false),
    ]).catch(() => false);

    this.ready.then((ok) => {
      if (!ok) return this.fail();
      // With reduced motion the scene waits, composed, for the play button.
      this.render(this.reduced ? this.cfg.duration : 0);
      this.root.classList.add('is-visible');
    });
    this.render(0);
  }

  // ── Layout: everything is placed from the banner, which keeps the original's proportions ──
  layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const { banner, name, figure } = this.cfg;
    const aspect = banner.width / banner.height;
    const bw = Math.min(vw * 0.9, vh * 0.64 * aspect);
    const bh = bw / aspect;
    const u = bh / banner.height; // screen px per banner px
    const bx = (vw - bw) / 2;
    const by = vh * 0.47 - bh / 2;
    const inset = banner.inset * u;
    const k = figure.scale * u;   // screen px per figure px

    const focus = {
      x: bx + (figure.x + figure.focus.x * figure.scale) * u,
      y: by + (figure.y + figure.focus.y * figure.scale) * u,
    };
    this.geo = { vw, vh, bw, bh, u, bx, by, k, focus };

    const { wall, floor, banner: b, panel, name: n, coins, figure: fig, toran: tor } = this.parts;
    Object.assign(b.style, { left: px(bx), top: px(by), width: px(bw), height: px(bh) });
    Object.assign(panel.style, { left: px(inset), top: px(inset), width: px(bw - 2 * inset), height: px(bh - 2 * inset) });
    Object.assign(n.style, {
      left: px((name.x - banner.inset) * u), top: px((name.y - banner.inset) * u),
      width: px(name.w * u), height: px(name.h * u),
    });
    Object.assign(fig.style, {
      left: px((figure.x - banner.inset) * u), top: px((figure.y - banner.inset) * u),
      width: px(figure.width * k), height: px(figure.height * k),
    });
    Object.assign(coins.style, { left: px(22 * u), width: px(230 * u) });
    coins.style.setProperty('--fall', px(bh - 2 * inset + 40));
    coins.style.setProperty('--coin', px(Math.max(22, 100 * u)));

    // Every layer zooms about her face, so the push-in always leans towards her.
    wall.style.transformOrigin = `${px(focus.x + vw * 0.06)} ${px(focus.y + vh * 0.06)}`;
    b.style.transformOrigin = `${px(focus.x - bx)} ${px(focus.y - by)}`;
    fig.style.transformOrigin = `${px(figure.focus.x * k)} ${px(figure.focus.y * k)}`;

    const floorTop = by + bh;
    const floorH = Math.max(40, vh - floorTop);
    Object.assign(floor.style, { top: px(floorTop), height: px(floorH) });
    floor.style.transformOrigin = `${px(focus.x)} ${px(focus.y - floorTop)}`;

    // The toran hangs on the wall just above the banner, its leaves overlapping the top edge — never her head.
    const toranW = bw * 1.04;
    const torX = bx - bw * 0.02, torY = by - bh * 0.062;
    Object.assign(tor.style, { left: px(torX), top: px(torY) });
    tor.style.transformOrigin = `${px(focus.x - torX)} ${px(focus.y - torY)}`;

    // The drawn layers depend only on size; redraw them only when it changes.
    const key = `${Math.round(vw)}x${Math.round(vh)}`;
    if (key !== this.drawnFor) {
      this.drawnFor = key;
      floor.innerHTML = alpona({ width: vw, height: floorH });
      tor.innerHTML = toran({ width: toranW, unit: bh }).svg;
    }
  }

  // ── The story, as a function of time ──
  render(t) {
    const still = this.reduced;
    const p = this.pointer;
    if (!still) {
      p.x += (p.tx - p.x) * 0.05;
      p.y += (p.ty - p.y) * 0.05;
    }

    // 0–0.7s: the wall comes up out of the dark; the alpona is drawn at the threshold.
    this.el.style.opacity = ease.out(segment(t, 0, 0.7));
    this.el.classList.toggle('is-drawn', t >= 0.15);

    // 0.3–1.7s: her name is painted on, left to right.
    this.parts.name.style.setProperty('--wipe', `${lerp(-14, 114, ease.inOut(segment(t, 0.3, 1.7)))}%`);

    // 0.85–1.55s: she steps in as a sticker, as she does in the film; the outline peels away, then returns at the end.
    const enter = ease.out(segment(t, 0.85, 1.55));
    let sticker = t < 1.7 ? 1 : 1 - ease.inOut(segment(t, 1.7, 2.5));
    if (t >= 8.6) sticker = ease.out(segment(t, 8.6, 9.15));
    const pop = 1 + 0.035 * Math.sin(Math.PI * segment(t, 8.6, 9.3));
    this.parts.art.style.opacity = enter;
    this.parts.sticker.style.opacity = Math.min(enter, sticker);

    // 1.1s on: coins start to fall.
    this.el.classList.toggle('coins-on', t >= 1.1);

    // 2.3s and 5.5s: light runs across the letters.
    const g = t >= 5.5 ? segment(t, 5.5, 6.9) : segment(t, 2.3, 3.7);
    this.parts.light.style.setProperty('--gx', `${lerp(-25, 125, ease.inOut(g))}%`);
    this.parts.light.style.opacity = Math.sin(Math.PI * g);

    // 3s: the lotus water ripples.
    this.parts.ripples.forEach((el, i) => {
      const r = segment(t, 2.95 + i * 0.3, 4.7 + i * 0.3);
      el.style.transform = `scale(${lerp(0.55, 1.7, ease.out(r))})`;
      el.style.opacity = r > 0 && r < 1 ? (1 - r) * 0.9 : 0;
    });

    // 3.6–8.5s: the camera leans in on her and back out.
    const c = still ? 0 : t < 3.6 ? 0 : t < 5.4 ? ease.inOut(segment(t, 3.6, 5.4)) : t < 6.5 ? 1 : 1 - ease.inOut(segment(t, 6.5, 8.5));
    const layer = (name) => {
      const d = DEPTH[name];
      return { s: 1 + d.push * c, x: -p.x * d.drift, y: -p.y * d.drift * 0.6 };
    };
    const set = (el, { s, x, y }) => { el.style.transform = `translate(${px(x)}, ${px(y)}) scale(${s})`; };
    set(this.parts.wall, layer('wall'));
    set(this.parts.floor, layer('floor'));
    set(this.parts.toran, layer('toran'));
    const banner = layer('banner');
    set(this.parts.banner, banner);
    const figure = layer('figure');
    const entrance = still ? 1 : 0.94 + 0.06 * enter;
    const lift = still ? 0 : (1 - enter) * this.geo.k * this.cfg.figure.height * 0.035;
    set(this.parts.figure, {
      s: (figure.s / banner.s) * entrance * pop,
      x: (figure.x - banner.x) / banner.s,
      y: (figure.y - banner.y) / banner.s + lift,
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.done = false;
    const t0 = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      this.t = Math.min(this.cfg.duration, (now - t0) / 1000);
      this.render(this.t);
      // The soundtrack follows the picture, never the other way round, so a late start can't make the scene jump.
      const a = this.media;
      if (!a.paused && this.t < this.cfg.duration - 0.3 && Math.abs(a.currentTime - this.t) > 0.2) a.currentTime = this.t;
      if (this.t >= this.cfg.duration) {
        this.running = false;
        if (!this.done) {
          this.done = true;
          this.endedCallbacks.forEach((cb) => cb());
        }
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async play() {
    const ok = await this.ready;
    if (!ok) return 'muted';
    this.start();
    // Try the soundtrack with sound; browsers usually refuse without a gesture, so fall back to muted.
    const attempt = async () => {
      try {
        this.media.muted = false;
        await this.media.play();
        return 'sound';
      } catch {}
      try {
        this.media.muted = true;
        await this.media.play();
      } catch {
        this.media.autoplayRefused = true; // the sound control may start it on click
      }
      return 'muted';
    };
    return Promise.race([attempt(), wait(600).then(() => (this.media.muted ? 'muted' : 'sound'))]);
  }

  // From the play button (reduced motion): a gentle version of the same story, with sound.
  async playFromGesture() {
    await this.ready;
    this.start();
    this.media.muted = false;
    this.media.play().catch(() => {});
  }

  onEnded(cb) { this.endedCallbacks.push(cb); }
  onFailed(cb) { this.failedCallbacks.push(cb); }
  fail() {
    if (this._failed) return;
    this._failed = true;
    this.failedCallbacks.forEach((cb) => cb());
  }
  get failed() { return this._failed; }

  // The medallion is her, sticker and all, on the banner's magenta.
  get portrait() {
    const { figure, background } = this.cfg;
    return { layers: [figure.sticker, figure.src], width: figure.width, focus: figure.focus, background };
  }

  geometry() {
    const { focus, k } = this.geo;
    return { x: focus.x, y: focus.y, r: this.cfg.figure.focus.r, k };
  }

  async freeze({ crossfade }) {
    this.running = false;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (crossfade) this.el.classList.add('is-snapping');
    this.t = this.cfg.duration;
    this.done = true;
    this.render(this.t);
    this.root.classList.add('is-visible');
    if (crossfade) await Promise.all([wait(340), this.fadeAudio(340)]);
    this.media.pause();
    this.el.classList.remove('is-snapping');
  }

  fadeAudio(ms) {
    const a = this.media;
    if (a.muted || a.paused) return Promise.resolve();
    const from = a.volume, start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const k = Math.min(1, (now - start) / ms);
        a.volume = from * (1 - k);
        if (k < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  // As the lens closes, the world around her falls away until she stands on plain magenta — the medallion.
  releaseFrame() {
    this.el.classList.add('is-leaving');
  }

  async fadeAway() {
    this.root.classList.add('is-fading');
    await wait(700);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    this.media.pause();
    this.media.removeAttribute('src');
    this.root.remove();
  }
}

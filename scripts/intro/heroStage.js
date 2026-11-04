import { clamp, wait } from '../lib/motion.js';

const PORTRAIT_BELOW = 0.82; // viewport aspect (w / h) under which the film sits in an arch

// Phones and tablets: the opening film. (Laptops and desktops get the live scene in desktopScene.js.)
// Decides where the frame and the video sit for a given viewport.
// Landscape: full bleed, but never cropping into the safe area — leftover space shows the blurred backdrop.
// Portrait: an arch window exactly as wide as the safe area, at full source height.
function computeLayout(vw, vh, { width: W, height: H, safeArea: S }) {
  const safeCx = S.x + S.w / 2;
  const safeCy = S.y + S.h / 2;
  const aspect = S.w / H;

  if (vw / vh >= PORTRAIT_BELOW) {
    const k = Math.min(Math.max(vw / W, vh / H), Math.min(vw / S.w, vh / S.h));
    const w = W * k, h = H * k;
    const x = w >= vw ? clamp(vw / 2 - safeCx * k, vw - w, 0) : (vw - w) / 2;
    const y = h >= vh ? clamp(vh / 2 - safeCy * k, vh - h, 0) : (vh - h) / 2;
    return {
      mode: 'full', k,
      frame: { x: 0, y: 0, w: vw, h: vh },
      video: { x, y, w, h },
      featherX: w < vw - 1,
      featherY: h < vh - 1,
    };
  }

  const fh = Math.min(vh * 0.74, (vw * 0.84) / aspect);
  const fw = fh * aspect;
  const k = fh / H;
  const w = W * k;
  return {
    mode: 'arch', k,
    frame: { x: (vw - fw) / 2, y: (vh - fh) / 2 - vh * 0.025, w: fw, h: fh },
    video: { x: clamp(fw / 2 - safeCx * k, fw - w, 0), y: 0, w, h: fh },
    featherX: false,
    featherY: false,
  };
}

const px = (n) => `${n}px`;

export class HeroStage {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.stage = root.querySelector('[data-intro-stage]');
    this.frame = root.querySelector('[data-intro-frame]');
    this.box = root.querySelector('[data-intro-media]');
    this.video = root.querySelector('video');
    this.finalFrame = root.querySelector('[data-intro-final]');
    this.canvas = root.querySelector('[data-intro-backdrop]');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.layout = null;
    this.looping = false;

    // Only now does the film start loading — the desktop scene never needs it.
    this.video.poster = config.poster;
    this.video.src = config.src;
    this.finalFrame.src = config.finalFrame;

    this.onResize = () => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => this.applyLayout());
    };
  }

  mount() {
    this.applyLayout();
    window.addEventListener('resize', this.onResize);

    const poster = new Image();
    poster.src = this.video.poster;
    poster.decode().then(() => this.paintBackdrop(poster)).catch(() => {});
    this.finalFrame.decode().catch(() => {});

    this.video.addEventListener('playing', () => {
      this.root.classList.add('is-visible');
      this.root.classList.remove('is-buffering');
      this.loopBackdrop();
    });
    this.video.addEventListener('waiting', () => this.root.classList.add('is-buffering'));

    // On a slow connection, show the poster rather than holding on darkness.
    this.revealTimer = setTimeout(() => {
      this.root.classList.add('is-visible');
      if (this.video.paused) this.root.classList.add('is-buffering');
    }, 1200);
  }

  applyLayout() {
    const l = (this.layout = computeLayout(window.innerWidth, window.innerHeight, this.config));
    const arch = l.mode === 'arch';
    Object.assign(this.frame.style, {
      left: px(l.frame.x), top: px(l.frame.y), width: px(l.frame.w), height: px(l.frame.h),
      borderRadius: arch ? `${px(l.frame.w / 2)} ${px(l.frame.w / 2)} 18px 18px` : '',
    });
    Object.assign(this.box.style, {
      left: px(l.video.x), top: px(l.video.y), width: px(l.video.w), height: px(l.video.h),
    });
    this.frame.classList.toggle('is-arch', arch);
    this.box.classList.toggle('feather-x', l.featherX);
    this.box.classList.toggle('feather-y', l.featherY);
  }

  // A 32×18 copy of the current frame, blurred by CSS, so any space around the film glows in its own colours.
  paintBackdrop(source) {
    this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }

  loopBackdrop() {
    if (this.looping) return;
    this.looping = true;
    const tick = () => {
      if (!this.looping) return;
      if (this.video.readyState >= 2) this.paintBackdrop(this.video);
      if (this.video.paused || this.video.ended) {
        this.looping = false;
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  // Tries with sound first; browsers usually refuse that without a gesture, so falls back to muted.
  async play() {
    const v = this.video;
    try {
      v.muted = false;
      await v.play();
      return 'sound';
    } catch {}
    try {
      v.muted = true;
      await v.play();
      return 'muted';
    } catch {
      return 'blocked';
    }
  }

  // The element whose sound the sound control governs.
  get media() {
    return this.video;
  }

  playFromGesture() {
    return this.video.play();
  }

  onEnded(cb) {
    this.video.addEventListener('ended', cb);
  }

  onFailed(cb) {
    this.video.addEventListener('error', cb, true);
  }

  // The medallion is the film's last frame.
  get portrait() {
    const { finalFrame, width, focus } = this.config;
    return { layers: [finalFrame], width, focus, background: null };
  }

  // True when the browser has given up on the file. (The src is set in the constructor, in the same task as
  // main.js attaches onFailed, so a later error event can't be missed. networkState is no guide here: it reads
  // NO_SOURCE for a moment while the browser is still choosing the file.)
  get failed() {
    return Boolean(this.video.error);
  }

  // Where the focus circle sits on screen right now.
  geometry() {
    const { frame, video, k } = this.layout;
    const f = this.config.focus;
    return { x: frame.x + video.x + f.x * k, y: frame.y + video.y + f.y * k, r: f.r, k };
  }

  // Locks the picture on the exact final frame. After a skip, cross-fades into it instead of cutting.
  async freeze({ crossfade }) {
    clearTimeout(this.revealTimer);
    window.removeEventListener('resize', this.onResize);
    this.root.classList.add('is-visible', 'is-final');
    this.root.classList.remove('is-buffering');
    if (crossfade) {
      this.root.classList.add('is-final-fade');
      await Promise.all([wait(280), this.fadeAudio(280)]);
    }
    this.video.pause();
  }

  // Lets go of the arch once the lens is inside it.
  releaseFrame() {
    this.root.classList.add('is-leaving');
  }

  fadeAudio(ms) {
    const v = this.video;
    if (v.muted || v.paused) return Promise.resolve();
    const from = v.volume;
    const start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const t = Math.min(1, (now - start) / ms);
        v.volume = from * (1 - t);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  async fadeAway() {
    this.root.classList.add('is-fading');
    await wait(700);
  }

  destroy() {
    this.looping = false;
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.querySelectorAll('source').forEach((s) => s.remove());
    this.video.load();
    this.root.remove();
  }
}

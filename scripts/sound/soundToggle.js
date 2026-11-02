// One control for sound. During the intro it mutes/unmutes the film's own soundtrack;
// afterwards it plays/pauses the background music from config (and hides itself if there is none).
export function createSoundToggle(button, { video, music }) {
  const label = button.querySelector('[data-sound-label]');
  let on = false;
  let phase = 'intro';
  let track = null;
  let fade = 0;

  if (music.src) {
    track = new Audio();
    track.loop = true;
    track.preload = 'auto';
    track.addEventListener('error', () => {
      track = null;
      if (phase === 'music') hide();
    });
    track.src = music.src;
  }

  function render() {
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('is-on', on);
    if (phase === 'intro') label.textContent = on ? 'Sound on' : 'Sound off';
    else label.textContent = on ? (music.title || 'Music on') : 'Music off';
  }

  function hide() {
    button.classList.add('is-hidden');
    button.setAttribute('tabindex', '-1');
  }

  // Volume is read-only on iOS; there the fade simply becomes a cut.
  function rampTo(target, ms, done) {
    cancelAnimationFrame(fade);
    const from = track.volume;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      track.volume = from + (target - from) * t;
      if (t < 1) fade = requestAnimationFrame(tick);
      else done?.();
    };
    fade = requestAnimationFrame(tick);
  }

  function apply() {
    if (phase === 'intro') {
      video.muted = !on;
      // If the browser refused to start the soundtrack at all, this click is the gesture that allows it.
      if (on && video.autoplayRefused) {
        video.autoplayRefused = false;
        video.play().catch(() => {});
      }
      return;
    }
    if (!track) return;
    if (on) {
      track.volume = 0;
      track.play().then(() => rampTo(music.volume, 1400)).catch(() => set(false));
    } else {
      rampTo(0, 500, () => track.pause());
    }
  }

  function set(value) {
    on = value;
    render();
    apply();
  }

  button.addEventListener('click', () => set(!on));
  render();

  return {
    set,
    get on() { return on; },
    // Called as the intro ends: hand the control over to the music, or retire it.
    handOff() {
      phase = 'music';
      if (!track) return hide();
      render();
      apply();
    },
  };
}

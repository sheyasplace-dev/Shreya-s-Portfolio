import { config } from './config.js';
import { prefersReducedMotion } from './lib/motion.js';
import { HeroStage } from './intro/heroStage.js';
import { DesktopScene } from './intro/desktopScene.js';
import { circleReveal } from './intro/circleReveal.js';
import { createHello } from './scenes/hello.js';
import { createAbout } from './scenes/about.js';
import { createWork } from './scenes/work.js';
import { createExperience } from './scenes/experience.js';
import { createCalendar } from './scenes/calendar.js';
import { createCasefile } from './scenes/casefile.js';
import { createInternships } from './scenes/internships.js';
import { createProjects } from './scenes/projects.js';
import { createFlock } from './scenes/flock.js';
import { createBlogs } from './scenes/blogs.js';
import { createTools } from './scenes/tools.js';
import { createJack } from './scenes/jack.js';
import { createContact } from './scenes/contact.js';
import { createSoundToggle } from './sound/soundToggle.js';

const reduced = prefersReducedMotion();
const body = document.body;
const introEl = document.getElementById('intro');
const helloEl = document.getElementById('hello');
const rim = document.querySelector('[data-iris-rim]');
const skipButton = document.querySelector('[data-skip]');
const playButton = document.querySelector('[data-play]');

// The intro always starts at the top of the page, even on reload.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// Laptops and desktops (mouse or trackpad, wide, landscape) get the live scene; phones and tablets get the film.
const desktop = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches
  && window.innerWidth / window.innerHeight >= 1.25;

const hero = desktop
  ? new DesktopScene(introEl, config.scene, { reduced })
  : new HeroStage(introEl, config.intro);
const hello = createHello(helloEl);
const about = createAbout(document.querySelector('[data-about]'), { reduced });
const work = createWork(document.querySelector('[data-work]'), { reduced });
const experience = createExperience(document.querySelector('[data-exp]'), { reduced });
const casefile = createCasefile(document.querySelector('[data-casefile]'), { reduced });
const calendar = createCalendar(document.querySelector('[data-cal]'), { reduced, casefile });
const internships = createInternships(document.querySelector('[data-ride]'), { reduced, casefile });
const projects = createProjects(document.querySelectorAll('[data-proj]'), { casefile });
const flock = createFlock(document.querySelector('[data-flock]'), { reduced });
const blogs = createBlogs(document.querySelector('[data-blogs]'));
const tools = createTools(document.querySelector('[data-tools]'), { reduced });
const jack = createJack(document.querySelector('[data-jack]'), { reduced });
const contact = createContact(document.querySelector('[data-contact]'), { reduced });
hello.usePortrait(hero.portrait);
const sound = createSoundToggle(document.querySelector('[data-sound]'), {
  video: hero.media,
  music: config.music,
});

helloEl.inert = true;
hero.mount();
// Let the film open on its own before the controls drift in.
setTimeout(() => body.classList.add('chrome-ready'), reduced ? 0 : 1400);

let finished = false;

async function finishIntro({ skipped = false } = {}) {
  if (finished) return;
  finished = true;
  body.dataset.phase = 'transition';
  playButton.hidden = true;

  await Promise.all([hero.freeze({ crossfade: skipped }), hello.ready()]);
  sound.handOff();

  if (reduced) {
    hello.fillMedallion();
    await hero.fadeAway();
  } else {
    await circleReveal({
      intro: introEl,
      stage: hero.stage,
      rim,
      from: hero.geometry(),
      to: hello.medallionTarget(),
      onProgress: (p) => {
        hello.settle(p);
        if (p >= 0.3) hero.releaseFrame();
      },
    });
    hello.fillMedallion();
  }

  hero.destroy();
  rim.remove();
  helloEl.inert = false;
  body.dataset.phase = 'hello';
  hello.reveal();
  about.start();
  work.start();
  experience.start();
  calendar.start();
  internships.start();
  projects.start();
  flock.start();
  blogs.start();
  tools.start();
  jack.start();
  contact.start();
}

function offerPlay() {
  introEl.classList.add('is-visible');
  playButton.hidden = false;
  playButton.addEventListener('click', async () => {
    playButton.hidden = true;
    sound.set(true);
    try {
      await hero.playFromGesture();
    } catch {
      finishIntro({ skipped: true });
    }
  }, { once: true });
}

async function start() {
  if (hero.failed) return finishIntro({ skipped: true });
  // With reduced motion, the film waits to be asked for.
  if (reduced) return offerPlay();

  // If autoplay hasn't even fetched the film's metadata after a long wait, go straight to the page.
  // (Not armed while the play prompt waits on a tap — iOS loads nothing until then.)
  const watchdog = desktop ? 0 : setTimeout(() => {
    if (hero.failed || hero.media.readyState === 0) finishIntro({ skipped: true });
  }, 12000);
  const result = await hero.play();
  if (result === 'blocked') {
    clearTimeout(watchdog);
    return offerPlay();
  }
  sound.set(result === 'sound');
}

hero.onEnded(() => finishIntro());
hero.onFailed(() => finishIntro({ skipped: true }));
skipButton.addEventListener('click', () => finishIntro({ skipped: true }));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && body.dataset.phase === 'intro') finishIntro({ skipped: true });
});

start();

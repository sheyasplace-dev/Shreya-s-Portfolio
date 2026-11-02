# Pieces of Me — Shreya Lahiri

Plain HTML, CSS and ES modules. No build step.

```sh
npm run dev        # or: node server.mjs
# → http://localhost:5173
```

Use the included server (or any server with HTTP range support). Opening `index.html` directly from disk won't load the modules, and Safari won't play the video without range requests.

## How it fits together

```
index.html                     page markup: the hello scene underneath, the intro on top
scripts/
  config.js                    film and scene geometry, focus circles, music file
  main.js                      picks film or scene, then: play → end/skip → transition → hello
  intro/heroStage.js           phones/tablets: the film (full-bleed or arch), blurred backdrop, final-frame freeze
  intro/desktopScene.js        laptops/desktops: the live scene and its 10-second timeline
  intro/sceneArt.js            the scene's drawn parts: banner border, gold flourish, coins, toran, alpona
  intro/circleReveal.js        the zoom-out iris transition (shared)
  scenes/hello.js              the "Well, hello there." screen and its medallion
  scenes/about.js              "tell me about yourself": the tiger's scroll-linked entrance, the words' reveal
  sound/soundToggle.js         one sound control: the film's audio, then the background music
  lib/motion.js                easing and animation helpers
  lib/handDrawn.js             wobbly lines and marigold ruffles for the drawn parts
  lib/texture.js               paper grain
styles/
  base.css                     palette (sampled from the film), type, globals
  intro.css                    the film, its frame and the play prompt
  scene.css                    the desktop scene
  hello.css                    the hello scene
  about.css                    the about section and the scroll cue
  chrome.css                   floating sound and skip controls
assets/video/                  hero.mp4, hero-poster.jpg (first frame), hero-final.jpg (exact last frame)
assets/about/                  tiger-1200.webp, tiger-2243.webp (the sofa-and-tiger illustration, cut out)
assets/scene/                  character.png, sticker.png (her outline), name.png (the original lettering), intro-audio.m4a
assets/audio/                  put the background music here
```

New scenes go inside `<main id="hello">`, after the hello section.

## Compositions by screen

- **Laptop / desktop** (mouse or trackpad, at least 1100px wide, landscape): a live scene built from the original artwork's layers. The banner hangs on a wall under a toran, with alpona at its foot, and the film's story plays out on a 10-second timeline synced to its soundtrack. The film itself is never downloaded.
- **Phones and tablets in portrait**: the film in an arch, over a blurred glow of the film.
- **Tablets in landscape**: the film full-bleed, never cropping the figure.

## The desktop scene's assets

The images in `assets/scene/` were cut out of the supplied artwork: the checkerboard backgrounds were painted in, not transparent. The cut-outs also remove the watermarks that sat on them.

- `character.png`: her figure on a padded canvas (924 × 1408). The bottom edge is a straight cut, hidden behind the banner's lower border.
- `sticker.png`: her gold-and-ink outline on the same canvas, so the two always line up.
- `name.png`: the original lettering, recoloured to the banner's orange (`#ff6f17`).
- `intro-audio.m4a`: the film's soundtrack, so the scene keeps its sound.

Positions in `config.scene` are in the original banner's own pixels (3168 × 1344), so they can be checked against the artwork directly. To use a new figure, replace both PNGs on the same canvas and update `figure.width`, `height` and `focus`.

## The about section

Edit the answers directly in `index.html`, inside `<section id="about">`. The four answers wrapped in
`<span class="fact__todo">` are placeholders: replace the text and remove the span. To add a field, copy a
`<div class="fact">` block, give it the next Bengali numeral (৬, ৭ …) and the next `--i`; add `fact--wide` if it
should take a full row. (The Bengali font is subset to the characters on the page: if you add new Bengali
text, add its characters to the `text=` list in the Noto Serif Bengali link in `<head>`.)

The tiger illustration was cut out of its painted-in checkerboard; the cut-out also removes the watermark that
sat in its corner. The sofa's far arm was smeared in the source, so it is placed to run off the right edge of the
page. Its motion is tuned in `scripts/scenes/about.js`: `range` is how much scrolling the walk takes, `prowl` its
easing, and `land` where on screen it comes to rest.

## Replacing the video

1. Replace `assets/video/hero.mp4`. Keep it H.264 MP4 with "fast start" (`ffmpeg -i in.mov -c:v libx264 -crf 20 -preset slow -c:a aac -movflags +faststart hero.mp4`).
2. Re-export `hero-poster.jpg` (its first frame) and `hero-final.jpg` (its **exact last frame**). The transition and medallion are built on that still, so it must match the last frame or the handoff will visibly jump.
   `ffmpeg -sseof -0.1 -i hero.mp4 -frames:v 1 -update 1 -q:v 2 hero-final.jpg`
3. In `scripts/config.js`, update `width`/`height`, the `safeArea` (the part of the frame that must never be cropped) and `focus` (the circle the transition closes onto, which becomes the medallion). All values are in the video's own pixels.

## Adding music

Put a file you have the rights to in `assets/audio/` and set it in `scripts/config.js`:

```js
music: { src: 'assets/audio/theme.mp3', title: 'Song name', volume: 0.55 },
```

The sound control then carries over after the intro. If the visitor turned sound on during the film, the music fades in as the page appears. While `src` is `null`, the control quietly retires after the intro.

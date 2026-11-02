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
  scenes/work.js               the curtain's fall and rise (scroll-linked), and the work page's reveal
  scenes/curtainArt.js         the curtain itself, drawn as SVG: spotted olive cloth, scallops, white teeth
  scenes/jamdani.js            the woven Jamdani border (with its river and boats), drawn thread by thread as SVG
  scenes/experience.js         the experience page: the border's drifting boats, the route beside the words
  scenes/calendar.js           where I've worked: the wall calendar's page flips and its index
  scenes/casefile.js           the full page that opens over the site (calendar "know more", bus windows)
  scenes/internships.js        early internships: the G3 bus driving in, its blinds, its stops' pages
  scenes/projects.js          the open source line: picture on hover, its own page on click
  scenes/busArt.js             the G3 itself, drawn as SVG (and as a line drawing for the stop pages)
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
  work.css                     the curtain and the work page
  experience.css               the experience page
  calendar.css                 the wall calendar
  casefile.css                 the page that opens on "know more"
  internships.css              the yellow bus page, and the kraft-paper stop pages
  chrome.css                   floating sound and skip controls
assets/video/                  hero.mp4, hero-poster.jpg (first frame), hero-final.jpg (exact last frame)
assets/work/                   fish-car-*.webp (the fish-car illustration, cut out of its background)
assets/about/                  sofa-*.webp (her on the sofa) and tiger-*.webp (the tiger alone), two layers on one frame
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

The illustration is two layers on one shared 2241×1731 frame, so at rest they line up exactly: `sofa-*.webp`
(her on the sofa, which stays put) and `tiger-*.webp` (the standing tiger alone, which travels). Both were cut out
of their painted-in checkerboards, which also removes the watermarks in their corners. The sofa layer comes from
the full illustration with the lying tiger taken out; the part of the sofa it hid (the right half of the back,
seat and rail, the far arm and leg) is rebuilt from the visible sofa: its stripes tiled on, the arm and leg
mirrored from the near end. If you ever have the sofa artwork without the tiger, drop it in as `sofa-*.webp`
on the same frame. The tiger's motion is tuned in `scripts/scenes/about.js`: `range` is how much scrolling the
walk takes, `prowl` its easing, `stride` the gentle rise and fall, and `land` where on screen it comes to rest.

## The curtain and the work page

After the about section, the page holds still while an olive curtain falls over it; scrolling on, the curtain
rises with the work page, and its scalloped hem stays at the top of that page as a valance. It is drawn as SVG in
`scripts/scenes/curtainArt.js` (in the style of the supplied curtain artwork, which was too small to stretch
across a screen), so it is sharp at any size; colours are at the top of that file. In `scripts/scenes/work.js`,
`fall` and `hold` set how much scrolling the drop and the closed beat take. With reduced motion there is no
drop: the valance simply sits at the top of the work page.

"work experience" is set in Fredoka and কাজের অভিজ্ঞতা in Baloo Da 2 (subset to those characters: add any new
Bengali characters to its `text=` list in `<head>`). The fish-car illustration was lifted off its background,
which also removes the watermark in its corner.

## The experience page

A dictionary entry under a Jamdani border. The text lives in `index.html` (`<section id="experience">`); **bold**
phrases are `<b>`. The border is woven in `scripts/scenes/jamdani.js` on a grid of square threads (colours in
`JAMDANI`, motifs as little text drawings such as `FLOWER` and `BOAT`). Its river carries boats that sail on as
the page scrolls. Beside the words, a dotted route draws itself down the margin, reaching a woven waypoint at
each paragraph and ending at a boat; the stops are placed at each `<p>`, so new paragraphs get one too.

## Where I've worked (the calendar)

One calendar page per company, in `index.html` under `<section id="worked">`, latest first. In each
`<article class="cal-page">`:
- **Photo:** `assets/companies/<name>-900.webp` and `-1600.webp`; `object-position` on the `<img>` sets which
  part of the photo stays in frame.
- **Role and dates:** replace the `<span class="todo">` placeholders (in the page and in its story).
- **Know more:** each page's `<template class="cal-page__story">` is the full page that opens over the site
  (styled by `styles/casefile.css`): intro, a full-width photo with a phrase spaced across it, a box of numbered
  points with a second photo, and "what I took away". Text marked `class="todo"` is placeholder: replace it and
  drop the class. Back (or the browser's back button, or Escape) returns to the calendar where you left it.

The backdrop is the khaki Jamdani from `khakiField()` and `khakiBorder()`, rewoven in cream on the pages' red, (`scripts/scenes/jamdani.js`), faint behind the
calendar. A new company is a new `<article>` plus a button in `.cal__index`; the flip adapts to any number of pages.

## Early internships (the G3)

In `index.html` under `<section id="internships">`. Each company appears twice: on its window's blind
(`<span class="bus__label">`) and in its stop page, a `<template data-intern=… data-label=…>` (the label is
used for "next:"). Replace "Company one/two/three" in both, and the `.todo` placeholders in the template. The
five numbered points match the numbered callouts on the bus drawing. The lettering on the bus ("KSRTC",
"G3") is in `scripts/scenes/busArt.js`. The painting behind it is
`assets/internships/roadside-*.webp` (the bus it was painted with, and a watermark, painted out); the bus
parks over the space it left, positioned in percentages of the painting in `styles/internships.css`.

## Open source

`<section id="open-source">` in `index.html`. The picture shown on hover is the `<img>` in `.proj__peek`
(`assets/projects/cover-*.webp`); the page that opens on click is its `<template data-proj-page>`, where the
`.todo` placeholders go.

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

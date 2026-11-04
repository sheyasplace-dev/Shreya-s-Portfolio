# Content guide

All the copy on the site is in `index.html`. This is how to change or add each kind of thing. Section ids are the ones in the page, so searching for `id="worked"` or `data-cal` gets you to the right place.

After any change, run `npm run check`. It catches the most common mistake, a path to a file that isn't there.

## About ("tell me about yourself")

`<section id="about">`. The answers are `<div class="fact">` blocks. To add one, copy a block, give it the next Bengali numeral (৬, ৭, …) and the next `--i` value, and add `fact--wide` if it should take a whole row.

Bengali text is loaded from Google Fonts as a subset (`&text=…` in the `<head>`), so a new Bengali character won't render until it's added to that list. The same goes for the heading in the work section (Baloo Da 2).

## Experience

`<section id="experience">` is a dictionary-style entry. The paragraphs are plain `<p data-reveal>` with `<b>` for the bold phrases. The route that draws itself down the margin places a stop at every `<p>`, so a new paragraph gets one automatically.

## Where I've worked (the calendar)

`<section id="worked">`, one `<article class="cal-page" data-page>` per company, latest first. Each has:

- a photo in `assets/companies/` (`<name>-900.webp` and `-1600.webp`; `object-position` on the `<img>` chooses what stays in frame);
- an `<h3 id="cal-<name>">`, which also decides the page's hash: `work-<name>`;
- a `<template class="cal-page__story">` holding the "know more" page.

To add a company, add a new `<article>` and a button in `.cal__index` (`<button data-goto="3">`). The flip works for any number of pages, and the "next:" link in the overlay follows the order of the pages.

A company's own photos (the AI+ event photos, the Arctus team photo, and so on) are in `assets/companies/<name>/`.

### Page structure

The story pages share one set of classes (styles in `styles/casefile.css`):

| Block | Purpose |
| --- | --- |
| `.case__intro` | the title, dates and a short summary, with `.case__marks` for the headline numbers |
| `.case__band` | a full-width photo with a phrase spaced across the top |
| `.case__box` | the "what I did" points: `.case__list` for numbered points, or `.case__groups` with `.case__group` headings |
| `.case__room` | a free-form section of photos and notes (used by AI+, Arctus and Wayground) |

Bold lead-ins inside a list item need the item's content wrapped in a `<span>`, like `<li><span><b>…</b> …</span></li>`, otherwise the grid layout puts the bold text in its own column.

## Early internships (the bus)

`<section id="internships">`. Each company is in two places: a window on the bus (`<span class="bus__label">`) and a `<template data-intern="intern-1" data-label="Mave">` further down with the stop's page. `data-label` is the company name and is also used for the "next:" button.

The blueprint on each stop page has up to five numbered callouts, one for each of the first five points in `.ticket__parts` (set in `scripts/scenes/internships.js`). A sixth point is still listed; it just has no marker on the drawing.

The painting behind the bus is `assets/internships/roadside-*.webp`. The words on it ("early internships", "click the windows to know more") are part of the image, so changing them means editing the image.

## Open source and website design

Both are `<section class="proj" data-proj="…">` lines. Hovering shows the picture in `.proj__peek`; clicking opens that section's page, a `<template data-proj-page>` inside the section.

The website design page is a grid of project cards (`a.wcard[data-open-case="web-2"]`). Each card opens its own page, a `<template data-web-page="web-2" data-label="…">`. To add a project:

1. Copy a `<template data-web-page>` and give it a new id (`web-4`).
2. Add a `.wcard` to the grid with `data-open-case="web-4"`.
3. Put its pictures in `assets/websites/web-4/`. Pictures are in `.wproj__row` rows; each `<figure>` sets its own aspect ratio with `style="--ar:…"` so a row always fills the width at one height.

## Blogs

`<section id="blogs">`, one `<li class="blog">` per post, newest first. Each links out through `data-href` (the Substack URL). A post with an empty `data-href` is shown but isn't clickable. Covers are in `assets/blogs/` and can be any 3:2 image.

## Tools

`<section id="tools">`. Each tool is an `<li class="sticker" data-sticker style="--i:N">` with its image in `assets/tools/stack/` (transparent background, white die-cut edge). The alt text is the tool's name, since the stickers have no visible labels. Stickers land in positions chosen by a seeded random layout, so adding one re-spaces the others.

## What I bring to the table

`<section id="table">`. Each dish is a `<button class="katori" data-dish="N">` placed on the thali with `--x`, `--y`, `--w`, `--h` (percentages of the plate). Its line on the menu card is the matching `.menu__item`.

## Jack of all trades

`<section id="jack">`. Each skill is a `.cell` button with `data-capability` (its name) and `data-target` (the hash of the page it opens). Targets are:

| Skill | Opens |
| --- | --- |
| community events | AI+ |
| newsletter and content | AI+ |
| partnerships | a chooser page (`<template data-pick-page="partnerships">`) listing AI+, Joveo and Arctus |
| social media | Mave |
| web and landing pages | Website design |
| lifecycle and email | Wayground |

## Contents and the section rail

- **Contents** (`<nav id="contents">`): each entry is `<a href="#id" data-jump>`. Add `data-jump-align="end"` to land with the section's bottom at the bottom of the screen, which is used for Website design so the birds' sky doesn't start to drop.
- **Rail** (`<nav data-rail>`): one `<a data-rail-item href="#id" data-tone="light|dark">` per section. `data-tone` is the section's background, which sets whether the ticks are ink or cream.

## Contact and socials

`<footer id="contact">`. LinkedIn, Substack and GitHub are plain anchors in `<nav class="post__social">`; the email address is a `mailto:` link on the postcard. The GitHub link currently points at `https://github.com/`, so it needs a profile URL.

## Open items

Things that are still unfinished in the content:

- The GitHub link in the contact section has no profile URL yet.
- There's no background music. Set `music.src` in `scripts/config.js` when there is (see [assets.md](assets.md)).

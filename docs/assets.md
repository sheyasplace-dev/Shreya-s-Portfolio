# Assets

Everything in `assets/` is referenced from `index.html`, the stylesheets or a script. `npm run check` fails if one of those references points at a missing file, and lists any asset that nothing points to.

## Layout and formats

| Folder | What's in it |
| --- | --- |
| `video/` | `hero.mp4` (the phone and tablet intro), `hero-poster.jpg` (its first frame) and `hero-final.jpg` (its exact last frame) |
| `scene/` | the desktop intro's layers: `character.webp`, `sticker.webp`, `name.webp`, and `intro-audio.m4a` (the film's soundtrack) |
| `about/`, `contents/`, `work/`, `projects/`, `contact/`, `birds/`, `table/`, `jack/` | the illustration for each section |
| `blogs/` | the post covers and the leaves around that page |
| `tools/` | the lotus print behind the stickers; `tools/stack/` (under `assets/`) has one die-cut sticker per tool and the figure |
| `internships/` | the painted roadside behind the bus |
| `companies/` | each job's photos. `companies/<name>/` holds the photos used inside that job's page |
| `websites/web-N/` | the pictures for each website project |
| `audio/` | empty for now (see "Adding music") |

Images are WebP, apart from the two video stills (JPEG) and the favicons in the project root (PNG and ICO).

**Naming.** An image that ships at more than one size carries its width in the name (`roadside-1600.webp`, `roadside-2164.webp`) and is used with `srcset`. `-full` marks the largest version.

**Size.** There are about 100 files and the whole `assets/` folder is around 14 MB, of which the 4.7 MB `hero.mp4` is the biggest part. No other file is over 1 MB. Phones and tablets are the only ones who download the video.

## The desktop intro's layers

The desktop intro is built live from the layers in `assets/scene/`, drawn on the original banner's own proportions (3168 × 1344). Positions in `config.scene` are in that banner's pixels, so they can be compared directly against the artwork.

- `character.webp` is the figure on a padded 924 × 1408 canvas. Its bottom edge is a straight cut, hidden behind the banner's lower border.
- `sticker.webp` is her outline on the same canvas, so the two always line up.
- `name.webp` is the lettering, recoloured to the banner's orange (`#ff6f17`).

To use a different figure, replace `character.webp` and `sticker.webp` on one shared canvas and update `figure.width`, `figure.height` and `figure.focus` in `scripts/config.js`.

## The about illustration

The about section uses two layers on one shared 2241 × 1731 frame: `sofa-*.webp` (her on the sofa, which stays still) and `tiger-*.webp` (the standing tiger, which walks in). At rest they line up exactly. The sofa layer is the full illustration with the lying tiger removed. The tiger's movement is in `scripts/scenes/about.js`: `prowl` (at the top) is its easing, and where the path is calculated, `range` is how much scrolling the walk takes and `land` is where on screen it settles.

## Replacing the intro video

The intro and its handover depend on three files and a few numbers, so replace them together:

1. Replace `assets/video/hero.mp4`. It needs to be H.264 with the index at the front of the file ("fast start") so it can start playing before it has finished downloading:

   ```sh
   ffmpeg -i in.mov -c:v libx264 -crf 20 -preset slow -c:a aac -movflags +faststart hero.mp4
   ```

2. Re-export both stills. `hero-final.jpg` must be the video's **exact last frame**. The transition and the medallion on the hello screen are built on that still, and if it's off by a frame the handover visibly jumps.

   ```sh
   ffmpeg -sseof -0.1 -i hero.mp4 -frames:v 1 -update 1 -q:v 2 hero-final.jpg
   ```

3. In `scripts/config.js`, update `intro.width` and `intro.height`, `intro.safeArea` (the part of the frame that must never be cropped) and `intro.focus` (the circle the transition closes onto, which becomes the medallion). All of these are in the video's own pixels.

## Adding music

Put an audio file you have the rights to in `assets/audio/` and set it in `scripts/config.js`:

```js
music: { src: 'assets/audio/theme.mp3', title: 'Song name', volume: 0.55 },
```

The sound button then carries over from the film's soundtrack to the music once the intro is over. If the visitor turned sound on during the film, the music fades in as the page appears. While `src` is `null` the button hides itself after the intro.

## Favicons

`favicon.ico`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` and `icon-512.png` live in the project root, where browsers look for them by default. They're linked in `<head>` and listed in `site.webmanifest`. The `?v=2` on the links is a cache-buster; bump it if you change the icons.

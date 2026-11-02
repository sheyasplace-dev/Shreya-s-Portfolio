// Everything you might want to swap lives here.

export const config = {
  // Phones and tablets: the opening film.
  intro: {
    src: 'assets/video/hero.mp4',
    poster: 'assets/video/hero-poster.jpg',
    finalFrame: 'assets/video/hero-final.jpg',

    // Source dimensions of hero.mp4. Update these if you replace the video.
    width: 1280,
    height: 720,

    // Region of the source (in source pixels) that must never be cropped:
    // the figure, the lotus and the pedestal — and the fish at the peak of the push-in (x 450–856).
    safeArea: { x: 420, y: 40, w: 460, h: 680 },

    // The circle the transition closes onto, in source pixels of the final frame.
    // It becomes the medallion above "Well, hello there."
    focus: { x: 650, y: 258, r: 190 },
  },

  // Laptops and desktops: the same story, staged live from the original artwork's layers.
  scene: {
    audio: 'assets/scene/intro-audio.m4a', // the film's own soundtrack
    duration: 10,

    // The original banner, rebuilt at its own 3168 × 1344 proportions. All values below are in its pixels.
    banner: {
      width: 3168,
      height: 1344,
      inset: 48,                       // where the panel meets the inked border
      band: { top: 0.734, bottom: 0.715 }, // left edge of the red band, as a fraction of the panel
    },
    name: { src: 'assets/scene/name.png', x: 148, y: 33, w: 2910, h: 1229 },
    figure: {
      src: 'assets/scene/character.png',
      sticker: 'assets/scene/sticker.png',
      width: 924,
      height: 1408,
      x: 1184,
      y: 104,
      scale: 0.9, // so she stands as tall in the banner as she does in the film
      // In the figure's own pixels:
      focus: { x: 470, y: 440, r: 380 },     // the circle the transition closes onto (face and fish)
      water: { x: 452, y: 1206, rx: 250, ry: 50 }, // the lotus bowl, for the ripple
    },
    background: '#ff31a0', // the banner's magenta; the medallion's ground
  },

  music: {
    // Drop an audio file you have the rights to into assets/audio/ and point to it,
    // e.g. 'assets/audio/theme.mp3'. While this is null, the player stays hidden after the intro.
    src: null,
    title: '',
    volume: 0.55,
  },
};

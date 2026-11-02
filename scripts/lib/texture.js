// Paper grain: per-pixel noise in a single colour, as a tileable PNG data URL.
// (An SVG turbulence tile shows seams in WebKit.)
export function grainTexture({ size = 192, rgb = [64, 12, 0], strength = 22 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = rgb[0];
    image.data[i + 1] = rgb[1];
    image.data[i + 2] = rgb[2];
    image.data[i + 3] = Math.random() * strength;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/*!
ReactDrops Component License 1.0 — see ./LICENSE.txt
Copyright (c) 2026 ReactDrops
*/

/** Seeded static photographic grain stamp for contour / gradient compositing. */
export function createCanvasGrain(
  width: number,
  height: number,
  ratio: number,
  seed: number,
): HTMLCanvasElement {
  const stamp = document.createElement("canvas");
  const w = Math.max(1, Math.round(width * ratio));
  const h = Math.max(1, Math.round(height * ratio));
  stamp.width = w;
  stamp.height = h;
  const ctx = stamp.getContext("2d");
  if (!ctx) return stamp;

  const image = ctx.createImageData(w, h);
  const data = image.data;
  let state = (Math.round(seed) ^ 0x9e3779b9) >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < w * h; i++) {
    const value = Math.floor(random() * 256);
    const offset = i * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return stamp;
}

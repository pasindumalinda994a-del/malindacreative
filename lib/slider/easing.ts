// Easing curves turn a straight 0 -> 1 progress into a more natural motion.
// Each one takes `t` (0 = start, 1 = end) and returns the eased value.
// Visual previews of these curves: https://easings.net

export const easings = {
  /** Constant speed. Feels mechanical. */
  linear: (t: number) => t,
  /** Gentle slow-down at the end. */
  easeOutQuad: (t: number) => 1 - (1 - t) ** 2,
  /** Smooth slow-down. A good default. */
  easeOutCubic: (t: number) => 1 - (1 - t) ** 3,
  /** Stronger slow-down. */
  easeOutQuart: (t: number) => 1 - (1 - t) ** 4,
  /** Very fast start, long soft landing. */
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  /** Overshoots the end a little, then settles back. Playful. */
  easeOutBack: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  /** Slow start and slow end. Cinematic. */
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  /** Sample landing curve: fast open, long soft settle. cubic-bezier(0.8, 0, 0.02, 1). */
  hop: cubicBezier(0.8, 0, 0.02, 1),
};

/** Unit-interval cubic bezier, solved for x so the result is y at that time. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      const slope = sampleDX(t);
      if (Math.abs(error) < 1e-6) break;
      if (Math.abs(slope) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - error / slope));
    }
    return sampleY(t);
  };
}

export type EaseName = keyof typeof easings;

/** The same curves written for CSS, used by the text animation. */
export const cssEasings: Record<EaseName, string> = {
  linear: "linear",
  easeOutQuad: "cubic-bezier(0.5, 1, 0.89, 1)",
  easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
  easeOutQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
  easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeInOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",
  hop: "cubic-bezier(0.8, 0, 0.02, 1)",
};

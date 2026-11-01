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
};

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
};

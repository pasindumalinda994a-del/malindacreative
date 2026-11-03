import type { TopographicPreset } from "@/lib/topographic/presets";

/**
 * Contour background behind the featured-project strip.
 * Colors come from the paper & ink tokens in app/globals.css
 * (via --topographic-flow-background / --topographic-flow-ink).
 */
export const topographicConfig = {
  /** Named look from lib/topographic/presets. */
  preset: "paper" as TopographicPreset,
  /** Contour drift speed (0 = static). */
  speed: 1.1,
  /** Contour count density. */
  density: 5,
  /** Ink opacity: faint enough that the slides and type stay primary. */
  opacity: 0.42,
  /** No pointer reshape — slider owns input. */
  hover: 0,
  paused: false,
  /** Narrow screens (matches animationConfig.narrowBreakpointPx). */
  narrow: {
    speed: 0.7,
    density: 3,
    opacity: 0.28,
  },
};

import type { AnimationConfig } from "@/config/animationConfig";
import { easings } from "./easing";

export type IntroStaggerFrom = "center" | "start";

/**
 * Decides the order in which slides appear during the intro.
 * Takes each slide's starting position (positive = top / left side of the screen)
 * and returns a rank per slide: 0 appears first, 1 second, and so on.
 */
export function createIntroOrder(startPositions: number[], staggerFrom: IntroStaggerFrom) {
  const slideIndexes = startPositions.map((_, index) => index);

  slideIndexes.sort((a, b) =>
    staggerFrom === "center"
      ? Math.abs(startPositions[a]) - Math.abs(startPositions[b]) // Closest to the middle first.
      : startPositions[b] - startPositions[a], // Top (or left) first.
  );

  const ranks: number[] = [];
  slideIndexes.forEach((slideIndex, rank) => {
    ranks[slideIndex] = rank;
  });
  return ranks;
}

/**
 * How far one slide is through its intro: 0 = not started, 1 = finished.
 * Each slide waits `introDelay + rank x introStagger` seconds before it starts.
 */
export function getIntroProgress(rank: number, elapsedSeconds: number, config: AnimationConfig) {
  if (config.introDuration <= 0) return 1;

  const startTime = config.introDelay + rank * config.introStagger;
  const linearProgress = (elapsedSeconds - startTime) / config.introDuration;
  const clampedProgress = Math.min(1, Math.max(0, linearProgress));

  return easings[config.introEase](clampedProgress);
}

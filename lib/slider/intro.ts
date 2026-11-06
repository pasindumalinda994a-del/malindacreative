import type { AnimationConfig } from "@/config/animationConfig";
import { easings } from "./easing";

export type LandingCast = {
  /** Draw order in the stack. Every slide has one. 0 opens first. */
  ranks: number[];
  clusterCount: number;
};

/**
 * Every slide joins the opening stack.
 * Farther slides reveal first. The slide nearest the center reveals last,
 * so it is the face of the stack when the spread begins.
 */
export function createLandingCast(startPositions: number[]): LandingCast {
  const members = startPositions.map((position, index) => ({
    index,
    distance: Math.abs(position),
  }));

  members.sort((a, b) => b.distance - a.distance || a.index - b.index);

  const ranks = startPositions.map(() => 0);
  members.forEach((member, rank) => {
    ranks[member.index] = rank;
  });

  return { ranks, clusterCount: members.length };
}

export type LandingPose = {
  /** True once the spread has finished, or the intro was skipped. */
  settled: boolean;
  /** 0 = stacked at the center, 1 = resting positions and full side depth. */
  spread: number;
  /** 0 = iris closed, 1 = fully open. */
  masks: number[];
};

/**
 * One clock for the landing. Irises use the fast hop curve.
 * The spread and the side depth share a longer ease so they arrive as one gesture.
 * A duration of 0 (reduced motion) settles immediately.
 */
export function getLandingPose(
  cast: LandingCast,
  elapsedSeconds: number,
  config: AnimationConfig,
): LandingPose {
  if (config.maskDuration <= 0 || config.spreadDuration <= 0) {
    return settledPose(cast);
  }

  const maskEase = easings[config.introEase];
  const masks = cast.ranks.map((rank) => {
    const start = config.introDelay + rank * config.maskStagger;
    return maskEase(clamp01((elapsedSeconds - start) / config.maskDuration));
  });

  const lastRank = Math.max(0, cast.clusterCount - 1);
  const spreadStart =
    config.introDelay +
    lastRank * config.maskStagger +
    config.maskDuration * config.spreadOverlap;
  const spread = easings[config.spreadEase](
    clamp01((elapsedSeconds - spreadStart) / config.spreadDuration),
  );

  return { settled: spread >= 1, spread, masks };
}

function settledPose(cast: LandingCast): LandingPose {
  return {
    settled: true,
    spread: 1,
    masks: cast.ranks.map(() => 1),
  };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

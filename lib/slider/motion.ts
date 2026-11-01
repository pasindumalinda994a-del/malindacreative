import type { AnimationConfig } from "@/config/animationConfig";

// Fine-tuning values for how the bend reacts to speed.
// The main, everyday settings are in config/animationConfig.ts.
const MOMENTUM_THRESHOLD = 0.001; // Momentum below this is treated as zero.
const DIRECTION_SMOOTHING = 0.08; // How fast the bend flips when you reverse direction.
const VELOCITY_HISTORY_SIZE = 5; // Frames averaged to get a stable speed.
const SPEED_TO_BEND = 0.1; // Converts scroll speed into bend amount.
const PEAK_DECAY = 0.99; // How fast the remembered top speed fades.
const BEND_RELAX_SLOWING = 0.95; // Bend fade per frame while slowing down.
const BEND_RELAX_IDLE = 0.855; // Bend fade per frame when almost stopped.

/** Everything that changes while you scroll. Input writes to it, updateMotion reads it. */
export type MotionState = {
  /** Where the slider is right now. */
  scrollPosition: number;
  /** Where the slider is heading. Input moves this, and scrollPosition eases towards it. */
  scrollTarget: number;
  /** Extra movement added each frame after a fling. */
  scrollMomentum: number;
  /** While true, momentum keeps pushing the slider. */
  isScrolling: boolean;

  /** How "fast" the slider feels, from 0 (still) to 1 (full speed). Drives the bend and speed effects. */
  distortionAmount: number;
  /** Bend we are easing towards. */
  distortionTarget: number;
  /** Smoothed scroll direction: -1 (down) to 1 (up). Flips the bend. */
  scrollDirection: number;
  directionTarget: number;
  velocityHistory: number[];
  velocityPeak: number;
};

export function createMotionState(): MotionState {
  return {
    scrollPosition: 0,
    scrollTarget: 0,
    scrollMomentum: 0,
    isScrolling: false,
    distortionAmount: 0,
    distortionTarget: 0,
    scrollDirection: 0,
    directionTarget: 0,
    velocityHistory: new Array(VELOCITY_HISTORY_SIZE).fill(0),
    velocityPeak: 0,
  };
}

/** Gives the bend an instant kick, used when the user scrolls, drags or swipes. */
export function addDistortionBurst(state: MotionState, amount: number) {
  state.distortionTarget = Math.min(1, state.distortionTarget + amount);
}

/**
 * Moves the animation forward by one frame.
 * Returns the speed amount with a direction: from -1 (full speed one way)
 * to 1 (full speed the other way). Used for the bend and the tilt.
 */
export function updateMotion(state: MotionState, deltaTime: number, config: AnimationConfig) {
  const previousPosition = state.scrollPosition;

  // 1. Momentum: after a fling, keep pushing the target and slowly lose speed.
  if (state.isScrolling) {
    state.scrollTarget += state.scrollMomentum;
    state.scrollMomentum *= config.momentumFriction;
    if (Math.abs(state.scrollMomentum) < MOMENTUM_THRESHOLD) {
      state.scrollMomentum = 0;
    }
  }

  // 2. Easing: move a small fraction of the remaining distance every frame.
  state.scrollPosition += (state.scrollTarget - state.scrollPosition) * config.scrollSmoothing;

  // 3. Direction: remember which way we are moving, and blend smoothly when it changes.
  const frameDelta = state.scrollPosition - previousPosition;
  if (Math.abs(frameDelta) > 0.00001) {
    state.directionTarget = frameDelta > 0 ? 1 : -1;
  }
  state.scrollDirection +=
    (state.directionTarget - state.scrollDirection) * DIRECTION_SMOOTHING;

  // 4. Speed: average the last few frames so the bend doesn't flicker.
  const velocity = Math.abs(frameDelta) / Math.max(deltaTime, 0.001);
  state.velocityHistory.push(velocity);
  state.velocityHistory.shift();
  const averageVelocity =
    state.velocityHistory.reduce((sum, value) => sum + value, 0) /
    state.velocityHistory.length;

  if (averageVelocity > state.velocityPeak) state.velocityPeak = averageVelocity;
  const isSlowingDown =
    averageVelocity / (state.velocityPeak + 0.001) < 0.7 && state.velocityPeak > 0.5;
  state.velocityPeak *= PEAK_DECAY;

  // 5. Bend target: faster scrolling bends more; slowing down relaxes it.
  if (velocity > 0.05) {
    state.distortionTarget = Math.max(
      state.distortionTarget,
      Math.min(1, velocity * SPEED_TO_BEND),
    );
  }
  if (isSlowingDown) {
    state.distortionTarget *= BEND_RELAX_SLOWING;
  } else if (averageVelocity < 0.2) {
    state.distortionTarget *= BEND_RELAX_IDLE;
  }

  // 6. Ease the actual bend towards its target.
  state.distortionAmount +=
    (state.distortionTarget - state.distortionAmount) * config.bendSmoothing;

  return state.distortionAmount * state.scrollDirection;
}

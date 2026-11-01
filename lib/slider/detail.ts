import * as THREE from "three";
import type { AnimationConfig } from "@/config/animationConfig";
import { easings } from "./easing";

/** How quickly the hero follows the detail page scroll (0-1 per frame at 60fps). */
const DETAIL_SMOOTHING = 0.16;

/**
 * Scroll-driven response of the opened hero while the project detail page scrolls.
 * `target` is written by the DOM layer; `progress` eases towards it every frame.
 */
export type DetailState = {
  target: number;
  progress: number;
};

export type DetailPose = {
  /** Extra inset, in CSS pixels, added to the focused hero's frame. */
  insetPx: number;
  /** Multiplier on the hero scale. */
  scale: number;
  /** Upward drift in world units. */
  lift: number;
  /** Multiplier on the hero opacity. */
  opacity: number;
  /** Extra corner radius in CSS pixels. */
  cornerPx: number;
};

export function createDetailState(): DetailState {
  return { target: 0, progress: 0 };
}

export function setDetailTarget(state: DetailState, value: number) {
  state.target = THREE.MathUtils.clamp(value, 0, 1);
}

/** Eases `progress` towards `target`. Pass `snap` for prefers-reduced-motion. */
export function updateDetail(state: DetailState, deltaTime: number, snap = false) {
  if (snap) {
    state.progress = state.target;
    return state.progress;
  }
  // Frame-rate independent smoothing (same feel at 60 and 120 Hz).
  const alpha = 1 - Math.pow(1 - DETAIL_SMOOTHING, deltaTime * 60);
  state.progress += (state.target - state.progress) * alpha;
  if (Math.abs(state.target - state.progress) < 0.0005) state.progress = state.target;
  return state.progress;
}

/** Turns the eased progress into the hero adjustments applied in focus.ts. */
export function getDetailPose(progress: number, config: AnimationConfig): DetailPose {
  const t = easings.easeOutCubic(THREE.MathUtils.clamp(progress, 0, 1));
  return {
    insetPx: config.detailInsetPx * t,
    scale: THREE.MathUtils.lerp(1, config.detailScale, t),
    lift: config.detailLift * t,
    opacity: THREE.MathUtils.lerp(1, config.detailOpacity, t),
    cornerPx: 8 * t,
  };
}

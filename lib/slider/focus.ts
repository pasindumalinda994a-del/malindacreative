import * as THREE from "three";
import type { AnimationConfig } from "@/config/animationConfig";
import { setSlideCornerRadius } from "./corners";
import type { DetailPose } from "./detail";
import { easings } from "./easing";
import { getLoopedPosition } from "./layout";
import type { MotionState } from "./motion";
import type { SlideMesh, Viewport } from "./scene";

export type FocusMode = "idle" | "entering" | "focused" | "exiting";

export type FocusState = {
  mode: FocusMode;
  /** Slide being focused, or -1 when idle. */
  index: number;
  /** 0 = strip pose, 1 = hero pose. */
  progress: number;
  elapsed: number;
  duration: number;
  startProgress: number;
  targetProgress: number;
  /** Scroll position when enter began. */
  scrollFrom: number;
  /** Scroll position that centers the focused slide. */
  scrollTo: number;
};

const { lerp, degToRad } = THREE.MathUtils;

export function createFocusState(): FocusState {
  return {
    mode: "idle",
    index: -1,
    progress: 0,
    elapsed: 0,
    duration: 0,
    startProgress: 0,
    targetProgress: 0,
    scrollFrom: 0,
    scrollTo: 0,
  };
}

export function isFocusActive(state: FocusState) {
  return state.mode !== "idle";
}

export function isInputLocked(state: FocusState) {
  return state.mode !== "idle";
}

/** Scroll delta that moves a slide to the screen center. */
export function getScrollDeltaToCenter(
  slideOffset: number,
  scrollPosition: number,
  loopLength: number,
) {
  return -getLoopedPosition(slideOffset, scrollPosition, loopLength);
}

/**
 * Starts (or restarts) a hero expand on `index`.
 * Interrupt-safe: continues from the current progress.
 */
export function beginFocusEnter(
  state: FocusState,
  index: number,
  motion: MotionState,
  slideOffset: number,
  loopLength: number,
  config: AnimationConfig,
) {
  const scrollDelta = getScrollDeltaToCenter(slideOffset, motion.scrollPosition, loopLength);

  state.index = index;
  state.mode = "entering";
  state.startProgress = state.progress;
  state.targetProgress = 1;
  state.elapsed = 0;
  state.duration = config.focusDuration * Math.max(0.0001, Math.abs(1 - state.progress));
  state.scrollFrom = motion.scrollPosition;
  state.scrollTo = motion.scrollPosition + scrollDelta;

  motion.scrollMomentum = 0;
  motion.isScrolling = false;
  motion.distortionTarget = 0;
  motion.scrollTarget = state.scrollTo;
}

/**
 * Jumps straight into the hero pose on `index` with no animation.
 * Used for deep links (`?project=slug`) so the page loads already open.
 */
export function snapFocusTo(
  state: FocusState,
  index: number,
  motion: MotionState,
  slideOffset: number,
) {
  state.index = index;
  state.mode = "focused";
  state.progress = 1;
  state.startProgress = 1;
  state.targetProgress = 1;
  state.elapsed = 0;
  state.duration = 0;
  state.scrollFrom = slideOffset;
  state.scrollTo = slideOffset;

  motion.scrollPosition = slideOffset;
  motion.scrollTarget = slideOffset;
  motion.scrollMomentum = 0;
  motion.isScrolling = false;
  motion.distortionTarget = 0;
  motion.distortionAmount = 0;
}

/**
 * Collapses the hero back into the strip.
 * Interrupt-safe: reverses from the current progress.
 */
export function beginFocusExit(state: FocusState, motion: MotionState, config: AnimationConfig) {
  if (state.mode === "idle") return;

  // If we bail mid-enter, freeze scroll where the blend currently is.
  if (state.mode === "entering") {
    state.scrollTo = lerp(state.scrollFrom, state.scrollTo, state.progress);
  }

  state.mode = "exiting";
  state.startProgress = state.progress;
  state.targetProgress = 0;
  state.elapsed = 0;
  state.duration = config.focusDuration * Math.max(0.0001, state.progress);

  motion.scrollMomentum = 0;
  motion.isScrolling = false;
  motion.scrollPosition = state.scrollTo;
  motion.scrollTarget = state.scrollTo;
}

/**
 * Advances the focus transition. Returns the current linear progress (0-1).
 * Pass `snap` true for prefers-reduced-motion.
 */
export function updateFocus(state: FocusState, deltaTime: number, config: AnimationConfig, snap = false) {
  if (state.mode === "idle" || state.mode === "focused") {
    return state.progress;
  }

  if (snap) {
    state.progress = state.targetProgress;
  } else {
    state.elapsed += deltaTime;
    const u = Math.min(1, state.elapsed / state.duration);
    const eased = easings[config.focusEase](u);
    state.progress = lerp(state.startProgress, state.targetProgress, eased);
  }

  if (Math.abs(state.progress - state.targetProgress) < 0.0005) {
    state.progress = state.targetProgress;
    if (state.targetProgress === 1) {
      state.mode = "focused";
    } else {
      state.mode = "idle";
      state.index = -1;
    }
  }

  return state.progress;
}

/**
 * Keeps the focused slide centered. Call before placeSlide each frame
 * while focus is active so strip layout and hero blend share one scroll.
 */
export function syncFocusScroll(focus: FocusState, motion: MotionState) {
  if (!isFocusActive(focus) || focus.index < 0) return;

  motion.scrollMomentum = 0;
  motion.isScrolling = false;
  motion.distortionTarget = 0;

  if (focus.mode === "entering") {
    motion.scrollPosition = lerp(focus.scrollFrom, focus.scrollTo, focus.progress);
  } else {
    motion.scrollPosition = focus.scrollTo;
  }
  motion.scrollTarget = motion.scrollPosition;
}

type FocusOverlayInput = {
  slideMeshes: SlideMesh[];
  slideGroup: THREE.Group;
  camera: THREE.PerspectiveCamera;
  viewport: Viewport;
  focus: FocusState;
  /** Scroll response of the opened project page (see detail.ts). */
  detail: DetailPose;
  config: AnimationConfig;
};

/**
 * Blends the strip pose (already written this frame) toward the hero pose.
 * Call after placeSlide / applySlideEffects / bendPlane / updateParallax.
 */
export function applyFocusOverlay({
  slideMeshes,
  slideGroup,
  camera,
  viewport,
  focus,
  detail,
  config,
}: FocusOverlayInput) {
  const t = focus.progress;
  const rollYawRad = degToRad(config.rollYaw);

  slideGroup.rotation.y = lerp(rollYawRad, 0, t);
  // The strip sits a little above center; the hero is centered on the screen.
  slideGroup.position.y = lerp(config.stripOffsetY, 0, t);

  if (t <= 0 || focus.index < 0) {
    for (const slide of slideMeshes) {
      slide.mesh.renderOrder = 0;
      slide.mesh.visible = true;
      setSlideCornerRadius(slide.mesh.material, 0, 0);
    }
    return;
  }

  const groupScale = slideGroup.scale.x || 1;
  const insetPx = config.focusInsetPx + detail.insetPx * t;
  const focusedSlide = slideMeshes[focus.index];
  // Cover scale at the current depth so size tracks Z through the tween.
  const currentFocusZ = lerp(0, config.focusZ, t);
  const heroScale = getHeroScale(
    camera,
    viewport,
    groupScale,
    focusedSlide,
    config.focusFill,
    insetPx,
    currentFocusZ,
  );

  const insetWidth = Math.max(1, viewport.width - insetPx * 2);
  const insetHeight = Math.max(1, viewport.height - insetPx * 2);
  // Covered (oversized) on-screen plane size — corner radius stays pixel-consistent.
  const plane = focusedSlide.mesh.geometry.parameters;
  const planeAspect = plane.width / plane.height;
  const heroPxW = Math.max(insetWidth, insetHeight * planeAspect) * config.focusFill;
  const heroPxH = Math.max(insetHeight, insetWidth / planeAspect) * config.focusFill;
  const cornerRadius = (config.focusCornerRadiusPx + detail.cornerPx) * t;
  const cornerUvX = Math.min(0.5, cornerRadius / Math.max(1, heroPxW));
  const cornerUvY = Math.min(0.5, cornerRadius / Math.max(1, heroPxH));

  slideMeshes.forEach((slide, index) => {
    const { mesh } = slide;
    const stripScale = mesh.scale.x;
    const stripOpacity = mesh.material.opacity;
    const stripX = mesh.position.x;
    const stripY = mesh.position.y;

    if (index === focus.index) {
      mesh.visible = true;
      mesh.position.x = lerp(stripX, 0, t);
      mesh.position.y = lerp(stripY, detail.lift * t, t);
      mesh.position.z = currentFocusZ;
      const detailScale = lerp(1, detail.scale, t);
      const targetScale = heroScale.x * detailScale;
      mesh.scale.set(
        lerp(stripScale, targetScale, t),
        lerp(stripScale, targetScale, t),
        1,
      );
      mesh.material.opacity = lerp(stripOpacity, detail.opacity, t);
      mesh.rotation.x = lerp(mesh.rotation.x, 0, t);
      mesh.rotation.y = lerp(mesh.rotation.y, 0, t);
      mesh.rotation.z = lerp(mesh.rotation.z, 0, t);
      mesh.renderOrder = 10;
      setSlideCornerRadius(mesh.material, cornerUvX, cornerUvY);

      if (slide.title) {
        slide.title.mesh.material.opacity = lerp(slide.title.mesh.material.opacity, 0, t);
      }
      return;
    }

    // Hide neighbors once cover is settled so they cannot conflict with the fixed hero.
    mesh.visible = t < 0.98;
    mesh.position.z = lerp(0, config.focusOthersZ, t);
    mesh.scale.setScalar(stripScale * lerp(1, config.focusOthersScale, t));
    mesh.material.opacity = lerp(stripOpacity, config.focusOthersOpacity, t);
    mesh.renderOrder = 0;
    setSlideCornerRadius(mesh.material, 0, 0);

    if (slide.title) {
      slide.title.mesh.material.opacity = lerp(slide.title.mesh.material.opacity, 0, t);
    }
  });
}

/**
 * Uniform local mesh scale that covers the inset viewport at the given depth
 * (object-fit: cover). Same scale on X and Y so the expand animation stays smooth.
 */
function getHeroScale(
  camera: THREE.PerspectiveCamera,
  viewport: Viewport,
  groupScale: number,
  slide: SlideMesh,
  focusFill: number,
  focusInsetPx: number,
  depthZ: number,
) {
  const geometry = slide.mesh.geometry;
  const planeWidth = geometry.parameters.width;
  const planeHeight = geometry.parameters.height;

  const distance = Math.max(0.15, camera.position.z - groupScale * depthZ);
  const visibleHeight = 2 * distance * Math.tan(degToRad(camera.fov) / 2);
  const visibleWidth = visibleHeight * camera.aspect;

  const insetX = Math.min(focusInsetPx, viewport.width / 2 - 0.5);
  const insetY = Math.min(focusInsetPx, viewport.height / 2 - 0.5);
  const targetWidth = visibleWidth * (1 - (2 * insetX) / viewport.width) * focusFill;
  const targetHeight = visibleHeight * (1 - (2 * insetY) / viewport.height) * focusFill;

  const sx = targetWidth / (planeWidth * groupScale);
  const sy = targetHeight / (planeHeight * groupScale);
  const s = Math.max(sx, sy);

  return { x: s, y: s };
}

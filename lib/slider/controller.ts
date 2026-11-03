import * as THREE from "three";
import {
  resolveResponsiveConfig,
  withReducedMotion,
  type AnimationConfig,
} from "@/config/animationConfig";
import type { Slide } from "@/config/slides";
import { createDetailState, getDetailPose, setDetailTarget, updateDetail } from "./detail";
import {
  applySlideEffects,
  bendPlane,
  flattenSlide,
  lockFullscreenCover,
  placeSlide,
  restoreStripCover,
  updateParallax,
} from "./effects";
import {
  applyFocusOverlay,
  beginFocusEnter,
  beginFocusExit,
  createFocusState,
  getScrollDeltaToCenter,
  isFocusActive,
  isInputLocked,
  snapFocusTo,
  syncFocusScroll,
  updateFocus,
} from "./focus";
import { attachSliderInput } from "./input";
import { createIntroOrder, getIntroProgress } from "./intro";
import { createSlideLayout, getLoopedPosition } from "./layout";
import { addDistortionBurst, createMotionState, updateMotion } from "./motion";
import { createSliderScene } from "./scene";

/**
 * What the user is looking at.
 * browse -> opening -> detail -> closing -> browse
 */
export type SliderView = "browse" | "opening" | "detail" | "closing";

export type SliderControllerEvents = {
  /** The slide nearest the center (or the opened one). */
  onActiveIndex?: (index: number) => void;
  onView?: (view: SliderView) => void;
  /** Slide under the pointer while browsing, or -1. */
  onHover?: (index: number) => void;
};

export type SliderControllerOptions = {
  /** Open this slide immediately with no animation (deep link). */
  initialOpenIndex?: number;
};

export type SliderController = {
  /** Expand `index` into the hero pose. From the detail view this closes first, then opens. */
  open: (index: number) => void;
  /** Open whichever slide is nearest the center. */
  openActive: () => void;
  /** Collapse the hero back into the strip. */
  close: () => void;
  /** Scroll the strip so `index` is centered. */
  goTo: (index: number) => void;
  /** Scroll the strip by one slide. */
  step: (direction: -1 | 1) => void;
  /** Scroll progress (0-1) of the detail page over its first viewport. */
  setDetailScroll: (progress: number) => void;
  getActiveIndex: () => number;
  getView: () => SliderView;
  dispose: () => void;
};

/**
 * Owns the whole Three.js runtime for the slider: scene, motion, focus, input,
 * the detail-scroll response and the single frame loop. React only talks to
 * this through the returned controller and the events it emits.
 */
export function createSliderController(
  canvas: HTMLCanvasElement,
  slides: Slide[],
  baseConfig: AnimationConfig,
  events: SliderControllerEvents = {},
  options: SliderControllerOptions = {},
): SliderController {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionConfig = prefersReducedMotion ? withReducedMotion(baseConfig) : baseConfig;
  let config = resolveResponsiveConfig(motionConfig, window.innerWidth);

  const layout = createSlideLayout(slides.length, config);
  const sliderScene = createSliderScene(canvas, slides, layout, config);
  const motion = createMotionState();
  const focus = createFocusState();
  const detail = createDetailState();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const raycastTargets = sliderScene.slideMeshes.map((slide) => slide.mesh);

  // --- Emitted state -----------------------------------------------------
  let activeIndex = -1;
  let view: SliderView = "browse";
  let hoverIndex = -1;
  /** Slide whose texture UVs were switched to fullscreen cover; restore on exit. */
  let coverLockedIndex = -1;

  function setActiveIndex(index: number) {
    if (index === activeIndex) return;
    activeIndex = index;
    events.onActiveIndex?.(index);
  }

  function setView(next: SliderView) {
    if (next === view) return;
    view = next;
    events.onView?.(next);
  }

  function setHoverIndex(index: number) {
    if (index === hoverIndex) return;
    hoverIndex = index;
    events.onHover?.(index);
  }

  // --- Intro ---------------------------------------------------------------
  const startPositions = layout.offsets.map((offset) =>
    getLoopedPosition(offset, 0, layout.loopLength),
  );
  const introOrder = createIntroOrder(startPositions, config.introStaggerFrom);
  /** Seconds added to the intro clock; a huge value skips the intro (deep links). */
  let introSkip = 0;

  // --- Deep link: start already open --------------------------------------
  const initialOpenIndex = options.initialOpenIndex ?? -1;
  if (initialOpenIndex >= 0 && initialOpenIndex < slides.length) {
    snapFocusTo(focus, initialOpenIndex, motion, layout.offsets[initialOpenIndex]);
    introSkip = 1000;
    view = "detail";
    activeIndex = initialOpenIndex;
  }

  // --- Pointer / hover -----------------------------------------------------
  let pointerDirty = false;
  let pointerX = 0;
  let pointerY = 0;

  function pickSlideIndex(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, sliderScene.camera);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    if (hits.length === 0) return -1;

    return raycastTargets.indexOf(hits[0].object as (typeof raycastTargets)[number]);
  }

  // --- Actions -------------------------------------------------------------
  /** Slide to open once the current close finishes (Next project from the detail view). */
  let pendingOpenIndex = -1;

  function open(index: number) {
    if (index < 0 || index >= slides.length) return;

    if (isFocusActive(focus)) {
      if (focus.index === index && focus.mode !== "exiting") return;
      // Collapse first; the loop re-opens when the strip is back.
      pendingOpenIndex = index;
      close();
      return;
    }

    pendingOpenIndex = -1;
    setHoverIndex(-1);
    setDetailTarget(detail, 0);
    beginFocusEnter(
      focus,
      index,
      motion,
      sliderScene.slideMeshes[index].offset,
      layout.loopLength,
      config,
    );
    setActiveIndex(index);
  }

  function openActive() {
    if (isFocusActive(focus)) return;
    open(activeIndex >= 0 ? activeIndex : 0);
  }

  function close() {
    if (!isFocusActive(focus) || focus.mode === "exiting") return;
    setDetailTarget(detail, 0);
    beginFocusExit(focus, motion, config);
  }

  function goTo(index: number) {
    if (isInputLocked(focus)) return;
    const target = ((index % slides.length) + slides.length) % slides.length;
    const delta = getScrollDeltaToCenter(
      sliderScene.slideMeshes[target].offset,
      motion.scrollTarget,
      layout.loopLength,
    );
    motion.scrollMomentum = 0;
    motion.scrollTarget += delta;
    motion.isScrolling = true;
    addDistortionBurst(motion, Math.min(0.6, Math.abs(delta) * 0.25));
  }

  function step(direction: -1 | 1) {
    if (isInputLocked(focus)) return;
    // Step from where the strip is heading, so quick repeated presses keep advancing.
    let from = 0;
    let closest = Infinity;
    for (let index = 0; index < layout.offsets.length; index++) {
      const distance = Math.abs(
        getLoopedPosition(layout.offsets[index], motion.scrollTarget, layout.loopLength),
      );
      if (distance < closest) {
        closest = distance;
        from = index;
      }
    }
    goTo(from + direction);
  }

  function setDetailScroll(progress: number) {
    if (focus.mode !== "focused") return;
    setDetailTarget(detail, progress);
  }

  // --- Input -----------------------------------------------------------------
  // Config via getter so narrow speed / momentum overrides apply after resize.
  const removeSliderInput = attachSliderInput(canvas, motion, () => config, {
    onSelect: (clientX, clientY) => {
      // The opened hero only closes via the UI — ignore canvas clicks while focused.
      if (isFocusActive(focus)) return;
      const index = pickSlideIndex(clientX, clientY);
      if (index >= 0) open(index);
    },
    onPointerMove: (clientX, clientY) => {
      pointerX = clientX;
      pointerY = clientY;
      pointerDirty = true;
    },
    onPointerLeave: () => {
      pointerDirty = false;
      setHoverIndex(-1);
    },
    onStep: step,
    onOpen: openActive,
    onClose: close,
    getInputLocked: () => isInputLocked(focus),
  });

  // --- Resize (and responsive config) ----------------------------------------
  function handleResize() {
    const next = resolveResponsiveConfig(motionConfig, window.innerWidth);
    if (next !== config) {
      config = next;
      sliderScene.setConfig(config);
    }
    sliderScene.resize();
  }
  window.addEventListener("resize", handleResize);

  // --- Frame loop --------------------------------------------------------------
  let animationFrameId = 0;
  let introStartTime: number | null = null;
  let lastFrameTime = 0;

  function animate(time: number) {
    animationFrameId = requestAnimationFrame(animate);

    const deltaTime = Math.min(0.1, lastFrameTime ? (time - lastFrameTime) / 1000 : 1 / 60);
    lastFrameTime = time;

    if (introStartTime === null) introStartTime = time;
    const introElapsed = (time - introStartTime) / 1000 + introSkip;

    updateFocus(focus, deltaTime, config, prefersReducedMotion);
    updateDetail(detail, deltaTime, prefersReducedMotion);

    const focusActive = isFocusActive(focus);

    // Chained open (Next project): the strip is back, so expand the queued slide.
    if (!focusActive && pendingOpenIndex >= 0) {
      const next = pendingOpenIndex;
      pendingOpenIndex = -1;
      open(next);
    }

    let signedSpeed = 0;
    if (isFocusActive(focus)) {
      syncFocusScroll(focus, motion);
      motion.distortionTarget = 0;
      motion.distortionAmount += (0 - motion.distortionAmount) * config.bendSmoothing;
    } else {
      signedSpeed = updateMotion(motion, deltaTime, config);
    }

    const speed = isFocusActive(focus) ? 0 : motion.distortionAmount;
    const bendStrength = config.bendStrength * (1 - focus.progress);

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let index = 0; index < sliderScene.slideMeshes.length; index++) {
      const slideMesh = sliderScene.slideMeshes[index];
      const position = getLoopedPosition(slideMesh.offset, motion.scrollPosition, layout.loopLength);
      const introProgress = getIntroProgress(introOrder[index], introElapsed, config);

      placeSlide(slideMesh, position, config.direction);
      applySlideEffects(slideMesh, { introProgress, signedSpeed, speed }, config);

      const isFocusedSlide = focus.index === index && focus.progress > 0;
      if (isFocusedSlide) {
        flattenSlide(slideMesh);
      } else {
        bendPlane(slideMesh, speed * bendStrength, config);
        if (focus.progress < 1) updateParallax(slideMesh, config);
      }

      const distance = Math.abs(position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    const detailPose = getDetailPose(detail.progress, config);
    applyFocusOverlay({
      slideMeshes: sliderScene.slideMeshes,
      slideGroup: sliderScene.slideGroup,
      camera: sliderScene.camera,
      viewport: sliderScene.viewport,
      focus,
      detail: detailPose,
      config,
    });

    if (focus.index >= 0 && focus.progress > 0) {
      const coverZoom = config.parallaxStrength * (1 - focus.progress);
      lockFullscreenCover(sliderScene.slideMeshes[focus.index], coverZoom);
      coverLockedIndex = focus.index;
    } else if (coverLockedIndex >= 0) {
      restoreStripCover(sliderScene.slideMeshes[coverLockedIndex], config);
      coverLockedIndex = -1;
    }

    // Hover: at most one raycast per frame, only while browsing.
    if (pointerDirty) {
      pointerDirty = false;
      setHoverIndex(isFocusActive(focus) ? -1 : pickSlideIndex(pointerX, pointerY));
    }

    setActiveIndex(focus.index >= 0 ? focus.index : closestIndex);
    setView(
      focus.mode === "idle"
        ? "browse"
        : focus.mode === "entering"
          ? "opening"
          : focus.mode === "focused"
            ? "detail"
            : "closing",
    );

    sliderScene.render();
  }

  animationFrameId = requestAnimationFrame(animate);

  function dispose() {
    cancelAnimationFrame(animationFrameId);
    removeSliderInput();
    window.removeEventListener("resize", handleResize);
    sliderScene.dispose();
  }

  return {
    open,
    openActive,
    close,
    goTo,
    step,
    setDetailScroll,
    getActiveIndex: () => activeIndex,
    getView: () => view,
    dispose,
  };
}

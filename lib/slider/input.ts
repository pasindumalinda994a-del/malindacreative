import type { AnimationConfig } from "@/config/animationConfig";
import { addDistortionBurst, type MotionState } from "./motion";

// How strongly each kind of input kicks the bend effect.
const WHEEL_BURST = 0.001;
const DRAG_MOVE_BURST = 0.02;
const DRAG_RELEASE_BURST = 0.005;
const TOUCH_MOVE_BURST = 0.02;
/** Soft release kick — strong enough to feel, light enough for phones. */
const SWIPE_RELEASE_BURST = 0.12;

// Ignore wheel jumps bigger than this (some mice send huge values).
const WHEEL_MAX = 150;

// A swipe only counts as a fling if it is fast enough.
const SWIPE_VELOCITY_SCALE = 0.005;
const MIN_SWIPE_VELOCITY = 0.5;
const MIN_DRAG_FLING = 2; // Pixels moved in the last mouse move.

/** Pointer movement below this is treated as a click / tap, not a drag. */
const CLICK_MOVE_THRESHOLD = 10;

export type SliderInputOptions = {
  /** Called for a click / tap on the canvas that did not drag. */
  onSelect?: (clientX: number, clientY: number) => void;
  /** Called on mouse move over the canvas while not dragging (for hover feedback). */
  onPointerMove?: (clientX: number, clientY: number) => void;
  /** Called when the pointer leaves the canvas or a drag starts. */
  onPointerLeave?: () => void;
  /** Keyboard: step one slide (-1 / +1). */
  onStep?: (direction: -1 | 1) => void;
  /** Keyboard: open the active slide (Enter). */
  onOpen?: () => void;
  /** Keyboard: close the opened project (Escape). */
  onClose?: () => void;
  /** When true, wheel / drag / swipe / arrows are ignored (click and Escape still fire). */
  getInputLocked?: () => boolean;
};

/**
 * Listens to mouse wheel, mouse drag, touch swipe and the keyboard, and turns
 * them into changes on the motion state. Returns a function that removes all listeners.
 *
 * `getConfig` is read on each input event so narrow ↔ desktop speed overrides stay live.
 */
export function attachSliderInput(
  canvas: HTMLCanvasElement,
  state: MotionState,
  getConfig: () => AnimationConfig,
  options: SliderInputOptions = {},
) {
  const { onSelect, onPointerMove, onPointerLeave, onStep, onOpen, onClose, getInputLocked } =
    options;
  const isHorizontal = getConfig().direction === "horizontal";

  /** Reads the pointer position along the direction the slides travel. */
  function getPointerPosition(point: { clientX: number; clientY: number }) {
    return isHorizontal ? point.clientX : point.clientY;
  }

  function isLocked() {
    return getInputLocked?.() ?? false;
  }

  let scrollEndTimer: number | undefined;

  let isDragging = false;
  let dragArmedOnCanvas = false;
  let dragBecameMove = false;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let lastDragPosition = 0;
  let lastDragDelta = 0;

  let touchDragging = false;
  let touchArmedOnCanvas = false;
  let touchBecameMove = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartPosition = 0;
  let touchLastPosition = 0;

  function isCanvasTarget(target: EventTarget | null) {
    return target === canvas;
  }

  /** Lets momentum keep running for `milliseconds` after the input stops. */
  function keepScrollingFor(milliseconds: number) {
    state.isScrolling = true;
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      state.isScrolling = false;
    }, milliseconds);
  }

  // --- Mouse wheel / trackpad --------------------------------------------
  function handleWheel(event: WheelEvent) {
    // While a project is open the DOM detail layer owns scrolling — leave the event alone.
    if (isLocked()) return;

    event.preventDefault(); // Stop the page itself from scrolling.

    // Use whichever way the wheel / trackpad moved the most.
    const rawDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), WHEEL_MAX);

    addDistortionBurst(state, Math.abs(delta) * WHEEL_BURST);
    state.scrollTarget += delta * getConfig().wheelSpeed;
    keepScrollingFor(150);
  }

  // --- Mouse drag / click ------------------------------------------------
  function handleMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    // Ignore DOM UI (nav, buttons) so window listeners do not steal clicks.
    if (!isCanvasTarget(event.target)) return;

    isDragging = true;
    dragArmedOnCanvas = true;
    dragBecameMove = false;
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    lastDragPosition = getPointerPosition(event);
    lastDragDelta = 0;

    if (!isLocked()) {
      state.scrollMomentum = 0;
      canvas.style.cursor = "grabbing";
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging || !dragArmedOnCanvas) {
      if (isCanvasTarget(event.target)) {
        onPointerMove?.(event.clientX, event.clientY);
      } else {
        onPointerLeave?.();
      }
      return;
    }

    const moveDistance = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
    if (moveDistance > CLICK_MOVE_THRESHOLD) {
      if (!dragBecameMove) onPointerLeave?.();
      dragBecameMove = true;
    }

    if (isLocked() || !dragBecameMove) return;

    const position = getPointerPosition(event);
    const delta = position - lastDragPosition;
    lastDragPosition = position;
    lastDragDelta = delta;

    addDistortionBurst(state, Math.abs(delta) * DRAG_MOVE_BURST);
    // The slides follow the mouse, so the scroll target goes the opposite way.
    state.scrollTarget -= delta * getConfig().dragSpeed;
    state.isScrolling = true;
  }

  function handleMouseUp(event: MouseEvent) {
    if (!isDragging) return;

    const startedOnCanvas = dragArmedOnCanvas;
    isDragging = false;
    dragArmedOnCanvas = false;
    canvas.style.cursor = ""; // Back to the class on the canvas.

    if (!startedOnCanvas) return;

    if (!dragBecameMove) {
      onSelect?.(event.clientX, event.clientY);
      return;
    }

    if (isLocked()) return;

    if (Math.abs(lastDragDelta) > MIN_DRAG_FLING) {
      state.scrollMomentum = -lastDragDelta * getConfig().dragMomentum;
      addDistortionBurst(state, Math.abs(lastDragDelta) * DRAG_RELEASE_BURST);
      keepScrollingFor(800);
    }
  }

  function handleMouseLeave() {
    onPointerLeave?.();
  }

  // --- Touch swipe / tap -------------------------------------------------
  function handleTouchStart(event: TouchEvent) {
    if (!isCanvasTarget(event.target)) return;

    const touch = event.touches[0];
    touchDragging = true;
    touchArmedOnCanvas = true;
    touchBecameMove = false;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartPosition = touchLastPosition = getPointerPosition(touch);

    if (!isLocked()) {
      state.isScrolling = false;
      state.scrollMomentum = 0;
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (!touchDragging || !touchArmedOnCanvas) return;

    const touch = event.touches[0];
    const moveDistance = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
    if (moveDistance > CLICK_MOVE_THRESHOLD) {
      touchBecameMove = true;
    }

    if (isLocked() || !touchBecameMove) return;

    event.preventDefault();

    const position = getPointerPosition(touch);
    const delta = position - touchLastPosition;
    touchLastPosition = position;

    addDistortionBurst(state, Math.abs(delta) * TOUCH_MOVE_BURST);
    state.scrollTarget -= delta * getConfig().touchSpeed;
    state.isScrolling = true;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!touchDragging) return;

    const startedOnCanvas = touchArmedOnCanvas;
    touchDragging = false;
    touchArmedOnCanvas = false;

    if (!startedOnCanvas) return;

    if (!touchBecameMove) {
      const touch = event.changedTouches[0];
      if (touch) onSelect?.(touch.clientX, touch.clientY);
      return;
    }

    if (isLocked()) return;

    const swipeVelocity = (touchLastPosition - touchStartPosition) * SWIPE_VELOCITY_SCALE;

    if (Math.abs(swipeVelocity) > MIN_SWIPE_VELOCITY) {
      state.scrollMomentum = -swipeVelocity * getConfig().touchMomentum;
      addDistortionBurst(state, Math.abs(swipeVelocity) * SWIPE_RELEASE_BURST);
      keepScrollingFor(800);
    }
  }

  // --- Keyboard ----------------------------------------------------------
  function handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

    switch (event.key) {
      case "Escape":
        onClose?.();
        return;
      case "ArrowLeft":
      case "ArrowUp":
        if (isLocked()) return;
        event.preventDefault();
        onStep?.(-1);
        return;
      case "ArrowRight":
      case "ArrowDown":
        if (isLocked()) return;
        event.preventDefault();
        onStep?.(1);
        return;
      case "Enter":
        // Let buttons and links keep their own Enter behaviour.
        if (target && target !== document.body && target.tagName !== "CANVAS") return;
        if (isLocked()) return;
        onOpen?.();
        return;
    }
  }

  // `passive: false` is required so preventDefault() can block page scrolling.
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseLeave);
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleTouchEnd);
  window.addEventListener("keydown", handleKeyDown);

  return function removeSliderInput() {
    window.clearTimeout(scrollEndTimer);
    window.removeEventListener("wheel", handleWheel);
    window.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
    window.removeEventListener("touchstart", handleTouchStart);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
    window.removeEventListener("keydown", handleKeyDown);
  };
}

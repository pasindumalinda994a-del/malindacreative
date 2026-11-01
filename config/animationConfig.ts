import type { EaseName } from "@/lib/slider/easing";
import type { IntroStaggerFrom } from "@/lib/slider/intro";

export type SliderDirection = "vertical" | "horizontal";

// =====================================================================
// Tweak anything.
// Values here win over the defaults below.
// Uncomment a line, save, and watch the slider change.
// =====================================================================
const myOverrides: Partial<AnimationConfig> = {
  cameraDistance: 5.2,
  // bendStrength: 5,
  // gap: 0.3,
  // direction: "vertical",
  // introStartRotation: 20,
  // parallaxStrength: 0.1,
};

// =====================================================================
// All settings and their default values (cinematic film-strip look).
// Sizes are in Three.js "world units": with the default camera,
// the visible area is roughly 4 units tall.
// Times are in seconds. Angles are in degrees.
// =====================================================================
const baseConfig = {
  // --- Direction ------------------------------------------------------
  /** Which way the slides travel: "vertical" or "horizontal". */
  direction: "horizontal" as SliderDirection,

  // --- Layout ---------------------------------------------------------
  /** Smallest slide height. Each slide gets a random height in this range. */
  minHeight: 1.4,
  /** Largest slide height. Set equal to minHeight for same-size slides. */
  maxHeight: 1.4,
  /** Slide width = height x aspectRatio. */
  aspectRatio: 1.78,
  /** Empty space between two slides. 0 = frames touch, like a film strip. */
  gap: 0,

  // --- Scroll feel ----------------------------------------------------
  /** How quickly the slider catches up to your scroll (0-1). Lower = floatier. */
  scrollSmoothing: 0.025,
  /** Speed kept each frame after a fling (0-1). Higher = longer glide. */
  momentumFriction: 0.975,
  /** Distance moved per pixel of mouse wheel / trackpad. */
  wheelSpeed: 0.01,
  /** Distance moved per pixel of mouse drag. */
  dragSpeed: 0.01,
  /** How hard a mouse drag flings the slider when you let go. */
  dragMomentum: 0.01,
  /** Distance moved per pixel of touch swipe. */
  touchSpeed: 0.01,
  /** How hard a touch swipe flings the slider when you let go. */
  touchMomentum: 0.1,

  // --- Bend effect (grows with scroll speed) --------------------------
  /** How far slides bend at full speed. 0 = flat. Negative = bend away from you. */
  bendStrength: 1.8,
  /** Size of the curved area around the screen center. */
  bendRadius: 3.5,
  /** Shape of the curve. Low = soft dome, high = sharp peak. */
  bendSharpness: 1.5,
  /** How quickly the bend grows and relaxes (0-1). Lower = lazier. */
  bendSmoothing: 0.1,

  // --- Speed effects (also grow with scroll speed) --------------------
  /** Degrees the slides tilt at full speed. 0 = no tilt. */
  speedTilt: 0,
  /** Degrees the whole strip turns. Positive = right side of the screen farther back. */
  rollYaw: 40,
  /** Slide size at full speed. 1 = no change, 0.85 = shrink to 85%. */
  speedScale: 0.9,

  // --- Image ----------------------------------------------------------
  /** How far each photo drifts inside its frame as it moves (0-0.3). 0 = off. */
  parallaxStrength: 0.2,

  // --- Intro reveal (plays once when the page loads) ------------------
  /** How long each slide takes to appear. */
  introDuration: 2.2,
  /** Wait before the first slide starts appearing. */
  introDelay: 0.3,
  /** Extra wait between one slide and the next. */
  introStagger: 0.15,
  /** Which slide appears first: "center" (middle outwards) or "start" (top / left first). */
  introStaggerFrom: "center" as IntroStaggerFrom,
  /** Easing curve of the reveal (see lib/slider/easing.ts for all options). */
  introEase: "easeInOutCubic" as EaseName,
  /** Starting size. 1 = full size, 0.5 = half size. */
  introStartScale: 0.7,
  /** Starting transparency. 0 = invisible, 1 = fully visible. */
  introStartOpacity: 0,
  /** How far below its resting place each slide starts. Negative = above. */
  introStartOffset: 0,
  /** Starting rotation in degrees. */
  introStartRotation: 0,

  // --- Text (title and number) ----------------------------------------
  /** How long the text fade-in takes when the slide changes. */
  textDuration: 1.2,
  /** How far the text slides up while fading in, in rem. */
  textDistance: 0.2,
  /** Easing curve of the text fade-in. */
  textEase: "easeInOutCubic" as EaseName,

  // --- Hero expand (click a slide to fill the screen) -----------------
  /** How long the expand / collapse takes. */
  focusDuration: 0.85,
  /** Easing curve of the expand / collapse. */
  focusEase: "easeInOutCubic" as EaseName,
  /** How much of the viewport the hero covers (1 = full screen, object-fit cover). */
  focusFill: 1,
  /** Gap in CSS pixels between the hero and each viewport edge. */
  focusInsetPx: 8,
  /** Corner radius in CSS pixels on the focused hero (0 = square). */
  focusCornerRadiusPx: 8,
  /** How far the focused slide moves toward the camera. */
  focusZ: 0.35,
  /** Opacity of non-focused slides while expanded. */
  focusOthersOpacity: 0,
  /** Scale of non-focused slides while expanded. */
  focusOthersScale: 0.92,
  /** How far non-focused slides push away from the camera. */
  focusOthersZ: -1.2,

  // --- Project detail (scrolling the opened project) ------------------
  /** Extra inset in CSS pixels the hero gains when the detail page is fully scrolled past it. */
  detailInsetPx: 24,
  /** Hero scale at full detail scroll (1 = no change). */
  detailScale: 1.1,
  /** How far the hero drifts upward (world units) at full detail scroll. */
  detailLift: 0.25,
  /** Hero opacity at full detail scroll. */
  detailOpacity: 0.85,

  // --- Camera ---------------------------------------------------------
  /** Camera field of view in degrees. Lower = flatter, more "telephoto" look. */
  cameraFov: 35,
  /** How far the camera sits from the slides. Higher = slides look smaller. */
  cameraDistance: 6.5,
  /** Space kept around the slides on small screens. */
  sidePadding: 0.2,
  /** Lifts the whole strip above the screen center (world units) so the title row below stays clear. */
  stripOffsetY: 0.1,

  // --- Narrow screens (below `narrowBreakpointPx`) --------------------
  /** Viewport width in CSS pixels under which the narrow overrides apply. */
  narrowBreakpointPx: 768,
  /** Gentler strip turn so the far side stays readable on phones. */
  narrowRollYaw: 28,
  /** Closer camera on phones so the strip still fills the width. */
  narrowCameraDistance: 4.4,
  /** Strip lift on phones. */
  narrowStripOffsetY: 0.35,
  /** Space kept beside the slides on phones (smaller, so the strip still fills the width). */
  narrowSidePadding: 0.1,

  // --- Quality --------------------------------------------------------
  /** Grid detail of each slide. More segments = smoother bend, more work. */
  widthSegments: 32,
  heightSegments: 16,
  /** Caps the device pixel ratio to keep high-DPI screens fast. */
  maxPixelRatio: 2,
};

export type AnimationConfig = typeof baseConfig;

/** The final config (defaults plus any overrides). */
export const animationConfig: AnimationConfig = {
  ...baseConfig,
  ...myOverrides,
};

/** Applies the narrow-screen overrides when the viewport is below the breakpoint. */
export function resolveResponsiveConfig(config: AnimationConfig, viewportWidth: number) {
  if (viewportWidth >= config.narrowBreakpointPx) return config;
  return {
    ...config,
    rollYaw: config.narrowRollYaw,
    cameraDistance: config.narrowCameraDistance,
    stripOffsetY: config.narrowStripOffsetY,
    sidePadding: config.narrowSidePadding,
  };
}

/** Turns off every motion effect for users who prefer reduced motion. */
export function withReducedMotion(config: AnimationConfig): AnimationConfig {
  return {
    ...config,
    introDuration: 0,
    bendStrength: 0,
    speedTilt: 0,
    speedScale: 1,
    parallaxStrength: 0,
    focusDuration: 0,
  };
}

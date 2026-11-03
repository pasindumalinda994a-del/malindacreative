import * as THREE from "three";
import type { AnimationConfig, SliderDirection } from "@/config/animationConfig";
import type { SlideMesh } from "./scene";

// This file is where config values turn into what you see.
// The frame loop (lib/slider/controller.ts) calls these functions
// for every slide, every frame, in this order:
//   placeSlide -> applySlideEffects -> bendPlane -> updateParallax

/** Distance from the screen center at which the parallax drift is at its maximum. */
const PARALLAX_DISTANCE = 3;
/** Bend below this is treated as flat, so we can skip rewriting vertices. */
const BEND_EPSILON = 1e-4;

const { lerp, degToRad, clamp } = THREE.MathUtils;

/**
 * Moves a slide to its place along the stack.
 * `position` is 0 at the screen center; positive values are up (vertical)
 * or left (horizontal), so scrolling down moves slides up / to the left.
 */
export function placeSlide(slide: SlideMesh, position: number, direction: SliderDirection) {
  if (direction === "vertical") {
    slide.mesh.position.set(0, position, 0);
  } else {
    slide.mesh.position.set(-position, 0, 0);
  }
}

type SlideEffectInput = {
  /** 0 = intro not started, 1 = intro finished. */
  introProgress: number;
  /** Speed with direction, -1 to 1 (from updateMotion). */
  signedSpeed: number;
  /** Speed without direction, 0 to 1. */
  speed: number;
};

/**
 * Applies the intro reveal and the speed effects to one slide:
 * opacity, scale, rotation and the intro offset.
 */
export function applySlideEffects(
  slide: SlideMesh,
  { introProgress, signedSpeed, speed }: SlideEffectInput,
  config: AnimationConfig,
) {
  const { mesh } = slide;
  const introRemaining = 1 - introProgress; // 1 at the start, 0 when finished.

  // Intro: blend from the "start" values to the resting values.
  mesh.material.opacity = lerp(config.introStartOpacity, 1, introProgress);
  if (slide.title) slide.title.mesh.material.opacity = mesh.material.opacity;
  mesh.position.y -= introRemaining * config.introStartOffset;
  mesh.rotation.z = degToRad(introRemaining * config.introStartRotation);
  const introScale = lerp(config.introStartScale, 1, introProgress);

  // Speed: shrink and tilt while moving fast.
  const speedScale = lerp(1, config.speedScale, speed);
  mesh.scale.setScalar(introScale * speedScale);

  // Tilt around the axis that crosses the direction of travel.
  const tilt = degToRad(signedSpeed * config.speedTilt);
  mesh.rotation.x = config.direction === "vertical" ? tilt : 0;
  mesh.rotation.y = config.direction === "horizontal" ? tilt : 0;
}

/**
 * Bends a slide towards the camera (or away, if `strength` is negative).
 * Points close to the center of the screen move the most,
 * and the effect fades out smoothly towards `bendRadius`.
 * Skips the vertex pass entirely while the strip is flat and at rest.
 */
export function bendPlane(slide: SlideMesh, strength: number, config: AnimationConfig) {
  if (Math.abs(strength) < BEND_EPSILON) {
    flattenSlide(slide);
    return;
  }

  const positions = slide.mesh.geometry.attributes.position;
  const { flatPositions } = slide;
  const { x: slideX, y: slideY } = slide.mesh.position;

  for (let i = 0; i < positions.count; i++) {
    const x = flatPositions[i * 3];
    const y = flatPositions[i * 3 + 1];
    positions.setZ(i, surfaceBend(slideX + x, slideY + y, config) * strength);
  }
  positions.needsUpdate = true;

  // The label uses the same curve as the photo (its mesh already sits a hair in front).
  if (slide.title) {
    const { mesh: title, flatPositions: titleFlat } = slide.title;
    const titlePositions = title.geometry.attributes.position;
    const originX = slideX + title.position.x;
    const originY = slideY + title.position.y;

    for (let i = 0; i < titlePositions.count; i++) {
      const x = titleFlat[i * 3];
      const y = titleFlat[i * 3 + 1];
      titlePositions.setZ(i, surfaceBend(originX + x, originY + y, config) * strength);
    }
    titlePositions.needsUpdate = true;
  }

  slide.isBent = true;
}

/** Restores the flat geometry. No-op when the slide is already flat. */
export function flattenSlide(slide: SlideMesh) {
  if (!slide.isBent) return;

  const positions = slide.mesh.geometry.attributes.position;
  const { flatPositions } = slide;
  for (let i = 0; i < positions.count; i++) {
    positions.setXYZ(i, flatPositions[i * 3], flatPositions[i * 3 + 1], flatPositions[i * 3 + 2]);
  }
  positions.needsUpdate = true;

  if (slide.title) {
    const titlePositions = slide.title.mesh.geometry.attributes.position;
    const titleFlat = slide.title.flatPositions;
    for (let i = 0; i < titlePositions.count; i++) {
      titlePositions.setXYZ(i, titleFlat[i * 3], titleFlat[i * 3 + 1], titleFlat[i * 3 + 2]);
    }
    titlePositions.needsUpdate = true;
  }

  slide.isBent = false;
}

/** How strongly the surface bends at one point on screen. 1 at the center, 0 past `bendRadius`. */
function surfaceBend(screenX: number, screenY: number, config: AnimationConfig) {
  const distance = Math.hypot(screenX, screenY);
  const falloff = Math.max(0, 1 - distance / config.bendRadius);
  return Math.pow(Math.sin((falloff * Math.PI) / 2), config.bendSharpness);
}

/**
 * Slides the photo inside its frame based on where the frame is on screen.
 * The photo moves a little slower than the frame, which creates depth.
 */
export function updateParallax(slide: SlideMesh, config: AnimationConfig) {
  const texture = slide.mesh.material.map;
  if (!texture) return; // Image not loaded yet.

  const { x, y } = slide.mesh.position;
  const { repeat } = texture;

  // How far the photo is allowed to drift (the extra room from the zoom in applyCoverCrop).
  const driftX = (repeat.x * config.parallaxStrength) / 2;
  const driftY = (repeat.y * config.parallaxStrength) / 2;

  texture.offset.x = (1 - repeat.x) / 2 + clamp(x / PARALLAX_DISTANCE, -1, 1) * driftX;
  texture.offset.y = (1 - repeat.y) / 2 + clamp(y / PARALLAX_DISTANCE, -1, 1) * driftY;
}

/**
 * Makes the image fill its frame without stretching, like CSS `object-fit: cover`.
 * Zoomed by `parallaxStrength` so updateParallax has room to drift.
 */
export function applyCoverCrop(
  texture: THREE.Texture,
  planeAspect: number,
  parallaxStrength: number,
) {
  const image = texture.image as HTMLImageElement | undefined;
  if (!image?.width || !image?.height) return;

  const imageAspect = image.width / image.height;
  const zoom = 1 + parallaxStrength;

  const visibleX = imageAspect > planeAspect ? planeAspect / imageAspect : 1;
  const visibleY = imageAspect > planeAspect ? 1 : imageAspect / planeAspect;

  texture.repeat.set(visibleX / zoom, visibleY / zoom);
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
}

/**
 * Applies strip-aspect cover while focused. Pass a lerped `parallaxStrength`
 * (e.g. full → 0 over focus.progress) so zoom-out eases instead of popping.
 */
export function lockFullscreenCover(slide: SlideMesh, parallaxStrength: number) {
  const texture = slide.mesh.material.map;
  if (!texture) return;
  const { width, height } = slide.mesh.geometry.parameters;
  applyCoverCrop(texture, width / height, parallaxStrength);
}

/** Restores strip cover UVs (with parallax zoom) after leaving fullscreen. */
export function restoreStripCover(slide: SlideMesh, config: AnimationConfig) {
  const texture = slide.mesh.material.map;
  if (!texture) return;
  const { width, height } = slide.mesh.geometry.parameters;
  applyCoverCrop(texture, width / height, config.parallaxStrength);
}

import * as THREE from "three";
import type { AnimationConfig, SliderDirection } from "@/config/animationConfig";
import { setSlideReveal } from "./corners";
import type { LandingPose } from "./intro";
import type { SlideMesh } from "./scene";

// This file is where config values turn into what you see.
// The frame loop (lib/slider/controller.ts) calls these functions
// for every slide, every frame, in this order:
//   placeSlide -> applySlideEffects -> bendPlane -> updateParallax
// While the landing intro is playing, applyLandingPose runs after the focus
// overlay and applies the same parallax, so the last intro frame matches idle.

/** Distance from the screen center at which the parallax drift is at its maximum. */
const PARALLAX_DISTANCE = 3;
/** Bend below this is treated as flat, so we can skip rewriting vertices. */
const BEND_EPSILON = 1e-4;
/** Titles stay hidden until the spread is mostly done, then fade in with it. */
const TITLE_FADE_START = 0.78;
/** Separates stacked planes so later irises paint in front without z-fighting. */
const STACK_Z_STEP = 0.002;

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
  /** Speed with direction, -1 to 1 (from updateMotion). */
  signedSpeed: number;
  /** Speed without direction, 0 to 1. */
  speed: number;
};

/**
 * Applies the speed effects to one slide: scale and tilt.
 * The landing reveal is a separate pass (applyLandingPose) so the two cannot stack.
 */
export function applySlideEffects(
  slide: SlideMesh,
  { signedSpeed, speed }: SlideEffectInput,
  config: AnimationConfig,
) {
  const { mesh } = slide;

  // Rest pose every frame. The focus overlay blends away from these values,
  // so a close can fade the neighbors back in instead of leaving them at 0.
  mesh.material.opacity = 1;
  if (slide.title) slide.title.mesh.material.opacity = 1;

  const speedScale = lerp(1, config.speedScale, speed);
  mesh.scale.setScalar(speedScale);

  // Tilt around the axis that crosses the direction of travel.
  const tilt = degToRad(signedSpeed * config.speedTilt);
  mesh.rotation.x = config.direction === "vertical" ? tilt : 0;
  mesh.rotation.y = config.direction === "horizontal" ? tilt : 0;
  mesh.rotation.z = 0;
}

/**
 * Stacks the opening slides, irises them, then eases them out to their
 * resting slots while the strip yaws from flat to `rollYaw`.
 * Call after applyFocusOverlay, which otherwise forces the full yaw.
 */
export function applyLandingPose(
  slides: SlideMesh[],
  slideGroup: THREE.Group,
  pose: LandingPose,
  ranks: number[],
  config: AnimationConfig,
) {
  const { spread } = pose;
  slideGroup.rotation.y = lerp(0, degToRad(config.rollYaw), spread);

  for (let index = 0; index < slides.length; index++) {
    const slide = slides[index];
    const { mesh } = slide;
    const rank = ranks[index] ?? -1;
    const inCluster = rank >= 0;

    if (inCluster) {
      if (config.direction === "horizontal") {
        mesh.position.x = lerp(0, mesh.position.x, spread);
      } else {
        mesh.position.y = lerp(0, mesh.position.y, spread);
      }
      mesh.position.z = rank * STACK_Z_STEP * (1 - spread);
      mesh.material.opacity = 1;
      const mask = pose.masks[index] ?? 0;
      setSlideReveal(mesh.material, mask);
      applyIntroZoom(slide, lerp(config.maskZoom, 1, mask), config);
    } else {
      mesh.position.z = 0;
      mesh.material.opacity = 0;
      setSlideReveal(mesh.material, 1);
    }

    // Same drift the idle strip uses, so the crop does not change when the intro ends.
    updateParallax(slide, config);

    if (slide.title) {
      const titleOpacity = inCluster ? clamp((spread - TITLE_FADE_START) / (1 - TITLE_FADE_START), 0, 1) : 0;
      slide.title.mesh.material.opacity = titleOpacity;
    }
  }
}

/**
 * Zooms the cover crop toward the center of the frame.
 * `imageZoom` of 1 is the resting cover. Higher values match the sample's scale(2) image.
 * Call updateParallax after this so the drift is applied on top of the zoom.
 */
export function applyIntroZoom(slide: SlideMesh, imageZoom: number, config: AnimationConfig) {
  const texture = slide.mesh.material.map;
  if (!texture) return;

  const { width, height } = slide.mesh.geometry.parameters;
  applyCoverCrop(texture, width / height, config.parallaxStrength);
  if (imageZoom <= 1.001) return;

  texture.repeat.multiplyScalar(1 / imageZoom);
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
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

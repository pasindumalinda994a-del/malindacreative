import * as THREE from "three";
import type { AnimationConfig } from "@/config/animationConfig";
import type { Slide } from "@/config/slides";
import { attachSlideCornerClip } from "./corners";
import { applyCoverCrop } from "./effects";
import type { SlideLayout } from "./layout";

/** The small label drawn on the image (index + name). One plane per slide; its vertices bend with the photo. */
export type SlideTitle = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  /** Flat vertex positions, so the label can be re-bent from scratch every frame. */
  flatPositions: Float32Array;
};

/** One image plane in the 3D scene. */
export type SlideMesh = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  /** Label on the image, or null until the web font has loaded. */
  title: SlideTitle | null;
  /** Position of this slide in the stack (see layout.ts). */
  offset: number;
  /** A copy of the flat vertex positions, so we can re-bend from scratch every frame. */
  flatPositions: Float32Array;
  /** True while the vertices hold a bend (lets us skip the flatten when already flat). */
  isBent: boolean;
};

/** Viewport size, cached once per resize so the frame loop never reads from `window`. */
export type Viewport = {
  width: number;
  height: number;
  aspect: number;
};

export type SliderScene = {
  slideMeshes: SlideMesh[];
  camera: THREE.PerspectiveCamera;
  slideGroup: THREE.Group;
  scene: THREE.Scene;
  viewport: Viewport;
  /** Resolves when every slide image has loaded or failed. The intro waits on this. */
  texturesReady: Promise<void>;
  /** Swap the active config (e.g. narrow-screen overrides) and re-fit the camera. */
  setConfig: (config: AnimationConfig) => void;
  resize: () => void;
  render: () => void;
  dispose: () => void;
};

/** Enough grid on the label for the scroll bend to curve it, not just shift it. */
const TITLE_WIDTH_SEGMENTS = 24;
const TITLE_HEIGHT_SEGMENTS = 2;
/** How far the label sits in front of its photo (world units). */
const TITLE_DEPTH_OFFSET = 0.02;
/** Max anisotropic filtering so oblique slides stay sharp without a big GPU cost. */
const MAX_ANISOTROPY = 8;

/**
 * Builds the renderer, camera and one textured plane per slide.
 * This file only sets things up; the per-frame animation lives in effects.ts.
 */
export function createSliderScene(
  canvas: HTMLCanvasElement,
  slides: Slide[],
  layout: SlideLayout,
  initialConfig: AnimationConfig,
): SliderScene {
  let config = initialConfig;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true, // Transparent, so the topographic background shows through.
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  const anisotropy = Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(config.cameraFov, 1, 0.1, 100);
  camera.position.z = config.cameraDistance;
  scene.add(camera);

  // All slides live in one group, so they stay on one plane and scale together.
  // Positive rollYaw turns that plane: the right side of the screen sits farther back.
  const slideGroup = new THREE.Group();
  slideGroup.rotation.y = THREE.MathUtils.degToRad(config.rollYaw);
  slideGroup.position.y = config.stripOffsetY;
  scene.add(slideGroup);

  const viewport: Viewport = { width: 1, height: 1, aspect: 1 };

  const textureLoader = new THREE.TextureLoader();
  let isDisposed = false;

  const textureLoads = slides.map(
    (slide) =>
      new Promise<THREE.Texture | null>((resolve) => {
        textureLoader.load(
          slide.image,
          (texture) => resolve(texture),
          undefined,
          () => resolve(null),
        );
      }),
  );

  const slideMeshes: SlideMesh[] = slides.map((_, index) => {
    const height = layout.heights[index];
    const width = height * config.aspectRatio;

    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      config.widthSegments,
      config.heightSegments,
    );
    // Soft paper-grey placeholder until the image has loaded.
    const material = new THREE.MeshBasicMaterial({
      color: 0xd8d3ca,
      side: THREE.DoubleSide,
      transparent: true, // Needed for the intro fade-in.
    });
    attachSlideCornerClip(material);
    const mesh = new THREE.Mesh(geometry, material);
    slideGroup.add(mesh);

    return {
      mesh,
      title: null,
      offset: layout.offsets[index],
      flatPositions: Float32Array.from(geometry.attributes.position.array),
      isBent: false,
    };
  });

  const texturesReady = Promise.all(textureLoads).then((textures) => {
    textures.forEach((texture, index) => {
      if (!texture) return;
      if (isDisposed) {
        texture.dispose();
        return;
      }

      const mesh = slideMeshes[index].mesh;
      const { width, height } = mesh.geometry.parameters;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      applyCoverCrop(texture, width / height, config.parallaxStrength);
      mesh.material.map = texture;
      mesh.material.color.set(0xffffff);
      mesh.material.needsUpdate = true;
    });
  });

  // Labels are rasterised to canvas textures, so wait for the web font before drawing them.
  void buildTitlesWhenFontsReady();

  async function buildTitlesWhenFontsReady() {
    const fontFamily = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim()
      || getComputedStyle(document.body).fontFamily;
    try {
      await Promise.all([document.fonts.ready, document.fonts.load(`500 100px ${fontFamily}`)]);
    } catch {
      // Font loading failed or is unsupported; draw with whatever the browser has.
    }
    if (isDisposed) return;

    slideMeshes.forEach((slideMesh, index) => {
      const geometry = slideMesh.mesh.geometry;
      const { width, height } = geometry.parameters;
      const label = `${String(index + 1).padStart(2, "0")} — ${slides[index].name.toUpperCase()}`;
      const title = createSlideTitle(label, width, height, fontFamily, anisotropy);
      // Hidden until the landing pose or the settled strip raises it, so a late
      // label cannot flash on top of the iris.
      title.mesh.material.opacity = 0;
      slideMesh.mesh.add(title.mesh);
      slideMesh.title = title;
    });
  }

  function fit() {
    camera.aspect = viewport.aspect;
    camera.position.z = config.cameraDistance;
    camera.updateProjectionMatrix();
    fitToViewport(slideGroup, camera, config);
  }

  function resize() {
    viewport.width = Math.max(1, window.innerWidth);
    viewport.height = Math.max(1, window.innerHeight);
    viewport.aspect = viewport.width / viewport.height;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxPixelRatio));
    renderer.setSize(viewport.width, viewport.height, false); // `false`: CSS controls the canvas size.

    fit();
  }

  function setConfig(next: AnimationConfig) {
    config = next;
    // Camera / scale update only — rollYaw and stripOffsetY are applied each frame in focus.ts.
    fit();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    isDisposed = true;
    slideMeshes.forEach(({ mesh, title }) => {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
      if (title) {
        title.mesh.geometry.dispose();
        title.mesh.material.map?.dispose();
        title.mesh.material.dispose();
      }
    });
    renderer.dispose();
  }

  resize();

  return {
    slideMeshes,
    camera,
    slideGroup,
    scene,
    viewport,
    texturesReady,
    setConfig,
    resize,
    render,
    dispose,
  };
}

/**
 * One subdivided plane carrying the whole label, parented to the slide along
 * its bottom-left edge. Mono, uppercase, tracked: the same voice as the DOM metadata.
 */
function createSlideTitle(
  text: string,
  slideWidth: number,
  slideHeight: number,
  fontFamily: string,
  anisotropy: number,
): SlideTitle {
  // Rasterised large and minified with mipmaps, so thin strokes survive on far slides.
  const pixelHeight = 160;
  const fontSize = Math.round(pixelHeight * 0.42);
  const tracking = fontSize * 0.06;
  const paddingX = Math.round(fontSize * 0.5);

  const canvas = document.createElement("canvas");
  canvas.height = pixelHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not draw a slide title.");
  }

  const font = `500 ${fontSize}px ${fontFamily}`;
  context.font = font;
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${tracking}px`;
  }
  const textWidth = context.measureText(text).width + tracking;
  canvas.width = Math.max(32, Math.ceil(textWidth + paddingX * 2));

  // Resizing the canvas resets its state.
  context.font = font;
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${tracking}px`;
  }
  context.fillStyle = "#ffffff";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, paddingX, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;

  // Label height on the image, then width from the canvas aspect. Never wider than the image.
  const worldHeight = slideHeight * 0.075;
  const worldWidth = Math.min(slideWidth * 0.9, worldHeight * (canvas.width / canvas.height));

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const geometry = new THREE.PlaneGeometry(
    worldWidth,
    worldHeight,
    TITLE_WIDTH_SEGMENTS,
    TITLE_HEIGHT_SEGMENTS,
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;

  const insetX = slideWidth * 0.05 - (paddingX / canvas.width) * worldWidth;
  const insetY = slideHeight * 0.07;
  // A hair in front of the photo so the two planes never z-fight.
  mesh.position.set(
    -slideWidth / 2 + insetX + worldWidth / 2,
    -slideHeight / 2 + insetY + worldHeight / 2,
    TITLE_DEPTH_OFFSET,
  );

  return {
    mesh,
    flatPositions: Float32Array.from(geometry.attributes.position.array),
  };
}

/** Scales the slides down on small screens so they always fit. */
function fitToViewport(
  slideGroup: THREE.Group,
  camera: THREE.PerspectiveCamera,
  config: AnimationConfig,
) {
  const fovInRadians = THREE.MathUtils.degToRad(camera.fov);
  const visibleHeight = 2 * camera.position.z * Math.tan(fovInRadians / 2);
  const visibleWidth = visibleHeight * camera.aspect;

  const slideWidth = config.maxHeight * config.aspectRatio;
  const fitWidth = (visibleWidth - config.sidePadding * 2) / slideWidth;
  const fitHeight = (visibleHeight - config.sidePadding * 2) / config.maxHeight;

  // Vertical sliders must fit the screen's width; horizontal ones its height,
  // and on narrow screens also its width so one slide never overflows the phone.
  const scale = config.direction === "vertical" ? fitWidth : Math.min(fitHeight, fitWidth);

  slideGroup.scale.setScalar(Math.min(1, scale));
}

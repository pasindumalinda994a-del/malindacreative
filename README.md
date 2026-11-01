# Infinite 3D Slider

A full-screen image slider that loops forever. Slides reveal themselves when the page loads. When you scroll, drag or swipe, they bend towards you in 3D, and the faster you move, the more they bend.

Built with **Next.js**, **TypeScript**, **Three.js** and **Tailwind CSS**.

This is a learning project about one idea: **changing animation variables changes the visual result**. Every setting lives in one config file. Change a few numbers, save, and you get a different animation, without touching the animation code.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You can scroll with a mouse wheel or trackpad, click and drag, or swipe on a phone.

## Change the style in 10 seconds

Open `config/animationConfig.ts`.

**Tweak anything.** Uncomment or add lines in `myOverrides`. These always win over the defaults:

```ts
const myOverrides: Partial<AnimationConfig> = {
  bendStrength: 5,
  introStartRotation: 20,
};
```

Or edit the values in `baseConfig` directly. The page updates as soon as you save, and the intro plays again so you can see the change.

The final settings are built in two layers, and later layers win:

```
baseConfig (defaults)  ->  myOverrides
```

## Variable reference

Every value is also commented in `config/animationConfig.ts`. Sizes are in Three.js "world units": with the default camera, the screen is about 4 units tall. Times are in seconds, angles in degrees.

### Direction

| Variable    | Default        | What it does                                |
| ----------- | -------------- | ------------------------------------------- |
| `direction` | `"horizontal"` | `"vertical"` or `"horizontal"` slide travel |

### Layout

| Variable      | Default | What it does                                          |
| ------------- | ------- | ----------------------------------------------------- |
| `minHeight`   | `1.4`   | Smallest slide height (each slide gets a random one)   |
| `maxHeight`   | `1.4`   | Largest slide height. Equal to `minHeight` = same size |
| `aspectRatio` | `1.78`  | Slide width = height x aspectRatio                     |
| `gap`         | `0.3`   | Space between slides                                   |

### Scroll feel

| Variable           | Default | What it does                                       |
| ------------------ | ------- | -------------------------------------------------- |
| `scrollSmoothing`  | `0.025` | How fast the slider catches up. Lower = floatier    |
| `momentumFriction` | `0.975` | Speed kept per frame after a fling. Higher = longer |
| `wheelSpeed`       | `0.01`  | Distance per pixel of mouse wheel                   |
| `dragSpeed`        | `0.01`  | Distance per pixel of mouse drag                    |
| `dragMomentum`     | `0.01`  | Fling strength after a mouse drag                   |
| `touchSpeed`       | `0.01`  | Distance per pixel of touch swipe                   |
| `touchMomentum`    | `0.1`   | Fling strength after a touch swipe                  |

### Bend effect (grows with scroll speed)

| Variable        | Default | What it does                                         |
| --------------- | ------- | ---------------------------------------------------- |
| `bendStrength`  | `1.8`   | Bend depth at full speed. `0` = flat, negative = away |
| `bendRadius`    | `3.5`   | Size of the curved area around the screen center      |
| `bendSharpness` | `1.5`   | Curve shape. Low = soft dome, high = sharp peak       |
| `bendSmoothing` | `0.1`   | How quickly the bend grows and relaxes                |

### Speed effects (also grow with scroll speed)

| Variable     | Default | What it does                                     |
| ------------ | ------- | ------------------------------------------------ |
| `speedTilt`  | `0`     | Degrees the slides tilt at full speed            |
| `speedScale` | `0.9`   | Size at full speed. `0.85` = shrink to 85%       |

### Image

| Variable           | Default | What it does                                          |
| ------------------ | ------- | ----------------------------------------------------- |
| `parallaxStrength` | `0.2`   | How far photos drift inside their frames (`0`-`0.3`)   |

### Intro reveal (plays once on load)

| Variable             | Default           | What it does                                       |
| -------------------- | ----------------- | -------------------------------------------------- |
| `introDuration`      | `2.2`             | How long each slide takes to appear                 |
| `introDelay`         | `0.3`             | Wait before the first slide starts                  |
| `introStagger`       | `0.15`            | Extra wait between one slide and the next           |
| `introStaggerFrom`   | `"center"`        | `"center"` (middle outwards) or `"start"` (top/left) |
| `introEase`          | `"easeInOutCubic"`| Easing curve (see below)                            |
| `introStartScale`    | `0.7`             | Starting size. `0.5` = half size                    |
| `introStartOpacity`  | `0`               | Starting transparency. `0` = invisible              |
| `introStartOffset`   | `0`               | How far below its place a slide starts              |
| `introStartRotation` | `0`               | Starting rotation in degrees                        |

### Text (title and number)

| Variable       | Default            | What it does                              |
| -------------- | ------------------ | ----------------------------------------- |
| `textDuration` | `1.2`              | Fade-in length when the slide changes      |
| `textDistance` | `0.2`              | How far the text slides up, in rem         |
| `textEase`     | `"easeInOutCubic"` | Easing curve of the text fade-in           |

### Camera and quality

| Variable                          | Default    | What it does                                   |
| --------------------------------- | ---------- | ---------------------------------------------- |
| `cameraFov`                       | `35`       | Field of view. Lower = flatter "telephoto" look |
| `cameraDistance`                  | `6.5`      | Camera distance. Higher = smaller slides        |
| `sidePadding`                     | `0.2`      | Space kept around slides on small screens       |
| `widthSegments`, `heightSegments` | `32`, `16` | Grid detail. More = smoother bend, more work    |
| `maxPixelRatio`                   | `2`        | Caps resolution on high-DPI screens for speed   |

### Easing names

Used by `introEase` and `textEase`. They are defined in `lib/slider/easing.ts` (preview them at [easings.net](https://easings.net)):

`linear`, `easeOutQuad`, `easeOutCubic`, `easeOutQuart`, `easeOutExpo`, `easeOutBack` (overshoots, then settles), `easeInOutCubic` (slow start and end).

## Folder map

```
app/
  page.tsx              The main page. Renders <InfiniteSlider />.
  layout.tsx            Wraps every page: font, <html>, <body>, page title.
  globals.css           Tailwind setup, colors, the text fade-in animation.

components/
  InfiniteSlider.tsx    The slider: a <canvas> plus the text overlay.
  SlideInfo.tsx         The slide title (left) and number (right).

hooks/
  useInfiniteSlider.ts  Sets everything up and runs the animation loop.

config/                 <- Start here
  animationConfig.ts    Override values, see every default.
  slides.ts             Slide names and images.

lib/slider/             The animation logic (you rarely need to edit this)
  layout.ts             Random slide sizes, stacking, the infinite loop.
  scene.ts              Three.js setup: renderer, camera, image planes.
  input.ts              Mouse wheel, drag and touch listeners.
  motion.ts             Easing, momentum, and measuring scroll speed.
  intro.ts              Intro order and progress for each slide.
  effects.ts            Turns config values into visuals: move, fade, scale,
                        tilt, bend, parallax.
  easing.ts             Named easing curves.

public/slides/          The images.
reference/              The original vanilla JS version, for comparison.
```

## How it works

```
config/animationConfig.ts    (what it should look like)
        |
components/InfiniteSlider    (receives the config)
        |
hooks/useInfiniteSlider      (runs the loop every frame)
        |
lib/slider/*                 (the math)
        |
Rendered slides
```

### 1. From page to animation

`app/page.tsx` is a **Server Component**: it is rendered on the server and has no interactivity. It renders `InfiniteSlider`, which starts with `"use client"` because it needs browser-only features: the canvas, mouse events and WebGL.

`InfiniteSlider` takes an optional `config` prop. Without one, it uses the config from `config/animationConfig.ts`.

### 2. Setup

The `useEffect` in `useInfiniteSlider.ts` runs when the slider appears, and again whenever the config changes:

1. **`createSlideLayout`** (`layout.ts`) picks a random height for each slide and lines them up.
2. **`createSliderScene`** (`scene.ts`) creates the renderer, the camera and one image plane per slide.
3. **`createMotionState`** (`motion.ts`) creates a plain object holding the scroll position and speed.
4. **`attachSliderInput`** (`input.ts`) listens to the wheel, mouse and touch, and writes into that object.
5. **`createIntroOrder`** (`intro.ts`) decides which slide appears first.

### 3. The animation loop (about 60 times per second)

1. **`updateMotion`** eases the scroll position towards its target, applies momentum, and measures speed (0 to 1).
2. For every slide:
   - **`getLoopedPosition`** works out where the slide is, wrapping around so the loop never ends.
   - **`getIntroProgress`** says how far this slide is through its intro (0 to 1, eased).
   - **`placeSlide`** moves the slide there.
   - **`applySlideEffects`** applies the intro (fade, offset, scale, rotation) and the speed effects (tilt, shrink).
   - **`bendPlane`** curves the slide based on speed.
   - **`updateParallax`** drifts the photo inside its frame.
3. The slide **closest to the center** is found. React state updates only when it changes, so React does not re-render 60 times per second.
4. Three.js **renders** the frame.

### 4. Cleanup

When the slider is removed (or the config changes), the cleanup function stops the loop, removes all event listeners and frees GPU memory. In development, React mounts components twice on purpose to catch missing cleanup, so this step matters.

### Key ideas worth learning

- **Configuration over code**: one function reads numbers from a config, so new styles need no new code.
- **Easing ("lerp")**: `position += (target - position) * smoothing`. Each frame the slider moves a fraction of the remaining distance, so it slows down smoothly.
- **Easing curves**: `ease(progress)` turns straight 0 -> 1 progress into a natural motion.
- **Stagger**: each slide starts `introStagger` seconds after the previous one.
- **Momentum with friction**: after a fling, `momentum *= friction` every frame until it is nearly zero.
- **Wrapping**: `((value % range) + range) % range` keeps a number in a range, which makes the loop infinite.
- **Refs vs state**: values that change every frame live in a plain object, not in React state.

## Accessibility

For visitors whose system has **reduce motion** turned on, the intro, bend, tilt, shrink and parallax are switched off automatically, and the text appears without animating.

## Other customizations

### Use your own images

1. Put your images in `public/slides/`.
2. Edit `config/slides.ts`. Each slide has a `name` and an `image` path, for example `"/slides/my-photo.jpg"`.

Images are cropped to fill each slide (like CSS `object-fit: cover`), so any size works. Use enough slides to fill the screen: about 6 for vertical, 8 or more for horizontal.

### Colors, text layout and font

- **Background / text color**: `--color-background` and `--color-foreground` in `app/globals.css`.
- **Title layout**: the Tailwind classes in `components/SlideInfo.tsx`. For example, change `px-8` to `px-16`, or add `text-xl`.
- **Font**: the project uses [Geist](https://vercel.com/font) via `next/font/google` in `app/layout.tsx`. To switch, import another font (for example `Inter`) and keep the `variable: "--font-geist-sans"` option. The original design used *PP Neue Montreal*; if you have a license, load it with `next/font/local`.

## Scripts

```bash
npm run dev     # Start the development server
npm run build   # Build for production
npm run start   # Run the production build
npm run lint    # Check the code with ESLint
```

## Credits

The animation is based on the Codegrid Three.js infinite slider. The original vanilla JavaScript version is in `reference/` for comparison.

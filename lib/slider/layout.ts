import type { AnimationConfig } from "@/config/animationConfig";

export type SlideLayout = {
  /** Random height of each slide. */
  heights: number[];
  /** Where the center of each slide sits along the stack (first slide = 0). */
  offsets: number[];
  /** Total length of the stack, including the gap before it repeats. */
  loopLength: number;
};

/**
 * Gives every slide a random height and lines them up with a gap:
 * top-to-bottom for "vertical", left-to-right for "horizontal".
 */
export function createSlideLayout(slideCount: number, config: AnimationConfig): SlideLayout {
  const { minHeight, maxHeight, gap, aspectRatio, direction } = config;

  const heights = Array.from(
    { length: slideCount },
    () => minHeight + Math.random() * (maxHeight - minHeight),
  );

  // How much room each slide takes up along the direction of travel.
  const lengths = direction === "vertical" ? heights : heights.map((height) => height * aspectRatio);

  const offsets: number[] = [];
  let stackEdge = 0; // Far edge of the last slide we placed.

  lengths.forEach((length, index) => {
    if (index === 0) {
      offsets.push(0);
      stackEdge = length / 2;
      return;
    }

    stackEdge += gap + length / 2;
    offsets.push(stackEdge);
    stackEdge += length / 2;
  });

  // After the last slide comes a gap, then the first slide again.
  const loopLength = stackEdge + gap + lengths[0] / 2;

  return { heights, offsets, loopLength };
}

/** Keeps a value between 0 and `range`, wrapping around like a clock. */
export function wrap(value: number, range: number) {
  return ((value % range) + range) % range;
}

/**
 * Returns a slide's position along the stack for the current scroll
 * (0 = screen center). The result always stays within half a loop of the
 * center, so slides that leave one edge of the screen re-enter at the other.
 */
export function getLoopedPosition(
  slideOffset: number,
  scrollPosition: number,
  loopLength: number,
) {
  const halfLoop = loopLength / 2;
  return wrap(scrollPosition - slideOffset + halfLoop, loopLength) - halfLoop;
}

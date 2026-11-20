"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { EyeBrow } from "@/components/about/EyeBrow";
import { EyeMark } from "@/components/about/EyeMark";
import { RainbowPupil } from "@/components/about/RainbowPupil";

/** Iris ring diameter as a fraction of the eye SVG width (source r 102.3 / 490). */
export const IRIS_SCALE = (102.3 * 2) / 490;

/** Pupil diameter as a fraction of the eye SVG width (source r 82.4 / 490). */
export const PUPIL_SCALE = (82.4 * 2) / 490;

/**
 * Iris disc sized larger than the socket so an offset never reveals paper
 * through the EyeMark hole (must cover max travel + socket radius).
 */
const IRIS_OVERSIZE = 1.55;

export type EyeGazeHandle = {
  /** @deprecated Prefer `iris` — kept as alias for the iris disc wrapper. */
  gaze: HTMLDivElement | null;
  iris: HTMLDivElement | null;
  pupil: HTMLDivElement | null;
  brow: HTMLDivElement | null;
  eye: HTMLDivElement | null;
};

type EyeGazeProps = {
  brand: string;
  pathId: string;
  /** Rainbow reveal phase offset for the right eye. */
  pupilDelay?: number;
  className?: string;
};

/**
 * One eye column: reactive brow + socket-clipped iris/pupil that AboutHero drives.
 * Fixed circular socket matches the EyeMark hole; oversized iris always fills it.
 */
export const EyeGaze = forwardRef<EyeGazeHandle, EyeGazeProps>(function EyeGaze(
  { brand, pathId, pupilDelay = 0, className },
  ref,
) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  const browRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    get gaze() {
      return irisRef.current;
    },
    get iris() {
      return irisRef.current;
    },
    get pupil() {
      return pupilRef.current;
    },
    get brow() {
      return browRef.current;
    },
    get eye() {
      return eyeRef.current;
    },
  }));

  const socketSize = `${IRIS_SCALE * 100}%`;
  // Sized vs the socket (containing block), not the full eye.
  const irisSize = `${IRIS_OVERSIZE * 100}%`;
  const pupilInSocket = `${(PUPIL_SCALE / IRIS_SCALE) * 100}%`;

  return (
    <div
      className={`relative flex h-full w-fit max-w-[48vw] flex-col items-center md:max-w-[46vw] ${className ?? ""}`}
    >
      <div ref={browRef} className="w-[92%] shrink-0 will-change-transform">
        <EyeBrow label={brand} pathId={pathId} className="-mb-[1.5%] w-full" />
      </div>
      <div ref={eyeRef} className="relative min-h-0 w-fit flex-1">
        {/* Fixed circular socket — matches EyeMark hole; never moves */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 overflow-hidden rounded-full"
          style={{
            width: socketSize,
            height: socketSize,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Oversized iris — GSAP translates the wrapper; fill spins on a child */}
          <div
            ref={irisRef}
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{ width: irisSize, height: irisSize }}
          >
            <div className="eye-iris-fill absolute inset-0 rounded-full" />
          </div>
          {/* Rainbow pupil — slight lead for depth; travel clamped in AboutHero */}
          <div
            ref={pupilRef}
            className="absolute left-1/2 top-1/2 z-[1] will-change-transform"
            style={{ width: pupilInSocket, height: pupilInSocket }}
          >
            <RainbowPupil delay={pupilDelay} className="absolute inset-0" />
          </div>
        </div>
        <EyeMark className="relative z-10 block h-full w-auto text-ink" />
      </div>
    </div>
  );
});

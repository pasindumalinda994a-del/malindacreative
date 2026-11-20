"use client";

import { type CSSProperties, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, CustomEase);

/** Rainbow stops cycled by the circular iris reveal. */
const RAINBOW = [
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#007aff",
  "#5856d6",
  "#af52de",
] as const;

/** Seconds per circular reveal — smooth ease, slightly snappier pace. */
const DURATION = 0.95;
/** Brief pause after a color settles before the next iris. */
const HOLD = 0.08;

const CLIP_CLOSED = "circle(0% at 50% 50%)";
const CLIP_OPEN = "circle(72% at 50% 50%)";

type RainbowPupilProps = {
  className?: string;
  style?: CSSProperties;
  /** Start delay in seconds (phase offset between eyes). */
  delay?: number;
};

/**
 * Middle-ball rainbow fill: stacked colors revealed by an expanding
 * circular clip. Sized by the parent gaze wrapper (iris ring + inset).
 */
export function RainbowPupil({ className, style, delay = 0 }: RainbowPupilProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const base = baseRef.current;
      const reveal = revealRef.current;
      if (!base || !reveal) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        base.style.backgroundColor = RAINBOW[3];
        gsap.set(reveal, { clipPath: CLIP_OPEN, backgroundColor: RAINBOW[3] });
        return;
      }

      // Softer than landing hop — still iris-like, less abrupt at the open.
      const irisEase =
        CustomEase.get("eyeIrisSmooth") ??
        CustomEase.create("eyeIrisSmooth", "0.45, 0.05, 0.15, 1");

      let index = 0;
      gsap.set(base, { backgroundColor: RAINBOW[0] });
      gsap.set(reveal, { clipPath: CLIP_CLOSED, backgroundColor: RAINBOW[1] });

      const ctx = { killed: false };
      let active: gsap.core.Tween | null = null;
      let startCall: gsap.core.Tween | null = null;
      let holdCall: gsap.core.Tween | null = null;

      const playReveal = () => {
        if (ctx.killed) return;
        active = gsap.fromTo(
          reveal,
          { clipPath: CLIP_CLOSED },
          {
            clipPath: CLIP_OPEN,
            duration: DURATION,
            ease: irisEase,
            onComplete: () => {
              if (ctx.killed) return;
              index = (index + 1) % RAINBOW.length;
              const shown = RAINBOW[index];
              const next = RAINBOW[(index + 1) % RAINBOW.length];
              gsap.set(base, { backgroundColor: shown });
              gsap.set(reveal, { clipPath: CLIP_CLOSED, backgroundColor: next });
              holdCall = gsap.delayedCall(HOLD, playReveal);
            },
          },
        );
      };

      startCall = gsap.delayedCall(delay, playReveal);

      return () => {
        ctx.killed = true;
        startCall?.kill();
        holdCall?.kill();
        active?.kill();
      };
    },
    { dependencies: [delay], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none overflow-hidden rounded-full ${className ?? ""}`}
      style={style}
    >
      <div ref={baseRef} className="absolute inset-0" />
      <div ref={revealRef} className="absolute inset-0 will-change-[clip-path]" />
    </div>
  );
}

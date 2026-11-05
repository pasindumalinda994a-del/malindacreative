"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

/** Extra scale so translateY never reveals empty edges inside the clip. */
const SCALE = 1.12;
/** Max Y drift as a fraction of the image height (±). Kept mild so it doesn't fight the container. */
const DRIFT = 0.07;
/** Peak container translateY in px at speed=1 (centered progress → ± this). */
const AMPLITUDE = 64;

type ProjectGalleryImageProps = {
  src: string;
  aspectClass: string;
  /** Relative scroll lag for the frame container (1 = default amplitude). */
  speed?: number;
};

/**
 * Gallery frame with Lenis-driven container + inner-image Y parallax,
 * plus a clip-path wipe mask driven by ProjectGallery ScrollTrigger.
 * Must live inside the ProjectDetail SmoothScroll so useLenis hits the nested instance.
 */
export function ProjectGalleryImage({
  src,
  aspectClass,
  speed = 1,
}: ProjectGalleryImageProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reducedMotion = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotion.current = media.matches;
      if (!media.matches) return;
      const frame = frameRef.current;
      const img = imgRef.current;
      if (frame) frame.style.transform = "translate3d(0, 0, 0)";
      if (img) img.style.transform = `translate3d(0, 0, 0) scale(${SCALE})`;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [src]);

  useLenis((instance) => {
    const shell = shellRef.current;
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!shell || !frame || !img || reducedMotion.current) return;

    const root = instance.rootElement;
    const rootRect = root.getBoundingClientRect();
    // Measure the untransformed shell so container translateY doesn't feed back into progress.
    const shellRect = shell.getBoundingClientRect();

    // 0 when the shell top enters the bottom of the scroller; 1 when it leaves the top.
    const travel = rootRect.height + shellRect.height;
    if (travel <= 0) return;
    const progress = (rootRect.bottom - shellRect.top) / travel;
    const clamped = Math.min(1, Math.max(0, progress));
    // Center at 0.5 → drift from +amp to −amp (moves slower than scroll).
    const centered = 0.5 - clamped;

    const yPx = centered * 2 * AMPLITUDE * speedRef.current;
    frame.style.transform = `translate3d(0, ${yPx.toFixed(2)}px, 0)`;

    const yPercent = centered * DRIFT * 2 * 100;
    img.style.transform = `translate3d(0, ${yPercent.toFixed(3)}%, 0) scale(${SCALE})`;
  });

  return (
    <div ref={shellRef} className={aspectClass}>
      <div
        data-gallery-mask
        className="h-full w-full overflow-hidden rounded-sm bg-paper-2 will-change-[clip-path]"
        style={{ clipPath: "inset(0 0 100% 0)" }}
      >
        <div
          ref={frameRef}
          className="h-full w-full will-change-transform"
        >
          {/* Plain <img>: the WebGL strip already loaded these exact files, so next/image would only re-encode them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover will-change-transform"
            style={{ transform: `translate3d(0, 0, 0) scale(${SCALE})` }}
          />
        </div>
      </div>
    </div>
  );
}

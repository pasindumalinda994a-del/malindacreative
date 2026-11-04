"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { LenisOptions } from "lenis";
import { ReactLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";

type SmoothScrollProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
  /**
   * `true` — document scroll (future route layouts).
   * `false` / omitted — nested scroller (ProjectDetail overlay).
   */
  root?: boolean | "asChild";
  options?: LenisOptions;
};

/**
 * Thin Lenis wrapper for DOM scroll surfaces.
 * Use nested (default) on overflow containers; use `root` only on document-scrolling routes —
 * never on the Three.js homepage strip.
 */
export const SmoothScroll = forwardRef<LenisRef, SmoothScrollProps>(
  function SmoothScroll({ children, root = false, options, className, ...props }, ref) {
    return (
      <ReactLenis
        ref={ref}
        root={root}
        className={className}
        options={{
          autoRaf: true,
          lerp: 0.09,
          smoothWheel: true,
          syncTouch: false,
          respectReducedMotion: true,
          ...options,
        }}
        {...props}
      >
        {children}
      </ReactLenis>
    );
  },
);

export type { LenisRef };

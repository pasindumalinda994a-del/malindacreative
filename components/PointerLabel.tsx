"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

type PointerLabelProps = {
  /** Show the label (pointer is over a slide while browsing). */
  active: boolean;
  label?: string;
};

/**
 * Small accent disc that follows the mouse while a slide is hovered.
 * Positions itself straight from `mousemove` (no React state per move) and
 * only renders on devices with a fine pointer. Scale/opacity animate with GSAP.
 */
export function PointerLabel({ active, label = "Open" }: PointerLabelProps) {
  const element = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!finePointer) return;
    const move = (event: MouseEvent) => {
      const node = element.current;
      if (!node) return;
      node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [finePointer]);

  useGSAP(
    () => {
      if (!disc.current) return;
      gsap.set(disc.current, { scale: 0.5, opacity: 0 });
    },
    { dependencies: [finePointer], scope: element },
  );

  useGSAP(
    () => {
      if (!disc.current) return;
      gsap.to(disc.current, {
        scale: active ? 1 : 0.5,
        opacity: active ? 1 : 0,
        duration: 0.4,
        ease: active ? "power3.out" : "power2.inOut",
        overwrite: "auto",
      });
    },
    { dependencies: [active, finePointer], scope: element },
  );

  if (!finePointer) return null;

  return (
    <div
      ref={element}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 will-change-transform"
    >
      <div
        ref={disc}
        className="label-mono flex size-16 items-center justify-center rounded-full bg-accent text-paper will-change-transform"
      >
        {label}
      </div>
    </div>
  );
}

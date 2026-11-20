"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import type { AboutGalleryItem } from "@/config/about";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GALLERY_SPEEDS = [0.45, 1, 0.7, 1.15];
const SCALE = 1.12;
const DRIFT = 0.07;
const AMPLITUDE = 64;

const pad = (value: number) => String(value).padStart(2, "0");

type AboutGalleryProps = {
  gallery: AboutGalleryItem[];
};

function AboutGalleryImage({
  src,
  aspectClass,
  speed = 1,
}: {
  src: string;
  aspectClass: string;
  speed?: number;
}) {
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

  useLenis(() => {
    const shell = shellRef.current;
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!shell || !frame || !img || reducedMotion.current) return;

    // Document (root) Lenis: measure against the viewport, not the full page box.
    const viewH = window.innerHeight;
    const shellRect = shell.getBoundingClientRect();
    const travel = viewH + shellRect.height;
    if (travel <= 0) return;

    const progress = (viewH - shellRect.top) / travel;
    const clamped = Math.min(1, Math.max(0, progress));
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
        <div ref={frameRef} className="h-full w-full will-change-transform">
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

/**
 * Studio visual essay — alternating spans, clip-path wipe, Lenis parallax.
 */
export function AboutGallery({ gallery }: AboutGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const masks = gsap.utils.toArray<HTMLElement>("[data-gallery-mask]", root);
      if (!masks.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(masks, { clipPath: "inset(0% 0 0 0)" });
        return;
      }

      gsap.set(masks, { clipPath: "inset(0 0 100% 0)" });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const triggers = ScrollTrigger.batch(masks, {
        start: "top 88%",
        once: true,
        interval: 0.12,
        onEnter: (batch) => {
          gsap.to(batch, {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.15,
            ease: "power3.inOut",
            stagger: 0.14,
            overwrite: "auto",
          });
        },
      });

      const refreshId = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(refreshId);
        lenis.off("scroll", onScroll);
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [gallery, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-24 grid grid-cols-12 gap-x-4 gap-y-10 md:mt-32 md:gap-x-6"
    >
      {gallery.map((item, i) => (
        <figure
          key={item.src + i}
          className={`col-span-12 ${i % 2 === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-24"}`}
        >
          <AboutGalleryImage
            src={item.src}
            aspectClass={i % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}
            speed={GALLERY_SPEEDS[i % GALLERY_SPEEDS.length]}
          />
          <figcaption className="label-mono mt-3 flex justify-between text-ink-muted">
            <span>
              Fig. {pad(i + 1)} <span className="mx-2 text-rule-strong">—</span>{" "}
              {item.caption}
            </span>
            <span>Studio</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

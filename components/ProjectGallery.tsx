"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { ProjectGalleryImage } from "@/components/ProjectGalleryImage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Relative container parallax speeds cycled across gallery figures. */
const GALLERY_SPEEDS = [0.45, 1, 0.7, 1.15];

const pad = (value: number) => String(value).padStart(2, "0");

type ProjectGalleryProps = {
  gallery: string[];
  name: string;
  /** Rebuild the wipe when the open project changes. */
  slug: string;
};

/**
 * Project gallery grid with ScrollTrigger clip-path wipe (staggered) +
 * per-image Lenis parallax inside ProjectGalleryImage.
 * Must live inside ProjectDetail's nested SmoothScroll.
 */
export function ProjectGallery({ gallery, name, slug }: ProjectGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const scroller = lenis.rootElement;
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
        scroller,
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
        lenis.resize();
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(refreshId);
        lenis.off("scroll", onScroll);
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [slug, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-24 grid grid-cols-12 gap-x-4 gap-y-10 md:mt-32 md:gap-x-6"
    >
      {gallery.map((image, i) => (
        <figure
          key={image + i}
          className={`col-span-12 ${i % 2 === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-24"}`}
        >
          <ProjectGalleryImage
            src={image}
            aspectClass={i % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}
            speed={GALLERY_SPEEDS[i % GALLERY_SPEEDS.length]}
          />
          <figcaption className="label-mono mt-3 flex justify-between text-ink-muted">
            <span>
              Fig. {pad(i + 1)} <span className="mx-2 text-rule-strong">—</span> Placeholder
              visual
            </span>
            <span>{name}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

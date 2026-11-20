"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type AboutApproachProps = {
  paragraphs: string[];
};

/**
 * Approach body with staggered fade/rise — offset columns on desktop.
 */
export function AboutApproach({ paragraphs }: AboutApproachProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const label = root.querySelector<HTMLElement>("[data-approach-label]");
      const paras = gsap.utils.toArray<HTMLElement>("[data-approach-para]", root);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set([label, ...paras].filter(Boolean), { clearProps: "all" });
        return;
      }

      gsap.set(label, { opacity: 0, y: 16 });
      gsap.set(paras, { opacity: 0, y: 16 });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          once: true,
          toggleActions: "play none none none",
        },
      });

      if (label) {
        tl.to(label, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0);
      }

      if (paras.length) {
        tl.to(
          paras,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power2.out",
            stagger: 0.12,
          },
          0.08,
        );
      }

      const refreshId = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(refreshId);
        lenis.off("scroll", onScroll);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { dependencies: [paragraphs, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-20 grid grid-cols-12 gap-x-4 gap-y-8 md:mt-28 md:gap-x-6"
    >
      <p
        data-approach-label
        className="label-mono col-span-12 text-ink-muted md:col-span-3"
      >
        Approach
      </p>
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          data-approach-para
          className={`col-span-12 text-[0.9375rem] leading-relaxed text-ink/85 md:col-span-4 ${
            i === 0 ? "" : "md:col-start-8"
          }`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

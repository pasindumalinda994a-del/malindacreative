"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useLenis } from "lenis/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type ProjectIntroProps = {
  intro: string;
  /** Rebuild the reveal when the open project changes. */
  slug: string;
};

/**
 * Introduction copy with ScrollTrigger SplitText letter fade/rise.
 * Must live inside ProjectDetail's nested SmoothScroll so useLenis + scroller match.
 */
export function ProjectIntro({ intro, slug }: ProjectIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      const copy = copyRef.current;
      if (!root || !copy || !lenis) return;

      const scroller = lenis.rootElement;
      const label = root.querySelector<HTMLElement>("[data-intro-label]");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(label, { clearProps: "all" });
        return;
      }

      const split = SplitText.create(copy, {
        type: "chars,words",
        charsClass: "intro-char",
      });

      gsap.set(label, { opacity: 0, y: 14 });
      gsap.set(split.chars, { opacity: 0, y: 8 });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          scroller,
          start: "top 80%",
          once: true,
          toggleActions: "play none none none",
        },
      });

      if (label) {
        tl.to(
          label,
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          0,
        );
      }

      tl.to(
        split.chars,
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: { each: 0.012 },
        },
        0.12,
      );

      const refreshId = requestAnimationFrame(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(refreshId);
        lenis.off("scroll", onScroll);
        tl.scrollTrigger?.kill();
        tl.kill();
        split.revert();
      };
    },
    { dependencies: [slug, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-24 grid grid-cols-12 gap-x-4 md:mt-32 md:gap-x-6"
    >
      <p
        data-intro-label
        className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0"
      >
        Introduction
      </p>
      <p
        ref={copyRef}
        className="col-span-12 font-display text-[clamp(1.625rem,3vw,2.75rem)] leading-[1.15] italic text-ink md:col-span-8"
      >
        {intro}
      </p>
    </div>
  );
}

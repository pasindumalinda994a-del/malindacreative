"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ProjectCreditsProps = {
  credits: [string, string][];
  /** Rebuild the reveal when the open project changes. */
  slug: string;
};

/**
 * Project credits table with ScrollTrigger line-draw + text fade/rise.
 * Must live inside ProjectDetail's nested SmoothScroll so useLenis + scroller match.
 */
export function ProjectCredits({ credits, slug }: ProjectCreditsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const scroller = lenis.rootElement;
      const heading = root.querySelector<HTMLElement>("[data-credits-heading]");
      const rows = gsap.utils.toArray<HTMLElement>("[data-credits-row]", root);
      const bottomRule = root.querySelector<HTMLElement>("[data-credits-rule-bottom]");
      const allRules = root.querySelectorAll<HTMLElement>("[data-credits-rule]");
      const allText = root.querySelectorAll<HTMLElement>("[data-credits-text]");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(allRules, { scaleX: 1 });
        gsap.set([heading, ...allText].filter(Boolean), { opacity: 1, y: 0 });
        return;
      }

      gsap.set(allRules, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(heading, { opacity: 0, y: 14 });
      gsap.set(allText, { opacity: 0, y: 14 });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          scroller,
          start: "top 82%",
          once: true,
          toggleActions: "play none none none",
        },
      });

      if (heading) {
        tl.to(
          heading,
          { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" },
          0,
        );
      }

      rows.forEach((row, i) => {
        const rule = row.querySelector<HTMLElement>("[data-credits-rule]");
        const texts = row.querySelectorAll<HTMLElement>("[data-credits-text]");
        const at = 0.08 + i * 0.07;

        if (rule) {
          tl.to(
            rule,
            { scaleX: 1, duration: 0.95, ease: "power2.out" },
            at,
          );
        }
        if (texts.length) {
          tl.to(
            texts,
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: "power2.out",
              stagger: 0.025,
            },
            at + 0.08,
          );
        }
      });

      if (bottomRule) {
        tl.to(
          bottomRule,
          { scaleX: 1, duration: 0.95, ease: "power2.out" },
          0.08 + rows.length * 0.07,
        );
      }

      // Nested Lenis + overlay open: refresh after layout settles.
      const refreshId = requestAnimationFrame(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(refreshId);
        lenis.off("scroll", onScroll);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { dependencies: [slug, lenis], scope: rootRef },
  );

  return (
    <div ref={rootRef} className="grid grid-cols-12 gap-x-4 md:gap-x-6">
      <p
        data-credits-heading
        className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0"
      >
        Project credits
      </p>
      <dl className="col-span-12 md:col-span-9">
        {credits.map(([label, value]) => (
          <div
            key={label}
            data-credits-row
            className="relative grid grid-cols-12 items-baseline gap-x-4 py-3.5"
          >
            <span
              data-credits-rule
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-rule will-change-transform"
            />
            <dt
              data-credits-text
              className="label-mono col-span-4 text-ink-muted md:col-span-3"
            >
              {label}
            </dt>
            <dd
              data-credits-text
              className="col-span-8 text-right text-sm md:col-span-9 md:text-base"
            >
              {value}
            </dd>
          </div>
        ))}
        <span
          data-credits-rule
          data-credits-rule-bottom
          aria-hidden
          className="block h-px w-full origin-left scale-x-0 bg-rule will-change-transform"
        />
      </dl>
    </div>
  );
}

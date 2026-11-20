"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type AboutFactsProps = {
  facts: [string, string][];
};

/**
 * Studio facts table with line-draw + text fade/rise on scroll.
 */
export function AboutFacts({ facts }: AboutFactsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const heading = root.querySelector<HTMLElement>("[data-facts-heading]");
      const rows = gsap.utils.toArray<HTMLElement>("[data-facts-row]", root);
      const bottomRule = root.querySelector<HTMLElement>("[data-facts-rule-bottom]");
      const allRules = root.querySelectorAll<HTMLElement>("[data-facts-rule]");
      const allText = root.querySelectorAll<HTMLElement>("[data-facts-text]");

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
          start: "top 82%",
          once: true,
          toggleActions: "play none none none",
        },
      });

      if (heading) {
        tl.to(heading, { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, 0);
      }

      rows.forEach((row, i) => {
        const rule = row.querySelector<HTMLElement>("[data-facts-rule]");
        const texts = row.querySelectorAll<HTMLElement>("[data-facts-text]");
        const at = 0.08 + i * 0.07;

        if (rule) {
          tl.to(rule, { scaleX: 1, duration: 0.95, ease: "power2.out" }, at);
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
    { dependencies: [facts, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-20 grid grid-cols-12 gap-x-4 md:mt-28 md:gap-x-6"
    >
      <p
        data-facts-heading
        className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0"
      >
        Studio
      </p>
      <dl className="col-span-12 md:col-span-9">
        {facts.map(([label, value]) => (
          <div
            key={label}
            data-facts-row
            className="relative grid grid-cols-12 items-baseline gap-x-4 py-3.5"
          >
            <span
              data-facts-rule
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-rule will-change-transform"
            />
            <dt
              data-facts-text
              className="label-mono col-span-4 text-ink-muted md:col-span-3"
            >
              {label}
            </dt>
            <dd
              data-facts-text
              className="col-span-8 text-right text-sm md:col-span-9 md:text-base"
            >
              {value}
            </dd>
          </div>
        ))}
        <span
          data-facts-rule
          data-facts-rule-bottom
          aria-hidden
          className="block h-px w-full origin-left scale-x-0 bg-rule will-change-transform"
        />
      </dl>
    </div>
  );
}

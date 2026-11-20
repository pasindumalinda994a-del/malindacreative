"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import type { AboutService } from "@/config/about";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type AboutServicesProps = {
  services: AboutService[];
};

/**
 * Hairline services list — no cards; ruled rows with scaleX draw.
 */
export function AboutServices({ services }: AboutServicesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !lenis) return;

      const heading = root.querySelector<HTMLElement>("[data-services-heading]");
      const rows = gsap.utils.toArray<HTMLElement>("[data-services-row]", root);
      const bottomRule = root.querySelector<HTMLElement>("[data-services-rule-bottom]");
      const allRules = root.querySelectorAll<HTMLElement>("[data-services-rule]");
      const allText = root.querySelectorAll<HTMLElement>("[data-services-text]");

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
        tl.to(heading, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, 0);
      }

      rows.forEach((row, i) => {
        const rule = row.querySelector<HTMLElement>("[data-services-rule]");
        const texts = row.querySelectorAll<HTMLElement>("[data-services-text]");
        const at = 0.1 + i * 0.08;

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
              stagger: 0.03,
            },
            at + 0.08,
          );
        }
      });

      if (bottomRule) {
        tl.to(
          bottomRule,
          { scaleX: 1, duration: 0.95, ease: "power2.out" },
          0.1 + rows.length * 0.08,
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
    { dependencies: [services, lenis], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mt-20 grid grid-cols-12 gap-x-4 md:mt-28 md:gap-x-6"
    >
      <p
        data-services-heading
        className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0"
      >
        Services
      </p>
      <ul className="col-span-12 md:col-span-9">
        {services.map((service) => (
          <li
            key={service.name}
            data-services-row
            className="relative grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-5"
          >
            <span
              data-services-rule
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-rule will-change-transform"
            />
            <span
              data-services-text
              className="label-mono col-span-12 text-ink md:col-span-3"
            >
              {service.name}
            </span>
            <span
              data-services-text
              className="col-span-12 text-[0.9375rem] leading-relaxed text-ink/85 md:col-span-9"
            >
              {service.description}
            </span>
          </li>
        ))}
        <span
          data-services-rule
          data-services-rule-bottom
          aria-hidden
          className="block h-px w-full origin-left scale-x-0 bg-rule will-change-transform"
        />
      </ul>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useLenis } from "lenis/react";
import type { Slide } from "@/config/slides";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type ProjectTestimonialProps = {
  testimonial: Slide["testimonial"];
  /** Rebuild the reveal when the open project changes. */
  slug: string;
};

/**
 * Client words block with SplitText quote fade + coordinated label/rule/attribution.
 * Must live inside ProjectDetail's nested SmoothScroll so useLenis + scroller match.
 */
export function ProjectTestimonial({ testimonial, slug }: ProjectTestimonialProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = rootRef.current;
      const quote = quoteRef.current;
      if (!root || !quote || !lenis) return;

      const scroller = lenis.rootElement;
      const label = root.querySelector<HTMLElement>("[data-testimonial-label]");
      const rule = root.querySelector<HTMLElement>("[data-testimonial-rule]");
      const attribution = root.querySelector<HTMLElement>("[data-testimonial-attribution]");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set([label, rule, attribution].filter(Boolean), { clearProps: "all" });
        return;
      }

      const split = SplitText.create(quote, {
        type: "chars,words",
        charsClass: "testimonial-char",
      });

      gsap.set(label, { opacity: 0, y: 14 });
      gsap.set(rule, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(split.chars, { opacity: 0, y: 8 });
      gsap.set(attribution, { opacity: 0, y: 16 });

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

      if (rule) {
        tl.to(
          rule,
          { scaleY: 1, duration: 0.8, ease: "power2.out" },
          0.08,
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

      if (attribution) {
        tl.to(
          attribution,
          { opacity: 1, y: 0, duration: 0.75, ease: "power2.out" },
          0.45,
        );
      }

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
      className="mt-24 border-t border-rule pt-16 md:mt-32 md:pt-24"
    >
      <div className="grid grid-cols-12 gap-x-4 md:gap-x-6">
        <p
          data-testimonial-label
          className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0"
        >
          Client words
        </p>
        <blockquote className="col-span-12 md:col-span-8">
          <div className="flex gap-5 md:gap-6">
            <span
              data-testimonial-rule
              aria-hidden
              className="mt-1.5 hidden w-px shrink-0 origin-top bg-accent will-change-transform md:block md:self-stretch"
            />
            <div className="min-w-0">
              <p
                ref={quoteRef}
                className="font-display text-[clamp(1.375rem,2.4vw,2.125rem)] leading-[1.25] italic text-ink"
              >
                {testimonial.quote}
              </p>
              <footer
                data-testimonial-attribution
                className="mt-8 flex items-center gap-4 sm:mt-10"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-paper-2 sm:size-14">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testimonial.portrait}
                    alt={testimonial.author}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <cite className="not-italic text-sm leading-none text-ink">
                    {testimonial.author}
                  </cite>
                  <span className="label-mono text-ink-muted">{testimonial.role}</span>
                </div>
              </footer>
            </div>
          </div>
        </blockquote>
      </div>
    </div>
  );
}

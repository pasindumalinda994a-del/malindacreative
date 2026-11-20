"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { aboutContent } from "@/config/about";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SiteHeader } from "@/components/SiteHeader";
import { AboutApproach } from "@/components/about/AboutApproach";
import { AboutClose } from "@/components/about/AboutClose";
import { AboutFacts } from "@/components/about/AboutFacts";
import { AboutGallery } from "@/components/about/AboutGallery";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutIntro } from "@/components/about/AboutIntro";
import { AboutServices } from "@/components/about/AboutServices";

/**
 * Tracks scroll past the hero so the fixed header can gain a paper backdrop.
 */
function AboutHeaderSync({
  onHeroCovered,
}: {
  onHeroCovered: (covered: boolean) => void;
}) {
  const covered = useRef(false);
  const frame = useRef(0);

  useLenis(
    (instance) => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const viewport = typeof window !== "undefined" ? window.innerHeight : 1;
        const progress = Math.min(1, Math.max(0, instance.scroll / (viewport * 0.9)));
        const nowCovered = covered.current ? progress > 0.78 : progress > 0.9;
        if (nowCovered !== covered.current) {
          covered.current = nowCovered;
          onHeroCovered(nowCovered);
        }
      });
    },
    [onHeroCovered],
  );

  useEffect(() => {
    return () => cancelAnimationFrame(frame.current);
  }, []);

  return null;
}

/**
 * About route shell: document Lenis scroll, brand hero, paper editorial sections.
 */
export function AboutPage() {
  const [heroCovered, setHeroCovered] = useState(false);
  const content = aboutContent;

  return (
    <SmoothScroll root data-page="about">
      <AboutHeaderSync onHeroCovered={setHeroCovered} />
      <SiteHeader tone="ink" backdrop={heroCovered} revealed />
      <main aria-labelledby="about-title">
        <AboutHero brand={content.brand} />
        <div className="relative z-10 bg-paper px-6 pb-24 pt-16 text-ink md:px-10 md:pb-32 md:pt-24">
          <AboutIntro intro={content.intro} />
          <AboutFacts facts={content.facts} />
          <AboutApproach paragraphs={content.approach} />
          <AboutServices services={content.services} />
          <AboutGallery gallery={content.gallery} />
          <AboutClose closeLine={content.closeLine} />
        </div>
      </main>
    </SmoothScroll>
  );
}

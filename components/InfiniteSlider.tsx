"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animationConfig, type AnimationConfig } from "@/config/animationConfig";
import { getNextSlide, getSlideIndexBySlug, type Slide } from "@/config/slides";
import { topographicConfig } from "@/config/topographicConfig";
import { useInfiniteSlider } from "@/hooks/useInfiniteSlider";
import { HeroInfo } from "./HeroInfo";
import { PointerLabel } from "./PointerLabel";
import { ProjectDetail } from "./ProjectDetail";
import { SiteHeader } from "./SiteHeader";
import { TopographicFlow } from "./TopographicFlow";

type InfiniteSliderProps = {
  slides: Slide[];
  /** Project to open on load (from `?project=slug`), or -1. */
  initialOpenIndex?: number;
  /** All animation settings. Defaults to the config chosen in config/animationConfig.ts. */
  config?: AnimationConfig;
};

const PROJECT_PARAM = "project";

function readProjectSlug() {
  return new URLSearchParams(window.location.search).get(PROJECT_PARAM);
}

/**
 * The homepage: header, the Three.js featured-project strip, its editorial
 * information, and the in-page project detail that grows out of the opened slide.
 */
export function InfiniteSlider({
  slides,
  initialOpenIndex = -1,
  config = animationConfig,
}: InfiniteSliderProps) {
  const { canvasRef, activeIndex, view, hoverIndex, introSettled, isOpen, open, close, setDetailScroll } =
    useInfiniteSlider(slides, config, { initialOpenIndex });

  const activeSlide = slides[activeIndex] ?? slides[0];
  const [heroCovered, setHeroCovered] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${config.narrowBreakpointPx - 1}px)`);
    const sync = () => setNarrowViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [config.narrowBreakpointPx]);

  const topo = narrowViewport
    ? {
        speed: topographicConfig.narrow.speed,
        density: topographicConfig.narrow.density,
        opacity: topographicConfig.narrow.opacity,
      }
    : {
        speed: topographicConfig.speed,
        density: topographicConfig.density,
        opacity: topographicConfig.opacity,
      };

  // --- URL sync: ?project=slug ----------------------------------------------
  const previousView = useRef(view);
  useEffect(() => {
    const was = previousView.current;
    previousView.current = view;
    if (was === view) return;

    if (view === "detail") {
      const slug = slides[activeIndex]?.slug;
      if (!slug || readProjectSlug() === slug) return;
      const url = `?${PROJECT_PARAM}=${encodeURIComponent(slug)}`;
      // Opening from the strip adds a history entry; moving between projects replaces it,
      // so the browser's Back always returns to the strip.
      if (readProjectSlug()) {
        window.history.replaceState({ [PROJECT_PARAM]: slug }, "", url);
      } else {
        window.history.pushState({ [PROJECT_PARAM]: slug }, "", url);
      }
    } else if (view === "browse" && readProjectSlug()) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [view, activeIndex, slides]);

  useEffect(() => {
    const onPopState = () => {
      const slug = readProjectSlug();
      if (!slug) {
        close();
        return;
      }
      const index = getSlideIndexBySlug(slug);
      if (index >= 0) open(index);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, close]);

  // --- Detail layer callbacks -----------------------------------------------
  const handleNext = useCallback(() => {
    open((activeIndex + 1) % slides.length);
  }, [open, activeIndex, slides.length]);

  const handleHeroCovered = useCallback((covered: boolean) => setHeroCovered(covered), []);

  const showDetail = view === "detail" || view === "closing";
  const headerTone = view === "browse" || heroCovered ? "ink" : "paper";
  const hovering = introSettled && view === "browse" && hoverIndex >= 0;

  return (
    <section aria-label="Featured projects" className="relative h-svh w-full overflow-hidden">
      <TopographicFlow
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        preset={topographicConfig.preset}
        speed={topo.speed}
        density={topo.density}
        opacity={topo.opacity}
        hover={topographicConfig.hover}
        paused={topographicConfig.paused || isOpen}
        animateEntrance
      />

      <canvas
        ref={canvasRef}
        aria-label="Project strip. Swipe or drag to browse, tap or press Enter to open."
        className={`fixed inset-0 z-[1] h-full w-full touch-none ${
          !introSettled || view !== "browse" ? "cursor-default" : hovering ? "cursor-none" : "cursor-grab"
        }`}
      />

      <SiteHeader
        tone={headerTone}
        minimal={view !== "browse"}
        backdrop={view === "detail" && heroCovered}
        revealed={introSettled}
      />

      {introSettled ? (
        <HeroInfo
          slide={activeSlide}
          index={activeIndex}
          total={slides.length}
          hidden={view !== "browse"}
          introSettled
          introCount={100}
          textDuration={config.textDuration}
          textDistance={config.textDistance}
          textEase={config.textEase}
        />
      ) : null}

      <PointerLabel active={hovering} />

      {showDetail ? (
        <ProjectDetail
          key={activeSlide.slug}
          slide={activeSlide}
          nextSlide={getNextSlide(activeIndex)}
          index={activeIndex}
          total={slides.length}
          closing={view === "closing"}
          onClose={close}
          onNext={handleNext}
          onScrollProgress={setDetailScroll}
          onHeroCovered={handleHeroCovered}
        />
      ) : null}
    </section>
  );
}

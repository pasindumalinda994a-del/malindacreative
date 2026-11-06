import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationConfig } from "@/config/animationConfig";
import type { Slide } from "@/config/slides";
import {
  createSliderController,
  type SliderController,
  type SliderView,
} from "@/lib/slider/controller";

type UseInfiniteSliderOptions = {
  /** Slide to start on, already opened, with no intro (deep link). */
  initialOpenIndex?: number;
};

/**
 * Thin React binding over the slider controller (lib/slider/controller.ts).
 * Mirrors the controller's events into state and exposes its actions as stable callbacks.
 */
export function useInfiniteSlider(
  slides: Slide[],
  config: AnimationConfig,
  options: UseInfiniteSliderOptions = {},
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<SliderController | null>(null);

  // Only the first value matters: the controller is created once per slides/config.
  const [initialOpenIndex] = useState(options.initialOpenIndex ?? -1);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialOpenIndex));
  const [view, setView] = useState<SliderView>(initialOpenIndex >= 0 ? "detail" : "browse");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [introSettled, setIntroSettled] = useState(initialOpenIndex >= 0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Honour the deep link only while the URL still names that project. This survives
    // StrictMode's double mount (URL unchanged) but not a dev re-run after the user closed.
    const urlSlug = new URLSearchParams(window.location.search).get("project");
    const deepLinkIndex =
      initialOpenIndex >= 0 && slides[initialOpenIndex]?.slug === urlSlug ? initialOpenIndex : -1;

    // Reset on each mount so a StrictMode remount replays the reveal cleanly.
    setIntroSettled(deepLinkIndex >= 0);

    const controller = createSliderController(
      canvasRef.current,
      slides,
      config,
      {
        onActiveIndex: setActiveIndex,
        onView: setView,
        onHover: setHoverIndex,
        onIntroSettled: () => setIntroSettled(true),
      },
      { initialOpenIndex: deepLinkIndex },
    );
    controllerRef.current = controller;
    setActiveIndex(Math.max(0, controller.getActiveIndex()));
    setView(controller.getView());

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [slides, config, initialOpenIndex]);

  const open = useCallback((index: number) => controllerRef.current?.open(index), []);
  const close = useCallback(() => controllerRef.current?.close(), []);
  const goTo = useCallback((index: number) => controllerRef.current?.goTo(index), []);
  const step = useCallback((direction: -1 | 1) => controllerRef.current?.step(direction), []);
  const setDetailScroll = useCallback(
    (progress: number) => controllerRef.current?.setDetailScroll(progress),
    [],
  );

  return {
    canvasRef,
    activeIndex,
    view,
    hoverIndex,
    introSettled,
    isOpen: view === "detail",
    isBrowsing: view === "browse",
    open,
    close,
    goTo,
    step,
    setDetailScroll,
  };
}

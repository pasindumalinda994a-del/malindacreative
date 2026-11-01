"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Slide } from "@/config/slides";

type ProjectDetailProps = {
  slide: Slide;
  nextSlide: Slide;
  /** 0-based index of the project. */
  index: number;
  total: number;
  /** True while the hero is collapsing: the layer fades and stops taking input. */
  closing: boolean;
  onClose: () => void;
  onNext: () => void;
  /** Scroll progress (0-1) of the first viewport, used to move the WebGL hero. */
  onScrollProgress: (progress: number) => void;
  /** Fires when the paper section covers (true) or uncovers (false) the hero. */
  onHeroCovered: (covered: boolean) => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Staggered rise for a group of children; set `--i` per child. */
const stagger = (i: number) =>
  ({ "--i": i, "--stagger-base": "180ms" }) as CSSProperties;

/**
 * The project page, layered over the opened WebGL hero.
 * The first viewport is transparent so the image stays the main element;
 * the content below sits on a paper surface and scrolls over it.
 */
export function ProjectDetail({
  slide,
  nextSlide,
  index,
  total,
  closing,
  onClose,
  onNext,
  onScrollProgress,
  onHeroCovered,
}: ProjectDetailProps) {
  const layer = useRef<HTMLDivElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const covered = useRef(false);
  const frame = useRef(0);
  // Start invisible so the first paint can transition into the open state.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Move focus into the page on open, and back to the document on unmount.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    backButton.current?.focus({ preventScroll: true });
    return () => {
      if (previous && previous.isConnected && previous !== document.body) {
        previous.focus({ preventScroll: true });
      } else {
        (document.activeElement as HTMLElement | null)?.blur();
      }
    };
  }, []);

  // Reset scroll and hero state when the project changes.
  useEffect(() => {
    const node = layer.current;
    if (node) node.scrollTop = 0;
    covered.current = false;
    onHeroCovered(false);
    onScrollProgress(0);
  }, [slide.slug, onHeroCovered, onScrollProgress]);

  // Report scroll at most once per frame; refs only, no React state.
  useEffect(() => {
    const node = layer.current;
    if (!node) return;

    const report = () => {
      frame.current = 0;
      const viewport = Math.max(1, node.clientHeight);
      const progress = Math.min(1, Math.max(0, node.scrollTop / (viewport * 0.9)));
      onScrollProgress(progress);
      // Lets the scrims fade with the hero without re-rendering.
      node.style.setProperty("--detail-p", progress.toFixed(3));

      // Hysteresis so the header tone does not flicker around the threshold.
      const nowCovered = covered.current ? progress > 0.78 : progress > 0.9;
      if (nowCovered !== covered.current) {
        covered.current = nowCovered;
        onHeroCovered(nowCovered);
      }
    };

    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(report);
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [onScrollProgress, onHeroCovered]);

  const credits: [string, string][] = [
    ["Client", slide.client],
    ["Year", slide.year],
    ["Discipline", slide.category],
    ["Services", slide.services.join(", ")],
    ["Index", `${pad(index + 1)} of ${pad(total)}`],
  ];

  const visible = entered && !closing;

  return (
    <div
      ref={layer}
      role="dialog"
      aria-labelledby="project-title"
      data-closing={closing}
      className={`scrollbar-none fixed inset-0 z-30 overflow-y-auto overscroll-contain transition-opacity duration-700 ease-out-expo ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* --- 1. Hero viewport: transparent over the WebGL image ----------------- */}
      <section className="relative h-svh w-full text-paper">
        {/* Soft scrims for legibility over any photo; outer fades in on open, inner fades on scroll. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-2 h-40 animate-scrim-in [animation-duration:1.25s] [animation-delay:80ms]"
        >
          <div
            style={{ opacity: "calc(1 - var(--detail-p, 0) * 1.6)" }}
            className="absolute inset-0 rounded-t-lg bg-gradient-to-b from-ink/45 to-transparent"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 bottom-2 h-[55%] animate-scrim-in [animation-duration:1.15s] [animation-delay:40ms]"
        >
          <div
            style={{ opacity: "calc(1 - var(--detail-p, 0) * 1.6)" }}
            className="absolute inset-0 rounded-b-lg bg-gradient-to-t from-ink/70 via-ink/25 to-transparent"
          />
        </div>

        {/* Back */}
        <div className="absolute left-6 top-[5.75rem] md:left-10 md:top-[6.5rem]">
          <button
            ref={backButton}
            type="button"
            onClick={onClose}
            className="group label-mono link-draw flex items-center gap-2 stagger-rise"
            style={stagger(0)}
          >
            <span
              aria-hidden
              className="inline-block transition-transform duration-500 ease-out-expo group-hover:-translate-x-1"
            >
              ←
            </span>
            Back to projects
          </button>
        </div>

        {/* Stats column — right */}
        <dl className="absolute right-6 top-[5.75rem] hidden flex-col items-end gap-5 text-right sm:flex md:right-10 md:top-[6.5rem]">
          {[
            ["Client", slide.client],
            ["Year", slide.year],
            ["Services", slide.services.join(" · ")],
          ].map(([label, value], i) => (
            <div key={label} className="stagger-rise" style={stagger(i + 1)}>
              <dt className="label-mono text-paper/60">{label}</dt>
              <dd className="mt-1.5 max-w-[22ch] text-sm leading-snug">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Title row — bottom */}
        <div className="absolute inset-x-6 bottom-6 md:inset-x-10 md:bottom-8">
          <div className="grid grid-cols-12 items-end gap-x-4 gap-y-4 md:gap-x-6">
            <div className="col-span-12 md:col-span-9">
              <p className="label-mono mb-3 text-paper/70 stagger-rise" style={stagger(2)}>
                {slide.category} <span className="mx-2 text-paper/40">—</span> {slide.year}
              </p>
              <h1
                id="project-title"
                className="display-serif overflow-hidden text-[clamp(3rem,10vw,11rem)] stagger-rise"
                style={stagger(3)}
              >
                {slide.name}
              </h1>
            </div>
            <div className="col-span-12 flex items-end justify-between md:col-span-3 md:flex-col md:items-end md:gap-4">
              <p
                className="label-mono tabular-nums text-paper/80 stagger-rise"
                style={stagger(4)}
              >
                {pad(index + 1)} <span className="mx-1 text-paper/40">—</span> {pad(total)}
              </p>
              <p
                className="label-mono flex items-center gap-2 text-paper/60 stagger-rise"
                style={stagger(5)}
              >
                Scroll
                <span aria-hidden className="inline-block h-6 w-px bg-paper/50" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. Paper surface: credits, copy, visuals, next --------------------- */}
      <section className="relative bg-paper text-ink">
        <div className="px-6 pb-24 pt-16 md:px-10 md:pb-32 md:pt-24">
          {/* Credits table */}
          <div className="grid grid-cols-12 gap-x-4 md:gap-x-6">
            <p className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0">
              Project credits
            </p>
            <dl className="col-span-12 md:col-span-9">
              {credits.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-12 items-baseline gap-x-4 border-t border-rule py-3.5 last:border-b"
                >
                  <dt className="label-mono col-span-4 text-ink-muted md:col-span-3">{label}</dt>
                  <dd className="col-span-8 text-right text-sm md:col-span-9 md:text-base">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Intro */}
          <div className="mt-24 grid grid-cols-12 gap-x-4 md:mt-32 md:gap-x-6">
            <p className="label-mono col-span-12 mb-6 text-ink-muted md:col-span-3 md:mb-0">
              Introduction
            </p>
            <p className="col-span-12 font-display text-[clamp(1.625rem,3vw,2.75rem)] leading-[1.15] italic text-ink md:col-span-8">
              {slide.intro}
            </p>
          </div>

          {/* Body */}
          <div className="mt-20 grid grid-cols-12 gap-x-4 gap-y-8 md:mt-28 md:gap-x-6">
            <p className="label-mono col-span-12 text-ink-muted md:col-span-3">About the work</p>
            {slide.body.map((paragraph, i) => (
              <p
                key={i}
                className={`col-span-12 text-[0.9375rem] leading-relaxed text-ink/85 md:col-span-4 ${
                  i === 0 ? "" : "md:col-start-8"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Gallery */}
          <div className="mt-24 grid grid-cols-12 gap-x-4 gap-y-10 md:mt-32 md:gap-x-6">
            {slide.gallery.map((image, i) => (
              <figure
                key={image + i}
                className={`col-span-12 ${i % 2 === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-24"}`}
              >
                <div
                  className={`overflow-hidden rounded-sm bg-paper-2 ${
                    i % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"
                  }`}
                >
                  {/* Plain <img>: the WebGL strip already loaded these exact files, so next/image would only re-encode them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="label-mono mt-3 flex justify-between text-ink-muted">
                  <span>
                    Fig. {pad(i + 1)} <span className="mx-2 text-rule-strong">—</span> Placeholder
                    visual
                  </span>
                  <span>{slide.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Next project */}
        <footer className="border-t border-rule px-6 py-10 md:px-10 md:py-14">
          <div className="grid grid-cols-12 items-end gap-x-4 gap-y-6 md:gap-x-6">
            <div className="col-span-12 md:col-span-3">
              <p className="label-mono text-ink-muted">Next project</p>
              <p className="label-mono mt-2 tabular-nums text-ink-muted">
                {pad(((index + 1) % total) + 1)} <span className="mx-1 text-rule-strong">—</span>{" "}
                {pad(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={onNext}
              className="group col-span-12 flex items-end justify-between gap-6 text-left md:col-span-9"
            >
              <span className="display-serif text-[clamp(2.5rem,7vw,7.5rem)] text-ink transition-colors duration-500 group-hover:text-accent">
                {nextSlide.name}
              </span>
              <span
                aria-hidden
                className="display-serif mb-[0.1em] text-[clamp(1.75rem,4vw,4rem)] text-ink-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-2"
              >
                →
              </span>
            </button>
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-rule pt-5">
            <button
              type="button"
              onClick={onClose}
              className="label-mono link-draw text-ink-muted"
            >
              ← Back to all projects
            </button>
            <p className="label-mono text-ink-muted">
              {slide.category} <span className="mx-2 text-rule-strong">·</span> {slide.year}
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}

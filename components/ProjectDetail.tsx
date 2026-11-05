"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import type { Slide } from "@/config/slides";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ProjectBody } from "@/components/ProjectBody";
import { ProjectCredits } from "@/components/ProjectCredits";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ProjectIntro } from "@/components/ProjectIntro";
import { ProjectTestimonial } from "@/components/ProjectTestimonial";

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
 * Lives inside SmoothScroll so useLenis can reach the nested instance.
 * Resets on project change and reports hero scroll progress from Lenis.
 */
function DetailScrollSync({
  slug,
  onScrollProgress,
  onHeroCovered,
}: {
  slug: string;
  onScrollProgress: (progress: number) => void;
  onHeroCovered: (covered: boolean) => void;
}) {
  const covered = useRef(false);
  const frame = useRef(0);
  const lenis = useLenis();

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    covered.current = false;
    onHeroCovered(false);
    onScrollProgress(0);
    const root = lenis?.rootElement;
    if (root) root.style.setProperty("--detail-p", "0");
  }, [slug, lenis, onHeroCovered, onScrollProgress]);

  useLenis(
    (instance) => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const root = instance.rootElement;
        const viewport = Math.max(1, root.clientHeight);
        const progress = Math.min(1, Math.max(0, instance.scroll / (viewport * 0.9)));
        onScrollProgress(progress);
        root.style.setProperty("--detail-p", progress.toFixed(3));

        const nowCovered = covered.current ? progress > 0.78 : progress > 0.9;
        if (nowCovered !== covered.current) {
          covered.current = nowCovered;
          onHeroCovered(nowCovered);
        }
      });
    },
    [onScrollProgress, onHeroCovered],
  );

  useEffect(() => {
    return () => cancelAnimationFrame(frame.current);
  }, []);

  return null;
}

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
  const backButton = useRef<HTMLButtonElement>(null);
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

  const credits: [string, string][] = [
    ["Client", slide.client],
    ["Year", slide.year],
    ["Discipline", slide.category],
    ["Services", slide.services.join(", ")],
    ["Index", `${pad(index + 1)} of ${pad(total)}`],
  ];

  const visible = entered && !closing;

  return (
    <SmoothScroll
      role="dialog"
      aria-labelledby="project-title"
      data-closing={closing}
      className={`scrollbar-none fixed inset-0 z-30 overflow-y-auto overscroll-contain transition-opacity duration-700 ease-out-expo ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <DetailScrollSync
        slug={slide.slug}
        onScrollProgress={onScrollProgress}
        onHeroCovered={onHeroCovered}
      />
      {/* --- 1. Hero viewport: transparent over the WebGL image ----------------- */}
      <section className="relative h-svh w-full text-paper">
        {/* Full-bleed frame over the WebGL hero (no margin / radius). */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Soft scrims for legibility; outer fades in on open, inner fades on scroll. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 animate-scrim-in [animation-duration:1.25s] [animation-delay:80ms]"
          >
            <div
              style={{ opacity: "calc(1 - var(--detail-p, 0) * 1.6)" }}
              className="absolute inset-0 bg-gradient-to-b from-ink/45 to-transparent"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] animate-scrim-in [animation-duration:1.15s] [animation-delay:40ms]"
          >
            <div
              style={{ opacity: "calc(1 - var(--detail-p, 0) * 1.6)" }}
              className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent"
            />
          </div>

          {/* Title row — bottom of the image frame */}
          <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
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
        </div>

        {/* Back / stats stay viewport-relative so they clear the fixed site header. */}
        <div className="absolute left-6 top-[5.75rem] md:left-10 md:top-[6.5rem]">
          <button
            ref={backButton}
            type="button"
            onClick={onClose}
            className="group label-mono link-draw flex items-center gap-2 stagger-rise outline-none"
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
      </section>

      {/* --- 2. Paper surface: credits, copy, visuals, next --------------------- */}
      <section className="relative bg-paper text-ink">
        <div className="px-6 pb-24 pt-16 md:px-10 md:pb-32 md:pt-24">
          {/* Credits table */}
          <ProjectCredits credits={credits} slug={slide.slug} />

          {/* Intro */}
          <ProjectIntro intro={slide.intro} slug={slide.slug} />

          {/* Body */}
          <ProjectBody body={slide.body} slug={slide.slug} />

          {/* Gallery */}
          <ProjectGallery
            gallery={slide.gallery}
            name={slide.name}
            slug={slide.slug}
          />

          {/* Client words */}
          <ProjectTestimonial testimonial={slide.testimonial} slug={slide.slug} />
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
              className="label-mono link-draw text-ink-muted outline-none"
            >
              ← Back to all projects
            </button>
            <p className="label-mono text-ink-muted">
              {slide.category} <span className="mx-2 text-rule-strong">·</span> {slide.year}
            </p>
          </div>
        </footer>
      </section>
    </SmoothScroll>
  );
}

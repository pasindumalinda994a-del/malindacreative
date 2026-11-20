"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Slide } from "@/config/slides";
import { cssEasings, type EaseName } from "@/lib/slider/easing";

type HeroInfoProps = {
  slide: Slide;
  /** 0-based index of the active slide. */
  index: number;
  total: number;
  /** Fades the whole layer out while a project is opening / open. */
  hidden: boolean;
  /** False while the landing strip is still revealing. */
  introSettled: boolean;
  /** Text reveal length in seconds (slide changes). */
  textDuration: number;
  /** How far the text rises while fading in, in rem (slide changes). */
  textDistance: number;
  textEase: EaseName;
  /** Delay before staggered landing copy, in seconds. */
  revealStaggerBase?: number;
  /** Extra delay per staggered item, in seconds. */
  revealStaggerStep?: number;
  /** Title mask-up length on first reveal, in seconds. */
  titleRevealDuration?: number;
  /** Title mask easing on first reveal. */
  titleRevealEase?: EaseName;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Staggered rise for a group of children; set `--i` per child. */
const stagger = (i: number, baseMs: number) =>
  ({ "--i": i, "--stagger-base": `${baseMs}ms` }) as CSSProperties;

/**
 * Editorial information around the strip: section label (top right),
 * description + guidance (bottom left), meta + large title + progress (bottom right).
 */
export function HeroInfo({
  slide,
  index,
  total,
  hidden,
  introSettled,
  textDuration,
  textDistance,
  textEase,
  revealStaggerBase = 0.18,
  revealStaggerStep = 0.07,
  titleRevealDuration = 1.15,
  titleRevealEase = "hop",
}: HeroInfoProps) {
  // Deep link / skipped intro: chrome is already in place.
  const deepLink = useRef(introSettled).current;
  const [revealed, setRevealed] = useState(introSettled);
  // After the landing ladder finishes (or the user scrolls), keyed copy skips hero reveal.
  const slideFadeReady = useRef(deepLink);
  const landingIndex = useRef(index);

  useEffect(() => {
    if (introSettled) setRevealed(true);
  }, [introSettled]);

  const staggerBaseMs = Math.round(revealStaggerBase * 1000);
  const staggerStepMs = Math.round(revealStaggerStep * 1000);
  const playLanding = revealed && !deepLink;

  useEffect(() => {
    if (!playLanding) return;
    const ladderMs = staggerBaseMs + 6 * staggerStepMs + Math.round(titleRevealDuration * 1000);
    const id = window.setTimeout(() => {
      slideFadeReady.current = true;
    }, ladderMs);
    return () => window.clearTimeout(id);
  }, [playLanding, staggerBaseMs, staggerStepMs, titleRevealDuration]);

  // Scrolling to another project ends the hero reveal — no remount mask-up.
  if (index !== landingIndex.current) {
    slideFadeReady.current = true;
  }

  const textAnimationStyle = {
    "--text-duration": `${textDuration}s`,
    "--text-distance": `${playLanding ? 0.35 : textDistance}rem`,
    "--text-ease": cssEasings[playLanding ? "easeOutExpo" : textEase],
  } as CSSProperties;

  const titleLandingStyle = {
    "--text-duration": `${titleRevealDuration}s`,
    "--text-ease": cssEasings[titleRevealEase],
    ...stagger(3, staggerBaseMs),
  } as CSSProperties;

  /** Static chrome: stagger once on landing, stay put; deep link shows immediately. */
  const staticClass = (i: number) => {
    if (!revealed) return "opacity-0";
    if (deepLink) return "";
    return "stagger-rise";
  };

  const staticStyle = (i: number) => (playLanding ? stagger(i, staggerBaseMs) : undefined);

  /** Keyed copy: landing stagger/mask on first beat; fade-up on later slide remounts. */
  const keyedClass = (landingClass: string) => {
    if (!revealed) return "opacity-0";
    if (deepLink || slideFadeReady.current) return "motion-safe:animate-fade-up";
    return landingClass;
  };

  return (
    <div
      style={textAnimationStyle}
      aria-live="polite"
      aria-hidden={hidden}
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Soft paper washes for header + bottom project info over bright imagery. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-paper/95 via-paper/55 to-transparent md:h-44 ${
          revealed ? "animate-scrim-in [animation-duration:1.25s] [animation-delay:80ms]" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-paper via-paper/28 to-transparent md:h-[36%] ${
          revealed ? "animate-scrim-in [animation-duration:1.15s] [animation-delay:40ms]" : "opacity-0"
        }`}
      />

      {/* Section label — top right, where the strip is farthest away. */}
      <div
        className={`absolute right-6 top-[5.5rem] flex flex-col items-end gap-1 text-right md:right-10 md:top-[6.5rem] md:gap-2 ${staticClass(1)}`}
        style={staticStyle(1)}
      >
        <p className="label-mono">Featured Projects</p>
        <p className="label-mono flex items-center gap-2 text-ink-muted/70 md:text-ink-muted">
          <span
            aria-hidden
            className="inline-block size-1.5 shrink-0 rounded-full bg-accent motion-safe:animate-dot-fade"
          />
          {pad(total)} selected works
        </p>
      </div>

      {/* Bottom row — hidden until settle so the hairline does not flash during preload. */}
      <div
        className={`absolute inset-x-6 bottom-5 md:inset-x-10 md:bottom-8 ${
          revealed ? "" : "opacity-0"
        }`}
      >
        <div className="grid grid-cols-12 items-end gap-x-4 gap-y-4 border-t border-rule pt-3 md:gap-x-6 md:gap-y-6 md:pt-5">
          {/* Description + guidance */}
          <div className="order-2 col-span-12 flex flex-col gap-3 md:order-1 md:col-span-4 md:gap-4">
            <p
              key={`${slide.slug}-description`}
              className={`max-w-[30ch] text-sm leading-relaxed text-ink-muted [@media(max-height:620px)]:hidden ${keyedClass("stagger-rise")}`}
              style={
                revealed && !deepLink && !slideFadeReady.current
                  ? stagger(4, staggerBaseMs)
                  : undefined
              }
            >
              {slide.description}
            </p>
            <p
              className={`label-mono whitespace-nowrap text-ink-muted md:hidden ${staticClass(5)}`}
              style={staticStyle(5)}
            >
              Swipe to explore <span className="mx-2 text-rule-strong">—</span> Tap to open
            </p>
            <p
              className={`label-mono hidden whitespace-nowrap text-ink-muted md:block ${staticClass(5)}`}
              style={staticStyle(5)}
            >
              Drag to explore <span className="mx-2 text-rule-strong">—</span> Click to open
            </p>
          </div>

          {/* Meta + title + progress */}
          <div className="order-1 col-span-12 flex flex-col items-start gap-2 md:order-2 md:col-span-8 md:items-end md:gap-3 md:text-right">
            <p
              key={`${slide.slug}-meta`}
              className={`label-mono flex items-center gap-3 text-ink-muted ${keyedClass("stagger-rise")}`}
              style={
                revealed && !deepLink && !slideFadeReady.current
                  ? stagger(2, staggerBaseMs)
                  : undefined
              }
            >
              <span className="text-ink tabular-nums">
                {pad(index + 1)} <span className="text-rule-strong">/</span> {pad(total)}
              </span>
              <span className="text-rule-strong">—</span>
              <span>{slide.category}</span>
              <span className="text-rule-strong">·</span>
              <span className="tabular-nums">{slide.year}</span>
            </p>

            <h1 className="display-serif grid w-full items-end overflow-hidden text-[clamp(2.25rem,9vw,3.5rem)] text-ink md:text-[clamp(2.75rem,7.5vw,8rem)] [@media(max-height:620px)]:text-[clamp(2rem,5vw,4.5rem)]">
              <span
                key={slide.slug}
                style={
                  revealed && !deepLink && !slideFadeReady.current ? titleLandingStyle : undefined
                }
                className={`col-start-1 row-start-1 block pb-[0.08em] ${
                  !revealed
                    ? "translate-y-[110%]"
                    : deepLink || slideFadeReady.current
                      ? ""
                      : "motion-safe:animate-mask-up"
                }`}
              >
                {slide.name}
              </span>
            </h1>

            {/* Progress rail: one segment per project. */}
            <ol
              className={`mt-1 flex w-full max-w-[22rem] items-center gap-1 ${staticClass(6)}`}
              style={staticStyle(6)}
              aria-hidden
            >
              {Array.from({ length: total }, (_, segment) => (
                <li
                  key={segment}
                  className={`h-px flex-1 transition-colors duration-500 ${
                    segment === index ? "bg-accent" : "bg-rule-strong"
                  }`}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

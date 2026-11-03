import type { CSSProperties } from "react";
import type { Slide } from "@/config/slides";
import { cssEasings, type EaseName } from "@/lib/slider/easing";

type HeroInfoProps = {
  slide: Slide;
  /** 0-based index of the active slide. */
  index: number;
  total: number;
  /** Fades the whole layer out while a project is opening / open. */
  hidden: boolean;
  /** Text reveal length in seconds. */
  textDuration: number;
  /** How far the text rises while fading in, in rem. */
  textDistance: number;
  textEase: EaseName;
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Editorial information around the strip: section label (top right),
 * description + guidance (bottom left), meta + large title + progress (bottom right).
 */
export function HeroInfo({
  slide,
  index,
  total,
  hidden,
  textDuration,
  textDistance,
  textEase,
}: HeroInfoProps) {
  // CSS variables read by the `animate-mask-up` / `animate-fade-up` animations in app/globals.css.
  const textAnimationStyle = {
    "--text-duration": `${textDuration}s`,
    "--text-distance": `${textDistance}rem`,
    "--text-ease": cssEasings[textEase],
  } as CSSProperties;

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
        className="pointer-events-none absolute inset-x-0 top-0 h-28 animate-scrim-in bg-gradient-to-b from-paper/95 via-paper/55 to-transparent md:h-44 [animation-duration:1.25s] [animation-delay:80ms]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] animate-scrim-in bg-gradient-to-t from-paper via-paper/45 to-transparent md:h-[46%] [animation-duration:1.15s] [animation-delay:40ms]"
      />

      {/* Section label — top right, where the strip is farthest away. */}
      <div className="absolute right-6 top-[5.5rem] flex flex-col items-end gap-1 text-right md:right-10 md:top-[6.5rem] md:gap-2">
        <p className="label-mono">Featured Projects</p>
        <p className="label-mono flex items-center gap-2 text-ink-muted/70 md:text-ink-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {pad(total)} selected works
        </p>
      </div>

      {/* Bottom row */}
      <div className="absolute inset-x-6 bottom-5 md:inset-x-10 md:bottom-8">
        <div className="grid grid-cols-12 items-end gap-x-4 gap-y-4 border-t border-rule pt-3 md:gap-x-6 md:gap-y-6 md:pt-5">
          {/* Description + guidance */}
          <div className="order-2 col-span-12 flex flex-col gap-3 md:order-1 md:col-span-4 md:gap-4">
            <p
              key={`${slide.slug}-description`}
              className="max-w-[30ch] text-sm leading-relaxed text-ink-muted motion-safe:animate-fade-up [@media(max-height:620px)]:hidden"
            >
              {slide.description}
            </p>
            <p className="label-mono whitespace-nowrap text-ink-muted md:hidden">
              Swipe to explore <span className="mx-2 text-rule-strong">—</span> Tap to open
            </p>
            <p className="label-mono hidden whitespace-nowrap text-ink-muted md:block">
              Drag to explore <span className="mx-2 text-rule-strong">—</span> Click to open
            </p>
          </div>

          {/* Meta + title + progress */}
          <div className="order-1 col-span-12 flex flex-col items-start gap-2 md:order-2 md:col-span-8 md:items-end md:gap-3 md:text-right">
            <p
              key={`${slide.slug}-meta`}
              className="label-mono flex items-center gap-3 text-ink-muted motion-safe:animate-fade-up"
            >
              <span className="text-ink tabular-nums">
                {pad(index + 1)} <span className="text-rule-strong">/</span> {pad(total)}
              </span>
              <span className="text-rule-strong">—</span>
              <span>{slide.category}</span>
              <span className="text-rule-strong">·</span>
              <span className="tabular-nums">{slide.year}</span>
            </p>

            <h1 className="display-serif overflow-hidden text-[clamp(2.25rem,9vw,3.5rem)] text-ink md:text-[clamp(2.75rem,7.5vw,8rem)] [@media(max-height:620px)]:text-[clamp(2rem,5vw,4.5rem)]">
              <span key={slide.slug} className="block pb-[0.08em] motion-safe:animate-mask-up">
                {slide.name}
              </span>
            </h1>

            {/* Progress rail: one segment per project. */}
            <ol className="mt-1 flex w-full max-w-[22rem] items-center gap-1" aria-hidden>
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

"use client";

type LandingLoaderProps = {
  /** Integer 0–100 from the landing clock. */
  percent: number;
  /** True while the block is fading out after the strip settles. */
  leaving?: boolean;
};

const TENS = "0123456789";
const EXIT_MS = 600;

/**
 * Landing progress chrome: edge-to-edge top rule + bottom-center count.
 * Deep links and reduced motion never mount it.
 */
export function LandingLoader({ percent, leaving = false }: LandingLoaderProps) {
  const safe = Math.min(100, Math.max(0, Math.round(percent)));
  const hundreds = Math.floor(safe / 100);
  const tens = Math.floor((safe % 100) / 10);
  const ones = safe % 10;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-[600ms] ease-out-expo ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Top full-bleed progress rule */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-rule-strong">
        <div
          className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-[450ms] ease-out-expo motion-reduce:transition-none"
          style={{ width: `${safe}%` }}
        >
          <div className="flex h-full w-full min-w-[8rem]">
            <span className="h-full w-1.5 shrink-0 bg-accent" />
            <span className="h-full flex-1 bg-ink" />
          </div>
        </div>
      </div>

      {/* Bottom-center 16px mono odometer */}
      <div
        aria-hidden
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 font-mono text-[16px] leading-none tabular-nums text-ink md:bottom-4"
      >
        <DigitColumn digit={hundreds} glyphs="01" />
        <DigitColumn digit={tens} glyphs={TENS} />
        <DigitColumn digit={ones} glyphs={TENS} />
      </div>

      <p className="sr-only" aria-live="polite">
        Loading projects, {safe} percent
      </p>
    </div>
  );
}

/** Exit fade length — keep InfiniteSlider unmount delay in sync. */
export const LANDING_LOADER_EXIT_MS = EXIT_MS;

function DigitColumn({ digit, glyphs }: { digit: number; glyphs: string }) {
  const chars = glyphs.split("");

  return (
    <span className="inline-block h-[1em] w-[0.66em] overflow-hidden">
      <span
        className="flex flex-col transition-transform duration-[450ms] ease-out-expo motion-reduce:transition-none"
        style={{ transform: `translateY(-${digit}em)` }}
      >
        {chars.map((char) => (
          <span key={char} className="block h-[1em] text-center leading-none">
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}

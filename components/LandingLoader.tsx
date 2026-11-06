"use client";

type LandingLoaderProps = {
  /** Integer 0–100 from the landing clock. */
  percent: number;
  /** True while the block is fading out after the strip settles. */
  leaving?: boolean;
};

const TENS = "0123456789";

/**
 * The landing counter. It occupies the header's corner, then fades out
 * as the header fades in. Deep links and reduced motion never mount it.
 */
export function LandingLoader({ percent, leaving = false }: LandingLoaderProps) {
  const safe = Math.min(100, Math.max(0, Math.round(percent)));
  const hundreds = Math.floor(safe / 100);
  const tens = Math.floor((safe % 100) / 10);
  const ones = safe % 10;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 px-6 pt-5 transition-opacity duration-[600ms] ease-out-expo md:px-10 md:pt-6 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-end gap-5 text-ink md:gap-7">
        <div
          aria-hidden
          className="display-serif flex text-[clamp(4.5rem,10vw,7.25rem)] leading-none tabular-nums"
        >
          <DigitColumn digit={hundreds} glyphs="01" />
          <DigitColumn digit={tens} glyphs={TENS} />
          <DigitColumn digit={ones} glyphs={TENS} />
        </div>

        <div className="mb-2 flex w-28 flex-col gap-1.5 md:mb-3">
          <MaskedLine>Project</MaskedLine>
          <MaskedLine delay="120ms">loading</MaskedLine>
          <div className="relative mt-2 h-px w-full">
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${safe}%` }}>
              <div className="flex h-full w-28">
                <span className="h-full w-1.5 bg-accent" />
                <span className="h-full flex-1 bg-ink/45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Loading projects, {safe} percent
      </p>
    </div>
  );
}

function MaskedLine({ children, delay }: { children: string; delay?: string }) {
  return (
    <span className="block overflow-hidden">
      <span
        className="label-mono block motion-safe:animate-mask-up"
        style={delay ? { animationDelay: delay } : undefined}
      >
        {children}
      </span>
    </span>
  );
}

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

"use client";

import Link from "next/link";

export type HeaderTone = "ink" | "paper";

type SiteHeaderProps = {
  /** `ink` over the paper background; `paper` over the opened project image. */
  tone: HeaderTone;
  /** Hide the section links (while a project is open). */
  minimal?: boolean;
  /** Paint a soft paper fade behind the row (when scrolled content passes under it). */
  backdrop?: boolean;
};

const links = [
  { label: "About", href: "#" },
  { label: "Insights", href: "#" },
];

/** Fixed top row: brand mark, section links and the primary call to action. */
export function SiteHeader({ tone, minimal = false, backdrop = false }: SiteHeaderProps) {
  const isPaper = tone === "paper";
  const textColor = isPaper ? "text-paper" : "text-ink";
  const ruleColor = isPaper ? "border-paper/30" : "border-rule";

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 px-6 pt-5 transition-colors duration-500 md:px-10 md:pt-6 ${textColor}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-paper via-paper/85 to-transparent transition-opacity duration-500 ${
          backdrop ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative grid grid-cols-12 items-start gap-x-4 md:gap-x-6">
        {/* Brand mark (temporary) */}
        <Link
          href="/"
          aria-label="M — home"
          className="pointer-events-auto col-span-3 md:col-span-2"
        >
          <span className="display-serif text-[1.75rem] leading-none">M</span>
        </Link>

        {/* Section links */}
        <nav
          aria-label="Primary"
          className={`col-span-5 grid grid-cols-2 gap-x-4 transition-opacity duration-500 md:col-span-6 md:col-start-4 md:grid-cols-3 md:gap-x-6 ${
            minimal ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
          aria-hidden={minimal}
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              tabIndex={minimal ? -1 : 0}
              className={`group label-mono flex items-center gap-2 border-t pt-3 ${ruleColor}`}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              />
              <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5">
                {link.label}
              </span>
            </a>
          ))}
        </nav>

        {/* Primary call to action */}
        <a
          href="#"
          className={`group pointer-events-auto col-span-4 flex justify-end border-t pt-3 md:col-span-3 md:col-start-10 ${ruleColor}`}
        >
          <span className="label-mono link-draw inline-flex items-center gap-2">
            <span className="hidden sm:inline">Schedule a Meeting</span>
            <span className="sm:hidden">Schedule</span>
            <span
              aria-hidden
              className="inline-block transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </a>
      </div>
    </header>
  );
}

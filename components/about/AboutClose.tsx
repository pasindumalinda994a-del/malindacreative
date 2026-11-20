"use client";

import Link from "next/link";
import { useScheduleDrawer } from "@/components/schedule/ScheduleDrawerContext";

type AboutCloseProps = {
  closeLine: string;
};

/**
 * Quiet closing band — short line, schedule CTA, back to work.
 */
export function AboutClose({ closeLine }: AboutCloseProps) {
  const { open, triggerRef } = useScheduleDrawer();

  return (
    <footer className="mt-24 border-t border-rule pt-10 md:mt-32 md:pt-14">
      <div className="grid grid-cols-12 gap-x-4 gap-y-8 md:gap-x-6">
        <p className="label-mono col-span-12 text-ink-muted md:col-span-3">
          Next
        </p>
        <div className="col-span-12 md:col-span-9">
          <p className="font-display text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.2] italic text-ink">
            {closeLine}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <button
              type="button"
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                open();
              }}
              className="label-mono link-draw text-ink outline-none"
            >
              Schedule a Meeting
              <span aria-hidden className="ml-2">
                →
              </span>
            </button>
            <Link
              href="/"
              className="label-mono link-draw text-ink-muted outline-none"
            >
              ← Back to all projects
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

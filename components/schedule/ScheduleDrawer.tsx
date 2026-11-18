"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { fetchOpenSlots, type OpenSlotsPayload } from "@/lib/meetings/actions";

import { ScheduleBooking } from "./ScheduleBooking";
import { useScheduleDrawer } from "./ScheduleDrawerContext";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function getFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export function ScheduleDrawer() {
  const { isOpen, close, triggerRef } = useScheduleDrawer();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<OpenSlotsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [session, setSession] = useState(0);

  const loadSlots = useCallback(() => {
    setLoadError(null);
    startTransition(async () => {
      try {
        const data = await fetchOpenSlots();
        setPayload(data);
      } catch {
        setLoadError("Could not load availability. Try again.");
      }
    });
  }, []);

  // Mount when opening; unmount after close animation.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setSession((n) => n + 1);
      setPayload(null);
      loadSlots();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, loadSlots]);

  useGSAP(
    () => {
      if (!mounted || !panelRef.current || !scrimRef.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const panel = panelRef.current;
      const scrim = scrimRef.current;

      if (isOpen) {
        gsap.killTweensOf([panel, scrim]);
        if (reduced) {
          gsap.set(scrim, { opacity: 1 });
          gsap.set(panel, { x: 0 });
          closeBtnRef.current?.focus();
          return;
        }
        gsap.set(scrim, { opacity: 0 });
        gsap.set(panel, { x: "100%" });
        gsap.to(scrim, { opacity: 1, duration: 0.45, ease: EASE });
        gsap.to(panel, {
          x: 0,
          duration: 0.65,
          ease: EASE,
          onComplete: () => closeBtnRef.current?.focus(),
        });
        return;
      }

      // Closing
      gsap.killTweensOf([panel, scrim]);
      if (reduced) {
        setMounted(false);
        triggerRef.current?.focus();
        return;
      }
      gsap.to(scrim, { opacity: 0, duration: 0.35, ease: EASE });
      gsap.to(panel, {
        x: "100%",
        duration: 0.5,
        ease: EASE,
        onComplete: () => {
          setMounted(false);
          triggerRef.current?.focus();
        },
      });
    },
    { dependencies: [isOpen, mounted] },
  );

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, mounted, close]);

  if (!mounted) return null;

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-50">
      <button
        ref={scrimRef}
        type="button"
        aria-label="Close schedule drawer"
        className="pointer-events-auto absolute inset-0 bg-ink/35"
        onClick={close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-none flex-col border-l border-rule bg-paper text-ink shadow-none md:max-w-[32rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-6 pb-5 pt-6 md:px-8">
          <div className="min-w-0">
            <p className="label-mono text-accent">M</p>
            <h2
              id={titleId}
              className="display-serif mt-3 text-[clamp(2rem,6vw,2.75rem)] leading-none"
            >
              {payload?.availability.title ?? "Schedule a meeting"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {payload?.availability.supportingLine ??
                "A short conversation about your next project."}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            className="label-mono shrink-0 pt-1 text-ink-muted transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-none">
          {pending && !payload ? (
            <p className="label-mono px-6 py-10 text-ink-muted md:px-8">Loading times…</p>
          ) : null}
          {loadError ? (
            <div className="px-6 py-10 md:px-8">
              <p className="text-sm text-accent" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                onClick={loadSlots}
                className="label-mono link-draw mt-4 text-ink"
              >
                Try again
              </button>
            </div>
          ) : null}
          {payload ? (
            <ScheduleBooking
              key={session}
              availability={payload.availability}
              slots={payload.slots}
              variant="drawer"
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

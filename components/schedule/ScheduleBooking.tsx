"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useMemo, useRef, useState, useTransition } from "react";

import { bookMeeting } from "@/lib/meetings/book";
import { groupSlotsByDay } from "@/lib/meetings/scheduleUi";
import type { MeetingAvailabilityConfig, OpenSlot } from "@/lib/meetings/types";

import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleClockDial } from "./ScheduleClockDial";

type ScheduleBookingProps = {
  availability: MeetingAvailabilityConfig;
  slots: OpenSlot[];
  /** Drawer uses a tighter single-column layout. */
  variant?: "drawer" | "page";
};

function formatConfirmWhen(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ScheduleBooking({
  availability,
  slots,
  variant = "drawer",
}: ScheduleBookingProps) {
  const isDrawer = variant === "drawer";
  const rootRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => groupSlotsByDay(slots), [slots]);
  const [selectedDay, setSelectedDay] = useState(days[0]?.dayKey ?? "");
  const [selectedSlot, setSelectedSlot] = useState<OpenSlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ startsAt: string; email: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const daySlots = days.find((d) => d.dayKey === selectedDay)?.slots ?? [];
  const dayLabel =
    days.find((d) => d.dayKey === selectedDay)?.dayLabel ??
    selectedSlot?.dayLabel ??
    "";

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targets = root.querySelectorAll("[data-reveal]");
      if (reduced) {
        gsap.set(targets, { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform",
        },
      );
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!selectedSlot || confirmed) return;
      const form = rootRef.current?.querySelector("[data-form]");
      if (!form) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        form,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
    },
    { dependencies: [selectedSlot?.startsAt, confirmed] },
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    startTransition(async () => {
      const result = await bookMeeting({
        name,
        email,
        company,
        notes,
        startsAt: selectedSlot.startsAt,
        website,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmed({ startsAt: result.startsAt, email: result.email });
    });
  };

  const shellClass = isDrawer
    ? "px-6 pb-10 pt-6 md:px-8"
    : "mx-auto max-w-5xl px-6 pb-28 md:px-10";

  if (confirmed) {
    return (
      <section ref={rootRef} className={shellClass} aria-live="polite">
        <p data-reveal className="label-mono text-accent">
          Confirmed
        </p>
        <h2
          data-reveal
          className={`display-serif mt-3 text-ink ${
            isDrawer
              ? "text-[clamp(2rem,8vw,2.75rem)]"
              : "mt-4 text-[clamp(2.5rem,8vw,5rem)]"
          }`}
        >
          See you then
        </h2>
        <p
          data-reveal
          className={`mt-4 max-w-md leading-relaxed text-ink-muted ${
            isDrawer ? "text-sm" : "mt-6 text-base md:text-lg"
          }`}
        >
          {availability.successCopy}
        </p>
        <dl data-reveal className="mt-8 space-y-4 border-t border-rule pt-5">
          <div>
            <dt className="label-mono text-ink-muted">When</dt>
            <dd className="mt-2 text-sm text-ink">
              {formatConfirmWhen(confirmed.startsAt, availability.timezone)}
              <span className="text-ink-muted"> · {availability.timezone}</span>
            </dd>
          </div>
          <div>
            <dt className="label-mono text-ink-muted">Email</dt>
            <dd className="mt-2 text-sm text-ink">{confirmed.email}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <div ref={rootRef} className={shellClass}>
      <section aria-labelledby="slots-heading">
        <p data-reveal className="label-mono text-ink-muted">
          Select a day
        </p>
        <h2 id="slots-heading" className="sr-only">
          Available times
        </h2>

        {days.length === 0 ? (
          <p data-reveal className="mt-6 text-sm text-ink-muted">
            No open slots right now. Check back soon, or email directly.
          </p>
        ) : (
          <>
            <div data-reveal className="mt-5">
              <ScheduleCalendar
                slots={slots}
                selectedDay={selectedDay}
                onSelectDay={(dayKey) => {
                  setSelectedDay(dayKey);
                  setSelectedSlot(null);
                  setError(null);
                }}
              />
            </div>

            <div data-reveal className="mt-10 border-t border-rule pt-8">
              <p className="label-mono text-ink-muted">Select a time</p>
              {dayLabel ? (
                <p className="mt-2 text-xs text-ink-muted">{dayLabel}</p>
              ) : null}
              <div className="mt-5">
                <ScheduleClockDial
                  key={selectedDay}
                  slots={daySlots}
                  timeZone={availability.timezone}
                  selectedSlot={
                    selectedSlot?.dayKey === selectedDay ? selectedSlot : null
                  }
                  onSelectSlot={(slot) => {
                    setSelectedSlot(slot);
                    setError(null);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {selectedSlot ? (
        <section
          data-form
          aria-labelledby="details-heading"
          className={`border-t border-rule ${isDrawer ? "mt-10 pt-8" : "mt-16 pt-12"}`}
        >
          <p className="label-mono text-accent">Your details</p>
          <h2
            id="details-heading"
            className={`display-serif mt-2 text-ink ${
              isDrawer
                ? "text-[clamp(1.75rem,6vw,2.25rem)]"
                : "mt-3 text-[clamp(2rem,5vw,3.25rem)]"
            }`}
          >
            Almost there
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            {selectedSlot.dayLabel} · {selectedSlot.label} · {availability.timezone}
          </p>

          <form
            onSubmit={onSubmit}
            className={`mt-8 grid gap-6 ${isDrawer ? "grid-cols-1" : "md:grid-cols-2 md:gap-8"}`}
          >
            <label className="block">
              <span className="label-mono text-ink-muted">Name</span>
              <input
                required
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-b border-rule bg-transparent py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label-mono text-ink-muted">Email</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-b border-rule bg-transparent py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label-mono text-ink-muted">Company</span>
              <input
                name="company"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-2 w-full border-b border-rule bg-transparent py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </label>
            <label className={`block ${isDrawer ? "" : "md:col-span-2"}`}>
              <span className="label-mono text-ink-muted">Topic / notes</span>
              <textarea
                name="notes"
                rows={isDrawer ? 2 : 3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full resize-none border-b border-rule bg-transparent py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </label>

            <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>

            <div
              className={`${isDrawer ? "sticky bottom-0 -mx-6 border-t border-rule bg-paper/95 px-6 py-4 backdrop-blur-sm md:-mx-8 md:px-8" : "md:col-span-2"}`}
            >
              {error ? (
                <p className="mb-3 text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="group label-mono link-draw inline-flex items-center gap-2 text-ink disabled:opacity-50"
              >
                {pending ? "Booking…" : "Confirm meeting"}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                >
                  →
                </span>
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

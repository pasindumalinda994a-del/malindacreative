"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  availablePeriods,
  cycleSlot,
  filterSlotsByPeriod,
  nearestSlotByAngle,
  pointerAngleFromPoint,
  slotClockAngle,
  slotWallTime,
  type ClockPeriod,
} from "@/lib/meetings/scheduleUi";
import type { OpenSlot } from "@/lib/meetings/types";

type ScheduleClockDialProps = {
  slots: OpenSlot[];
  timeZone: string;
  selectedSlot: OpenSlot | null;
  onSelectSlot: (slot: OpenSlot) => void;
};

const CX = 100;
const CY = 100;
const R_FACE = 88;
const R_MARKER = 68;
const R_HAND = 54;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function ScheduleClockDial({
  slots,
  timeZone,
  selectedSlot,
  onSelectSlot,
}: ScheduleClockDialProps) {
  const labelId = useId();
  const dialRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<SVGLineElement>(null);
  const dragging = useRef(false);

  const periods = useMemo(() => availablePeriods(slots, timeZone), [slots, timeZone]);

  const [period, setPeriod] = useState<ClockPeriod>(() => {
    if (selectedSlot) return slotWallTime(selectedSlot, timeZone).period;
    return periods[0] ?? "am";
  });

  useEffect(() => {
    if (selectedSlot) {
      setPeriod(slotWallTime(selectedSlot, timeZone).period);
      return;
    }
    setPeriod((current) =>
      periods.length > 0 && !periods.includes(current) ? periods[0] : current,
    );
  }, [selectedSlot, timeZone, periods]);

  const periodSlots = useMemo(
    () => filterSlotsByPeriod(slots, timeZone, period),
    [slots, timeZone, period],
  );

  const displayAngle = selectedSlot
    ? slotClockAngle(selectedSlot, timeZone)
    : periodSlots[0]
      ? slotClockAngle(periodSlots[0], timeZone)
      : 0;

  const handTip = polar(CX, CY, R_HAND, displayAngle);

  useGSAP(
    () => {
      const hand = handRef.current;
      if (!hand) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tip = polar(CX, CY, R_HAND, displayAngle);
      if (reduced) {
        gsap.set(hand, { attr: { x2: tip.x, y2: tip.y } });
        return;
      }
      gsap.to(hand, {
        attr: { x2: tip.x, y2: tip.y },
        duration: 0.35,
        ease: "power3.out",
      });
    },
    { dependencies: [displayAngle] },
  );

  const snapFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = dialRef.current;
      if (!el || periodSlots.length === 0) return;
      const rect = el.getBoundingClientRect();
      const angle = pointerAngleFromPoint(clientX, clientY, rect);
      const nearest = nearestSlotByAngle(periodSlots, timeZone, angle);
      if (nearest) onSelectSlot(nearest);
    },
    [periodSlots, timeZone, onSelectSlot],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (periodSlots.length === 0) return;
    dragging.current = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    snapFromEvent(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging.current) return;
    snapFromEvent(event.clientX, event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (periodSlots.length === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = cycleSlot(periodSlots, selectedSlot, 1);
      if (next) onSelectSlot(next);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = cycleSlot(periodSlots, selectedSlot, -1);
      if (next) onSelectSlot(next);
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelectSlot(periodSlots[0]);
    } else if (event.key === "End") {
      event.preventDefault();
      onSelectSlot(periodSlots[periodSlots.length - 1]);
    }
  };

  const switchPeriod = (next: ClockPeriod) => {
    setPeriod(next);
    const first = filterSlotsByPeriod(slots, timeZone, next)[0];
    if (first) onSelectSlot(first);
  };

  if (slots.length === 0) {
    return (
      <p className="mt-2 text-sm text-ink-muted">No open times on this day.</p>
    );
  }

  return (
    <div className="w-full">
      {periods.length > 1 ? (
        <div
          className="mb-4 flex gap-4"
          role="group"
          aria-label="Morning or afternoon"
        >
          {periods.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                onClick={() => switchPeriod(p)}
                className={`label-mono border-b-2 pb-1 transition-colors duration-300 ease-out-expo ${
                  active
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {p === "am" ? "AM" : "PM"}
              </button>
            );
          })}
        </div>
      ) : periods.length === 1 ? (
        <p className="label-mono mb-4 text-ink-muted">
          {periods[0] === "am" ? "Morning" : "Afternoon"}
        </p>
      ) : null}

      {periodSlots.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No {period.toUpperCase()} times — try the other period.
        </p>
      ) : (
        <>
          <div
            ref={dialRef}
            role="listbox"
            aria-labelledby={labelId}
            aria-activedescendant={
              selectedSlot ? `slot-${selectedSlot.startsAt}` : undefined
            }
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative mx-auto aspect-square w-full max-w-[16rem] touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          >
            <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
              <circle
                cx={CX}
                cy={CY}
                r={R_FACE}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-rule-strong"
              />
              {Array.from({ length: 12 }, (_, i) => {
                const angle = i * 30;
                const outer = polar(CX, CY, R_FACE - 4, angle);
                const inner = polar(CX, CY, R_FACE - 12, angle);
                return (
                  <line
                    key={i}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="currentColor"
                    strokeWidth={i % 3 === 0 ? 1.5 : 1}
                    className="text-ink-muted/50"
                  />
                );
              })}
              {[
                { n: "12", a: 0 },
                { n: "3", a: 90 },
                { n: "6", a: 180 },
                { n: "9", a: 270 },
              ].map(({ n, a }) => {
                const p = polar(CX, CY, 72, a);
                return (
                  <text
                    key={n}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-ink-muted"
                    style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  >
                    {n}
                  </text>
                );
              })}
              <line
                ref={handRef}
                x1={CX}
                y1={CY}
                x2={handTip.x}
                y2={handTip.y}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-accent"
              />
              <circle cx={CX} cy={CY} r="3.5" className="fill-accent" />
            </svg>

            {periodSlots.map((slot) => {
              const angle = slotClockAngle(slot, timeZone);
              const pos = polar(50, 50, (R_MARKER / 200) * 100, angle);
              const active = selectedSlot?.startsAt === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  id={`slot-${slot.startsAt}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={slot.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSlot(slot);
                  }}
                  className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[background-color,border-color,transform] duration-300 ease-out-expo ${
                    active
                      ? "scale-125 border-accent bg-accent"
                      : "border-ink/40 bg-paper hover:border-accent hover:bg-accent/20"
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                />
              );
            })}
          </div>

          <p
            id={labelId}
            className="display-serif mt-5 text-center text-[clamp(1.75rem,6vw,2.25rem)] leading-none text-ink"
            aria-live="polite"
          >
            {selectedSlot?.label ?? "Pick a time"}
          </p>
          <p className="mt-2 text-center text-[0.65rem] text-ink-muted">
            Drag the dial or tap a marker · {timeZone}
          </p>
        </>
      )}
    </div>
  );
}

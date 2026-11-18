"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildMonthCells,
  canShiftMonth,
  formatMonthLabel,
  getMonthBounds,
  monthKeyFromDayKey,
  parseDayKey,
  shiftMonth,
  slotsByDayMap,
  weekdayLabels,
  type DayGroup,
} from "@/lib/meetings/scheduleUi";
import type { OpenSlot } from "@/lib/meetings/types";

type ScheduleCalendarProps = {
  slots: OpenSlot[];
  selectedDay: string;
  onSelectDay: (dayKey: string, group: DayGroup) => void;
};

export function ScheduleCalendar({
  slots,
  selectedDay,
  onSelectDay,
}: ScheduleCalendarProps) {
  const dayMap = useMemo(() => slotsByDayMap(slots), [slots]);
  const bounds = useMemo(() => getMonthBounds(slots), [slots]);

  const initial = useMemo(() => {
    const key = selectedDay || slots[0]?.dayKey;
    const parsed = key ? parseDayKey(key) : null;
    if (parsed) return { year: parsed.year, month: parsed.month };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, [selectedDay, slots]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    if (!selectedDay) return;
    const parsed = parseDayKey(selectedDay);
    if (!parsed) return;
    const key = monthKeyFromDayKey(selectedDay);
    if (!bounds || key < bounds.minMonth || key > bounds.maxMonth) return;
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [selectedDay, bounds]);

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth, dayMap),
    [viewYear, viewMonth, dayMap],
  );

  const labels = weekdayLabels();
  const canPrev = canShiftMonth(viewYear, viewMonth, -1, bounds);
  const canNext = canShiftMonth(viewYear, viewMonth, 1, bounds);

  const go = (delta: number) => {
    if (!canShiftMonth(viewYear, viewMonth, delta, bounds)) return;
    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="label-mono px-1 py-2 text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
        >
          ←
        </button>
        <p className="label-mono text-ink" aria-live="polite">
          {formatMonthLabel(viewYear, viewMonth)}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="label-mono px-1 py-2 text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
        >
          →
        </button>
      </div>

      <div
        className="mt-4 grid grid-cols-7 gap-y-1"
        role="grid"
        aria-label="Days with availability"
      >
        {labels.map((label) => (
          <div
            key={label}
            role="columnheader"
            className="label-mono pb-2 text-center text-[0.6rem] text-ink-muted"
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const selected = cell.dayKey === selectedDay;
          const interactive = cell.available;
          return (
            <button
              key={`${cell.dayKey}-${cell.inMonth ? "in" : "out"}`}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-disabled={!interactive}
              disabled={!interactive}
              onClick={() => {
                const group = dayMap.get(cell.dayKey);
                if (!group) return;
                onSelectDay(cell.dayKey, group);
              }}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-none text-sm tabular-nums transition-colors duration-300 ease-out-expo ${
                !cell.inMonth
                  ? "text-ink-muted/35"
                  : interactive
                    ? "text-ink"
                    : "text-ink-muted/40"
              } ${selected && interactive ? "border-b-2 border-accent" : "border-b-2 border-transparent"}`}
            >
              <span className={interactive && cell.inMonth ? "font-medium" : undefined}>
                {cell.day}
              </span>
              {interactive && cell.inMonth ? (
                <span
                  aria-hidden
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    selected ? "bg-accent" : "bg-ink-muted/50"
                  }`}
                />
              ) : (
                <span aria-hidden className="mt-0.5 h-1 w-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

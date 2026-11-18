import type { OpenSlot } from "./types";

export type DayGroup = {
  dayKey: string;
  dayLabel: string;
  slots: OpenSlot[];
};

export type ClockPeriod = "am" | "pm";

export type CalendarCell = {
  dayKey: string;
  day: number;
  inMonth: boolean;
  available: boolean;
  slotCount: number;
};

export type MonthBounds = {
  /** YYYY-MM of the earliest open day */
  minMonth: string;
  /** YYYY-MM of the latest open day */
  maxMonth: string;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function groupSlotsByDay(slots: OpenSlot[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const slot of slots) {
    const existing = map.get(slot.dayKey);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(slot.dayKey, {
        dayKey: slot.dayKey,
        dayLabel: slot.dayLabel,
        slots: [slot],
      });
    }
  }
  return Array.from(map.values());
}

export function slotsByDayMap(slots: OpenSlot[]): Map<string, DayGroup> {
  const map = new Map<string, DayGroup>();
  for (const group of groupSlotsByDay(slots)) {
    map.set(group.dayKey, group);
  }
  return map;
}

/** Monday-start weekday index 0–6 from Sunday-start (0=Sun). */
function mondayIndex(sundayWeekday: number): number {
  return (sundayWeekday + 6) % 7;
}

export function parseDayKey(dayKey: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function monthKeyFromDayKey(dayKey: string): string {
  return dayKey.slice(0, 7);
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getMonthBounds(slots: OpenSlot[]): MonthBounds | null {
  if (slots.length === 0) return null;
  let min = slots[0].dayKey;
  let max = slots[0].dayKey;
  for (const slot of slots) {
    if (slot.dayKey < min) min = slot.dayKey;
    if (slot.dayKey > max) max = slot.dayKey;
  }
  return {
    minMonth: monthKeyFromDayKey(min),
    maxMonth: monthKeyFromDayKey(max),
  };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function canShiftMonth(
  year: number,
  month: number,
  delta: number,
  bounds: MonthBounds | null,
): boolean {
  if (!bounds) return false;
  const next = shiftMonth(year, month, delta);
  const key = `${next.year}-${String(next.month).padStart(2, "0")}`;
  return key >= bounds.minMonth && key <= bounds.maxMonth;
}

/**
 * Build a Monday-start calendar grid for `year`/`month` (1–12).
 * Day keys match server-generated OpenSlot.dayKey values (availability TZ).
 */
export function buildMonthCells(
  year: number,
  month: number,
  dayMap: Map<string, DayGroup>,
): CalendarCell[] {
  const firstWeekday = mondayIndex(
    new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay(),
  );
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    const day = prevMonthDays - firstWeekday + 1 + i;
    const prev = shiftMonth(year, month, -1);
    const dayKey = `${prev.year}-${String(prev.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const group = dayMap.get(dayKey);
    cells.push({
      dayKey,
      day,
      inMonth: false,
      available: Boolean(group?.slots.length),
      slotCount: group?.slots.length ?? 0,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const group = dayMap.get(dayKey);
    cells.push({
      dayKey,
      day,
      inMonth: true,
      available: Boolean(group?.slots.length),
      slotCount: group?.slots.length ?? 0,
    });
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (firstWeekday + daysInMonth) + 1;
    const next = shiftMonth(year, month, 1);
    const dayKey = `${next.year}-${String(next.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const group = dayMap.get(dayKey);
    cells.push({
      dayKey,
      day,
      inMonth: false,
      available: Boolean(group?.slots.length),
      slotCount: group?.slots.length ?? 0,
    });
  }

  return cells;
}

export function weekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

/** Hour/minute of a slot as seen in `timeZone`. */
export function slotWallTime(
  slot: OpenSlot,
  timeZone: string,
): { hour: number; minute: number; period: ClockPeriod } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(new Date(slot.startsAt))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  return {
    hour,
    minute,
    period: hour < 12 ? "am" : "pm",
  };
}

/** Degrees from 12 o'clock for a wall-clock time (minute hand precision). */
export function clockAngleDegrees(hour: number, minute: number): number {
  const h = hour % 12;
  return h * 30 + minute * 0.5;
}

export function slotClockAngle(slot: OpenSlot, timeZone: string): number {
  const { hour, minute } = slotWallTime(slot, timeZone);
  return clockAngleDegrees(hour, minute);
}

export function filterSlotsByPeriod(
  slots: OpenSlot[],
  timeZone: string,
  period: ClockPeriod,
): OpenSlot[] {
  return slots.filter((slot) => slotWallTime(slot, timeZone).period === period);
}

/** Periods that have at least one slot for the day. */
export function availablePeriods(slots: OpenSlot[], timeZone: string): ClockPeriod[] {
  const hasAm = slots.some((s) => slotWallTime(s, timeZone).period === "am");
  const hasPm = slots.some((s) => slotWallTime(s, timeZone).period === "pm");
  const periods: ClockPeriod[] = [];
  if (hasAm) periods.push("am");
  if (hasPm) periods.push("pm");
  return periods;
}

/**
 * Angle of a pointer relative to dial center, 0° at 12 o'clock, clockwise.
 */
export function pointerAngleFromPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const rad = Math.atan2(dx, -dy);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

function angleDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function nearestSlotByAngle(
  slots: OpenSlot[],
  timeZone: string,
  angle: number,
): OpenSlot | null {
  if (slots.length === 0) return null;
  let best = slots[0];
  let bestDist = Infinity;
  for (const slot of slots) {
    const dist = angleDistance(slotClockAngle(slot, timeZone), angle);
    if (dist < bestDist) {
      bestDist = dist;
      best = slot;
    }
  }
  return best;
}

export function cycleSlot(
  slots: OpenSlot[],
  current: OpenSlot | null,
  direction: 1 | -1,
): OpenSlot | null {
  if (slots.length === 0) return null;
  if (!current) return direction === 1 ? slots[0] : slots[slots.length - 1];
  const index = slots.findIndex((s) => s.startsAt === current.startsAt);
  if (index < 0) return slots[0];
  const next = (index + direction + slots.length) % slots.length;
  return slots[next];
}

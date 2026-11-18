import { getPayload } from "@/lib/payload/getPayload";

import {
  formatDayLabel,
  formatSlotLabel,
  parseHm,
  toDayKey,
  zonedCalendarDay,
  zonedLocalToUtc,
} from "./timezone";
import type {
  MeetingAvailabilityConfig,
  OpenSlot,
  WeeklyWindow,
} from "./types";

const DEFAULT_AVAILABILITY: MeetingAvailabilityConfig = {
  title: "Schedule a meeting",
  supportingLine: "A short conversation about your next project — pick a time that works.",
  successCopy: "You're booked. A confirmation will follow by email.",
  timezone: "Asia/Colombo",
  slotMinutes: 30,
  bufferMinutes: 0,
  leadTimeHours: 24,
  horizonDays: 28,
  weekly: [
    { weekday: "1", startTime: "10:00", endTime: "13:00" },
    { weekday: "3", startTime: "14:00", endTime: "17:00" },
    { weekday: "5", startTime: "10:00", endTime: "12:00" },
  ],
  blackouts: [],
};

function coerceAvailability(raw: Record<string, unknown> | null | undefined): MeetingAvailabilityConfig {
  if (!raw) return DEFAULT_AVAILABILITY;

  return {
    title: String(raw.title || DEFAULT_AVAILABILITY.title),
    supportingLine: String(raw.supportingLine || DEFAULT_AVAILABILITY.supportingLine),
    successCopy: String(raw.successCopy || DEFAULT_AVAILABILITY.successCopy),
    timezone: String(raw.timezone || DEFAULT_AVAILABILITY.timezone),
    slotMinutes: Number(raw.slotMinutes ?? DEFAULT_AVAILABILITY.slotMinutes),
    bufferMinutes: Number(raw.bufferMinutes ?? DEFAULT_AVAILABILITY.bufferMinutes),
    leadTimeHours: Number(raw.leadTimeHours ?? DEFAULT_AVAILABILITY.leadTimeHours),
    horizonDays: Number(raw.horizonDays ?? DEFAULT_AVAILABILITY.horizonDays),
    weekly: Array.isArray(raw.weekly)
      ? (raw.weekly as WeeklyWindow[]).filter((w) => w?.weekday && w?.startTime && w?.endTime)
      : DEFAULT_AVAILABILITY.weekly,
    blackouts: Array.isArray(raw.blackouts)
      ? (raw.blackouts as MeetingAvailabilityConfig["blackouts"]).filter((b) => b?.from && b?.to)
      : [],
  };
}

export async function getMeetingAvailability(): Promise<MeetingAvailabilityConfig> {
  try {
    const payload = await getPayload();
    const doc = await payload.findGlobal({
      slug: "meeting-availability",
      depth: 0,
      overrideAccess: true,
    });
    return coerceAvailability(doc as unknown as Record<string, unknown>);
  } catch (error) {
    console.warn("[meetings] Using default availability:", error);
    return DEFAULT_AVAILABILITY;
  }
}

function buildCandidateSlots(config: MeetingAvailabilityConfig, now = new Date()): OpenSlot[] {
  const { timezone, slotMinutes, leadTimeHours, horizonDays, weekly, blackouts } = config;
  const earliest = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);
  const blackoutKeys = new Set<string>();

  for (const blackout of blackouts) {
    const fromKey = toDayKey(blackout.from, timezone);
    const toKey = toDayKey(blackout.to, timezone);
    const cursor = new Date(`${fromKey}T12:00:00Z`);
    const end = new Date(`${toKey}T12:00:00Z`);
    while (cursor <= end) {
      blackoutKeys.add(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const windowsByWeekday = new Map<number, WeeklyWindow[]>();
  for (const window of weekly) {
    const day = Number(window.weekday);
    const list = windowsByWeekday.get(day) ?? [];
    list.push(window);
    windowsByWeekday.set(day, list);
  }

  const slots: OpenSlot[] = [];
  const startDay = zonedCalendarDay(now, timezone);

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const base = new Date(Date.UTC(startDay.year, startDay.month - 1, startDay.day + offset, 12, 0, 0));
    const cal = zonedCalendarDay(base, timezone);
    if (blackoutKeys.has(cal.key)) continue;

    const dayWindows = windowsByWeekday.get(cal.weekday) ?? [];
    for (const window of dayWindows) {
      const startHm = parseHm(window.startTime);
      const endHm = parseHm(window.endTime);
      if (!startHm || !endHm) continue;

      let cursor = zonedLocalToUtc(
        cal.year,
        cal.month,
        cal.day,
        startHm.hour,
        startHm.minute,
        timezone,
      );
      const windowEnd = zonedLocalToUtc(
        cal.year,
        cal.month,
        cal.day,
        endHm.hour,
        endHm.minute,
        timezone,
      );

      while (cursor.getTime() + slotMinutes * 60_000 <= windowEnd.getTime()) {
        const endsAt = new Date(cursor.getTime() + slotMinutes * 60_000);
        if (cursor >= earliest) {
          slots.push({
            startsAt: cursor.toISOString(),
            endsAt: endsAt.toISOString(),
            label: formatSlotLabel(cursor, timezone),
            dayKey: cal.key,
            dayLabel: formatDayLabel(cursor, timezone),
          });
        }
        cursor = new Date(cursor.getTime() + slotMinutes * 60_000);
      }
    }
  }

  return slots;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  bufferMinutes: number,
): boolean {
  const bufferMs = bufferMinutes * 60_000;
  return aStart.getTime() < bEnd.getTime() + bufferMs && aEnd.getTime() + bufferMs > bStart.getTime();
}

/** Expand weekly windows into open slots, minus blackouts and confirmed meetings. */
export async function getOpenSlots(): Promise<{
  availability: MeetingAvailabilityConfig;
  slots: OpenSlot[];
}> {
  const availability = await getMeetingAvailability();
  const candidates = buildCandidateSlots(availability);

  if (candidates.length === 0) {
    return { availability, slots: [] };
  }

  try {
    const payload = await getPayload();
    const rangeStart = candidates[0].startsAt;
    const rangeEnd = candidates[candidates.length - 1].endsAt;

    const booked = await payload.find({
      collection: "meetings",
      depth: 0,
      limit: 500,
      where: {
        and: [
          { status: { equals: "confirmed" } },
          { startsAt: { less_than: rangeEnd } },
          { endsAt: { greater_than: rangeStart } },
        ],
      },
      overrideAccess: true,
    });

    const meetings = booked.docs.map((doc) => ({
      start: new Date(doc.startsAt as string),
      end: new Date(doc.endsAt as string),
    }));

    const slots = candidates.filter((slot) => {
      const start = new Date(slot.startsAt);
      const end = new Date(slot.endsAt);
      return !meetings.some((m) =>
        overlaps(start, end, m.start, m.end, availability.bufferMinutes),
      );
    });

    return { availability, slots };
  } catch (error) {
    console.warn("[meetings] Could not load bookings; showing raw availability:", error);
    return { availability, slots: candidates };
  }
}

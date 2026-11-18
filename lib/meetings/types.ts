export type WeeklyWindow = {
  weekday: string;
  startTime: string;
  endTime: string;
};

export type Blackout = {
  from: string;
  to: string;
  reason?: string | null;
};

export type MeetingAvailabilityConfig = {
  title: string;
  supportingLine: string;
  successCopy: string;
  timezone: string;
  slotMinutes: number;
  bufferMinutes: number;
  leadTimeHours: number;
  horizonDays: number;
  weekly: WeeklyWindow[];
  blackouts: Blackout[];
};

export type OpenSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dayKey: string;
  dayLabel: string;
};

export type BookMeetingInput = {
  name: string;
  email: string;
  company?: string;
  notes?: string;
  startsAt: string;
  /** Honeypot — must stay empty. */
  website?: string;
};

export type BookMeetingResult =
  | { ok: true; startsAt: string; endsAt: string; email: string }
  | { ok: false; error: string };

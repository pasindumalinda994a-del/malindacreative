"use server";

import { getPayload } from "@/lib/payload/getPayload";

import { getOpenSlots } from "./availability";
import type { BookMeetingInput, BookMeetingResult } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function bookMeeting(input: BookMeetingInput): Promise<BookMeetingResult> {
  if (input.website && input.website.trim() !== "") {
    return { ok: false, error: "Unable to complete booking." };
  }

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const company = input.company?.trim() || undefined;
  const notes = input.notes?.trim() || undefined;
  const startsAt = input.startsAt;

  if (name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!startsAt) {
    return { ok: false, error: "Please select a time slot." };
  }

  const { availability, slots } = await getOpenSlots();
  const slot = slots.find((s) => s.startsAt === startsAt);
  if (!slot) {
    return { ok: false, error: "That time slot is no longer available. Pick another." };
  }

  try {
    const payload = await getPayload();
    await payload.create({
      collection: "meetings",
      data: {
        name,
        email,
        company,
        notes,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timezone: availability.timezone,
        status: "confirmed",
      },
      overrideAccess: true,
    });

    return {
      ok: true,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      email,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed.";
    return { ok: false, error: message };
  }
}

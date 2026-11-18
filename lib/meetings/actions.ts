"use server";

import { getOpenSlots } from "./availability";
import type { MeetingAvailabilityConfig, OpenSlot } from "./types";

export type OpenSlotsPayload = {
  availability: MeetingAvailabilityConfig;
  slots: OpenSlot[];
};

/** Client-callable fetch for the schedule drawer. */
export async function fetchOpenSlots(): Promise<OpenSlotsPayload> {
  return getOpenSlots();
}

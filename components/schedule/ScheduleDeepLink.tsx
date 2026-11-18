"use client";

import { useEffect, useRef } from "react";

import { useScheduleDrawer } from "./ScheduleDrawerContext";

/**
 * Opens the schedule drawer once when `?schedule=` is present, then cleans the URL.
 */
export function ScheduleDeepLink({ shouldOpen }: { shouldOpen: boolean }) {
  const { open } = useScheduleDrawer();
  const handled = useRef(false);

  useEffect(() => {
    if (!shouldOpen || handled.current) return;
    handled.current = true;
    open();
    const url = new URL(window.location.href);
    url.searchParams.delete("schedule");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [shouldOpen, open]);

  return null;
}

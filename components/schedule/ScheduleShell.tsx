"use client";

import type { ReactNode } from "react";

import { ScheduleDrawer } from "./ScheduleDrawer";
import { ScheduleDrawerProvider } from "./ScheduleDrawerContext";

/** Client boundary: drawer context + panel for the frontend tree. */
export function ScheduleShell({ children }: { children: ReactNode }) {
  return (
    <ScheduleDrawerProvider>
      {children}
      <ScheduleDrawer />
    </ScheduleDrawerProvider>
  );
}

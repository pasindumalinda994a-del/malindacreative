"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ScheduleDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Element that opened the drawer — focus returns here on close. */
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const ScheduleDrawerContext = createContext<ScheduleDrawerContextValue | null>(null);

export function ScheduleDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, open, close, triggerRef }),
    [isOpen, open, close],
  );

  return (
    <ScheduleDrawerContext.Provider value={value}>{children}</ScheduleDrawerContext.Provider>
  );
}

export function useScheduleDrawer() {
  const ctx = useContext(ScheduleDrawerContext);
  if (!ctx) {
    throw new Error("useScheduleDrawer must be used within ScheduleDrawerProvider");
  }
  return ctx;
}

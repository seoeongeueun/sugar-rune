import { create } from "zustand";

interface CalendarState {
  isOpen: boolean;
  targetDate: string | null;
  openCalendar: (targetDate?: string) => void;
  closeCalendar: () => void;
  toggleCalendar: () => void;
}

export const useCalendar = create<CalendarState>((set) => ({
  isOpen: false,
  targetDate: null,
  openCalendar: (targetDate) =>
    set({
      isOpen: true,
      targetDate: targetDate ?? null,
    }),
  closeCalendar: () => set({ isOpen: false }),
  toggleCalendar: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      targetDate: null,
    })),
}));

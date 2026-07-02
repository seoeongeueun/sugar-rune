import { create } from "zustand";
import type { Note } from "@/lib";

interface NoteState {
  note: Note | null;
  isOpen: boolean;
  openNote: () => void;
  closeNote: () => void;
  updateHeartColor: (heartColor: string) => void;
  updateContent: (content: string, heartContent: string) => void;
  clearContent: () => void;
  resetNote: () => void;
}

export const useNote = create<NoteState>((set) => ({
  note: null,
  isOpen: false,
  openNote: () => set({ isOpen: true }),
  closeNote: () => set({ isOpen: false }),
  updateHeartColor: (heartColor) =>
    set((state) => ({
      note: state.note
        ? {
            ...state.note,
            heart_content: heartColor,
          }
        : {
            content: "",
            heart_content: heartColor,
          },
    })),
  updateContent: (content, heartContent) =>
    set({
      note: {
        content,
        heart_content: heartContent,
      },
    }),
  clearContent: () =>
    set((state) => ({
      note: state.note
        ? {
            ...state.note,
            content: "",
          }
        : {
            content: "",
            heart_content: "",
          },
    })),
  resetNote: () => set({ note: null }),
}));

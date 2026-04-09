import { create } from "zustand";
import type { Note } from "@/lib";

interface NoteState {
  note: Note | null;
  updateHeartColor: (heartColor: string) => void;
  updateContent: (content: string, heartContent: string) => void;
  clearContent: () => void;
  resetNote: () => void;
}

export const useNote = create<NoteState>((set) => ({
  note: null,
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

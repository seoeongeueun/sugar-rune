import { create } from "zustand";
import type { Note, StampData } from "@/lib";

interface NoteState {
  note: Note | null;
  isOpen: boolean;
  openNote: (note?: Note) => void;
  closeNote: () => void;
  updateHeartColor: (heartColor: string) => void;
  updateContent: (
    content: string,
    heartContent: string,
    date?: string,
    id?: string,
    stamps?: StampData[],
  ) => void;
  updateStamps: (stamps: StampData[]) => void;
  clearContent: () => void;
  resetNote: () => void;
}

export const useNote = create<NoteState>((set) => ({
  note: null,
  isOpen: false,
  openNote: (note) =>
    set((state) => ({
      note: note ?? state.note,
      isOpen: true,
    })),
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
  updateContent: (content, heartContent, date, id, stamps) =>
    set((state) => ({
      note: {
        ...state.note,
        content,
        date: date ?? state.note?.date,
        heart_content: heartContent,
        id: id ?? state.note?.id,
        stamps: stamps ?? state.note?.stamps,
      },
    })),
  updateStamps: (stamps) =>
    set((state) => ({
      note: state.note
        ? {
            ...state.note,
            stamps,
          }
        : state.note,
    })),
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

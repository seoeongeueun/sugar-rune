import { isSupabaseConfigured, supabase } from "@/lib";
import { useQuery, type QueryClient } from "@tanstack/react-query";

export type CreateNoteInput = {
  content: string;
  date: string;
  userId: string;
  heartColor: string;
};

export type UpdateNoteInput = {
  id: string;
  content: string;
  date: string;
  heartColor: string;
};

export type NotesYearInput = {
  userId: string;
  year: number;
};

export type NotesUserInput = {
  userId: string;
};

export type UserNote = {
  id: string;
  content: string;
  date: string;
  user_id: string;
  heart_color: string;
};

export const notesQueryKeys = {
  all: ["notes"] as const,
  byUserId: (userId: string) => [...notesQueryKeys.all, userId] as const,
  byUserYear: (userId: string, year: number) =>
    [...notesQueryKeys.byUserId(userId), year] as const,
};

function formatDateForQuery(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function fetchNotesByUserYear({
  userId,
  year,
}: NotesYearInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const yearStart = formatDateForQuery(new Date(year, 0, 1));
  const nextYearStart = formatDateForQuery(new Date(year + 1, 0, 1));

  const { data, error } = await supabase
    .from("notes")
    .select("id, content, date, user_id, heart_color")
    .eq("user_id", userId)
    .gte("date", yearStart)
    .lt("date", nextYearStart)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return data satisfies UserNote[];
}

export async function fetchNotesByUser({ userId }: NotesUserInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("notes")
    .select("id, content, date, user_id, heart_color")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return data satisfies UserNote[];
}

export function useUserAllNotes(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? notesQueryKeys.byUserId(userId) : notesQueryKeys.all,
    queryFn: async () => {
      if (!userId) {
        throw new Error("User id is required to fetch notes.");
      }

      return fetchNotesByUser({ userId });
    },
    enabled: Boolean(userId) && isSupabaseConfigured,
  });
}

export function useUserNotes(userId: string | undefined, year: number) {
  return useQuery({
    queryKey: userId
      ? notesQueryKeys.byUserYear(userId, year)
      : notesQueryKeys.all,
    queryFn: async () => {
      if (!userId) {
        throw new Error("User id is required to fetch notes.");
      }

      return fetchNotesByUserYear({ userId, year });
    },
    enabled: Boolean(userId) && isSupabaseConfigured,
  });
}

export function clearNotesQueryCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: notesQueryKeys.all });
}

export async function createNote({
  content,
  date,
  userId,
  heartColor,
}: CreateNoteInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      content,
      date,
      user_id: userId,
      heart_color: heartColor,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateNote({
  id,
  content,
  date,
  heartColor,
}: UpdateNoteInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("notes")
    .update({
      content,
      date,
      heart_color: heartColor,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

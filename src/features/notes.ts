import { isSupabaseConfigured, supabase } from "@/lib";
import { useQuery, type QueryClient } from "@tanstack/react-query";

export type CreateNoteInput = {
  content: string;
  date: string;
  userId: string;
  heartColor: string;
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
};

export async function fetchNotesByUserId(userId: string) {
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

export function useUserNotes(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? notesQueryKeys.byUserId(userId) : notesQueryKeys.all,
    queryFn: () => {
      if (!userId) {
        throw new Error("User id is required to fetch notes.");
      }

      return fetchNotesByUserId(userId);
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

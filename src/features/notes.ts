import { isSupabaseConfigured, supabase } from "@/lib";

export type CreateNoteInput = {
  content: string;
  date: string;
  userId: string;
  heartColor: string;
};

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

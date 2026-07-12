import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib";

interface AuthState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  username: string | null;
  totalNotes: number;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
}

// Extracts and returns a trimmed username from the user metadata, or null if not available
function getUsername(user: User | null) {
  const username = user?.user_metadata?.username;

  if (typeof username !== "string") {
    return null;
  }

  const trimmedUsername = username.trim();
  return trimmedUsername.length > 0 ? trimmedUsername : null;
}

export const useAuth = create<AuthState>((set) => ({
  isLoading: isSupabaseConfigured,
  session: null,
  user: null,
  username: null,
  totalNotes: 0,
  setSession: (session) => {
    const user = session?.user ?? null;

    set({
      session,
      user,
      username: getUsername(user),
      totalNotes: 0,
    });

    if (!isSupabaseConfigured || !user) {
      return;
    }

    void supabase
      .from("users")
      .select("total_notes")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading total notes:", error);
          return;
        }

        set({ totalNotes: data?.total_notes ?? 0 });
      });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  },
}));

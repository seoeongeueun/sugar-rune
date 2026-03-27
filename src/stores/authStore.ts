import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib";

interface AuthState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  username: string | null;
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
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      username: getUsername(session?.user ?? null),
    }),
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

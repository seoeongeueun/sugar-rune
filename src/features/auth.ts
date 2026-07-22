import { supabase, isSupabaseConfigured } from "@/lib";

export interface EmailAuthPayload {
  email: string;
  password: string;
  username?: string;
}

function assertSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

export async function signUpWithEmail(payload: EmailAuthPayload) {
  assertSupabaseConfig();

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        username: payload.username?.trim() ?? "",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(payload: EmailAuthPayload) {
  assertSupabaseConfig();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendPasswordResetEmail(email: string) {
  assertSupabaseConfig();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCurrentUserPassword(password: string) {
  assertSupabaseConfig();

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }

  return data;
}

export async function verifyUserPassword(payload: {
  email: string;
  password: string;
}) {
  assertSupabaseConfig();

  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }
}

import { isSupabaseConfigured, supabase } from "@/lib";
import { useQuery, type QueryClient } from "@tanstack/react-query";

export type UserProfile = {
  totalNotes: number;
  ecru: number;
  isAdmin: boolean;
};

export type UserProfileInput = {
  userId: string;
};

export const userProfileQueryKeys = {
  all: ["user-profile"] as const,
  byUserId: (userId: string) => [...userProfileQueryKeys.all, userId] as const,
};

export async function fetchUserProfile({ userId }: UserProfileInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("total_notes, ecru, is_admin")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    totalNotes: data?.total_notes ?? 0,
    ecru: data?.ecru ?? 0,
    isAdmin: data?.is_admin === true,
  } satisfies UserProfile;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? userProfileQueryKeys.byUserId(userId)
      : userProfileQueryKeys.all,
    queryFn: async () => {
      if (!userId) {
        throw new Error("User id is required to fetch user profile.");
      }

      return fetchUserProfile({ userId });
    },
    enabled: Boolean(userId) && isSupabaseConfigured,
  });
}

export function clearUserProfileQueryCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: userProfileQueryKeys.all });
}

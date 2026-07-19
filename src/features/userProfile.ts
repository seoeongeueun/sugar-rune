import { isSupabaseConfigured, supabase } from "@/lib";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

export type UserProfile = {
  totalNotes: number;
  ecru: number;
  isAdmin: boolean;
  isLockMode: boolean;
  spell: string;
};

export type UserProfileInput = {
  userId: string;
};

export type UpdateUserLockModeInput = {
  userId: string;
  isLockMode: boolean;
  spell: string;
};

export type UpdateUserLockModeMutationInput = Omit<
  UpdateUserLockModeInput,
  "userId"
>;

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
    .select("total_notes, ecru, is_admin, is_lock_mode, spell")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    totalNotes: data?.total_notes ?? 0,
    ecru: data?.ecru ?? 0,
    isAdmin: data?.is_admin === true,
    isLockMode: data?.is_lock_mode === true,
    spell: data?.spell ?? "",
  } satisfies UserProfile;
}

export async function updateUserLockMode({
  userId,
  isLockMode,
  spell,
}: UpdateUserLockModeInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("users")
    .update({ is_lock_mode: isLockMode, spell })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return {
    isLockMode,
    spell,
  };
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

export function useUpdateUserLockMode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isLockMode, spell }: UpdateUserLockModeMutationInput) => {
      if (!userId) {
        throw new Error("User id is required to update lock mode.");
      }

      return updateUserLockMode({ userId, isLockMode, spell });
    },
    onMutate: async ({ isLockMode, spell }) => {
      if (!userId) {
        return;
      }

      const queryKey = userProfileQueryKeys.byUserId(userId);

      await queryClient.cancelQueries({ queryKey });

      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);

      queryClient.setQueryData<UserProfile>(queryKey, (profile) =>
        profile ? { ...profile, isLockMode, spell } : profile,
      );

      return { previousProfile };
    },
    onError: (_error, _input, context) => {
      if (!userId || !context?.previousProfile) {
        return;
      }

      queryClient.setQueryData(
        userProfileQueryKeys.byUserId(userId),
        context.previousProfile,
      );
    },
    onSettled: () => {
      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: userProfileQueryKeys.byUserId(userId),
      });
    },
  });
}

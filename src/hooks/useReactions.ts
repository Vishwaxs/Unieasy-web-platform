import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type ReactionType = "like" | "dislike" | "bookmark";

export interface ReactionCounts {
  like_count: number;
  dislike_count: number;
  bookmark_count: number;
}

export interface UserReaction {
  place_id: string;
  reaction: ReactionType;
  created_at: string;
}

/**
 * Hook: get reaction counts for a specific place.
 */
export function useReactionCounts(placeId: string | undefined) {
  return useQuery<ReactionCounts>({
    queryKey: ["reaction_counts", placeId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/reactions/${placeId}/counts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!placeId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: get all reactions for the current user (for bookmarks page, etc.).
 */
export function useUserReactions() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<UserReaction[]>({
    queryKey: ["user_reactions"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/reactions/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!isSignedIn,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: toggle a reaction with optimistic update.
 */
export function useToggleReaction(placeId: string | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reaction: ReactionType) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(
        `${API_BASE}/api/reactions/${placeId}/${reaction}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return res.json();
    },

    // Optimistic update
    onMutate: async (reaction: ReactionType) => {
      await queryClient.cancelQueries({
        queryKey: ["reaction_counts", placeId],
      });

      const prev = queryClient.getQueryData<ReactionCounts>([
        "reaction_counts",
        placeId,
      ]);

      if (prev) {
        const updated = { ...prev };
        const key = `${reaction}_count` as keyof ReactionCounts;

        // Toggle: if already has this reaction, decrement; else increment
        // For like/dislike mutual exclusivity, also handle the opposite
        if (reaction === "like" || reaction === "dislike") {
          const opposite = reaction === "like" ? "dislike_count" : "like_count";
          // We can't know for sure if user already reacted, so just increment
          // Server will reconcile on refetch
          updated[key] = updated[key] + 1;
          if (updated[opposite] > 0) {
            updated[opposite] = updated[opposite] - 1;
          }
        } else {
          updated[key] = updated[key] + 1;
        }

        queryClient.setQueryData(["reaction_counts", placeId], updated);
      }

      return { prev };
    },

    onError: (_err, _reaction, context) => {
      // Rollback
      if (context?.prev) {
        queryClient.setQueryData(["reaction_counts", placeId], context.prev);
      }
    },

    onSettled: () => {
      // Refetch to get accurate server state
      queryClient.invalidateQueries({
        queryKey: ["reaction_counts", placeId],
      });
      queryClient.invalidateQueries({ queryKey: ["user_reactions"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type Sentiment = "love" | "like" | "neutral" | "dislike" | "terrible";

export interface SentimentDistribution {
  love: number;
  like: number;
  neutral: number;
  dislike: number;
  terrible: number;
}

export interface SentimentData {
  distribution: SentimentDistribution;
  total: number;
  userVote: Sentiment | null;
}

/**
 * Hook: fetch sentiment distribution for a place.
 */
export function useSentiment(placeId: string | undefined) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<SentimentData>({
    queryKey: ["sentiment", placeId],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }
      const res = await fetch(`${API_BASE}/api/sentiment/${placeId}`, {
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!placeId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: submit a sentiment vote.
 */
export function useVoteSentiment(placeId: string | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sentiment: Sentiment) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/sentiment/${placeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentiment }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentiment", placeId] });
    },
  });
}

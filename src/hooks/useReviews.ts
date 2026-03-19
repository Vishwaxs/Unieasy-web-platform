import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export interface Review {
  id: string;
  place_id: string;
  clerk_user_id?: string;
  rating: number;
  body: string;
  is_anonymous: boolean;
  verified_student: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  app_users: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ReviewsResponse {
  data: Review[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateReviewData {
  rating: number;
  body: string;
  is_anonymous?: boolean;
}

/**
 * Hook: fetch reviews for a place.
 */
export function useReviews(placeId: string | undefined, limit = 20, offset = 0) {
  return useQuery<ReviewsResponse>({
    queryKey: ["reviews", placeId, limit, offset],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/reviews/${placeId}?limit=${limit}&offset=${offset}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!placeId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: create a review.
 */
export function useCreateReview(placeId: string | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/reviews/${placeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", placeId] });
    },
  });
}

/**
 * Hook: mark a review as helpful or not helpful.
 */
export function useReviewHelpful() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      type,
    }: {
      reviewId: string;
      type: "helpful" | "not-helpful";
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

/**
 * Hook: delete own review.
 */
export function useDeleteReview() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

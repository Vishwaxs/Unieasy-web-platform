import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  rating_count: number;
  phone: string | null;
  website: string | null;
  photo_refs: string[];
  extra: Record<string, any>;
  is_veg: boolean | null;
  price_inr: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  display_price_label: string | null;
  cuisine_tags: string[];
  amenities: string[];
  waiting_time_mins: number | null;
  noise_level: string | null;
  has_wifi: boolean | null;
  timing: string | null;
  distance_from_campus: string | null;
  crowd_level: string | null;
  business_status: string | null;
  is_open_now: boolean | null;
  verified: boolean;
  review_count: number;
  avg_review: number;
  like_count: number;
  dislike_count: number;
  bookmark_count: number;
  sentiment_love: number;
  sentiment_like: number;
  sentiment_neutral: number;
  sentiment_dislike: number;
  sentiment_terrible: number;
  data_source: string;
  created_at: string;
  updated_at: string;
}

export function usePlaceDetail(placeId: string | undefined) {
  return useQuery<PlaceDetail>({
    queryKey: ["place_detail", placeId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/places/${placeId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    },
    staleTime: 15 * 60 * 1000,
    enabled: !!placeId,
  });
}

export function placePhotoUrl(placeId: string, index = 0): string {
  return `${API_BASE}/api/places/${placeId}/photo/${index}`;
}

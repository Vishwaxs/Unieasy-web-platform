import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export interface ActiveAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_location: string | null;
}

export function useActiveAds() {
  return useQuery<ActiveAd[]>({
    queryKey: ["active_ads"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/ads/active`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function trackImpression(adId: string) {
  fetch(`${API_BASE}/api/ads/${adId}/impression`, { method: "PATCH" }).catch(
    () => {}
  );
}

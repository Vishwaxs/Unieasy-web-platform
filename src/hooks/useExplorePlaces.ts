import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface ExplorePlace {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  distance: string;
  timing: string;
  crowd: string;
  image: string;
  comment: string;
  lat?: number;
  lng?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Per-card fallback images (B4 fix)
const EXPLORE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
  "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400",
  "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400",
];

/**
 * Adapter: Map a Place record to the ExplorePlace shape expected by UI components.
 */
function placeToExplorePlace(place: Record<string, unknown>): ExplorePlace {
  let timing = (place.timing as string) || "";
  if (!timing) {
    const extra = (place.extra as Record<string, unknown>) || {};
    const openingHours = extra.opening_hours as Record<string, unknown> | undefined;
    timing = openingHours
      ? (openingHours.weekday_text as string[] || [])[0] || "Check online"
      : "Check online";
  }

  const photoRefs = normalizePhotoRefs(place.photo_refs);
  const hasPhoto = photoRefs.length > 0;
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % EXPLORE_FALLBACK_IMAGES.length;

  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };
  const crowd = (place.crowd_level as string) ? crowdLabels[(place.crowd_level as string)] || "Varies" : "Varies";
  const rawType = (place.sub_type as string) || (place.type as string) || "place";
  const dist = (place.distance_from_campus as string) || "";
  const address = (place.address as string) || null;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: dist ? `${dist} from campus` : shortAddress(address),
    timing,
    crowd,
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : EXPLORE_FALLBACK_IMAGES[fallbackIndex],
    comment: ((place.short_description as string) || "").trim(),
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchExplorePlaces(): Promise<ExplorePlace[]> {
  const res = await fetch(`${API_BASE}/api/places?category=hangout&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];

  const uniquePlaces = dedupePlaces(places as Record<string, unknown>[]);
  return dedupeExplorePlaces(uniquePlaces.map(placeToExplorePlace));
}

export function useExplorePlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["explore_places", "v2_unique"],
    queryFn: fetchExplorePlaces,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

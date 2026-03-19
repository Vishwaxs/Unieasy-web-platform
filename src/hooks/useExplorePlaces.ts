import { useQuery } from "@tanstack/react-query";

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

function getPhotoUrl(place: Record<string, unknown>, fallback: string): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const first = refs[0];
  const ref = first && typeof first === 'object' ? (first as Record<string, string>).ref : null;
  if (!ref) return fallback;
  return `${API_BASE}/api/places/photo?ref=${encodeURIComponent(ref)}&maxwidth=800`;
}

// Per-card fallback images
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
  // ── Opening hours / timing ──────────────────────────────────────────────
  const openingHours = (place.opening_hours as Record<string, unknown>) || {};
  const weekdayDescs = (openingHours.weekday_descriptions as string[]) || [];
  const timing = (place.timing as string) || weekdayDescs[0] || "Check online";

  // ── Photo URL ───────────────────────────────────────────────────────────
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % EXPLORE_FALLBACK_IMAGES.length;
  const image = getPhotoUrl(place, EXPLORE_FALLBACK_IMAGES[fallbackIndex]);

  // ── Crowd level ─────────────────────────────────────────────────────────
  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };
  const crowd = (place.crowd_level as string)
    ? crowdLabels[(place.crowd_level as string)] || "Varies"
    : "Varies";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: ((place.sub_type as string) || (place.type as string) || "place")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.distance_from_campus as string) || "Nearby",
    timing,
    crowd,
    image,
    comment: (place.description as string) || (place.address as string) || "",
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchExplorePlaces(): Promise<ExplorePlace[]> {
  // Fetch from two categories to get more results
  const [r1, r2] = await Promise.all([
    fetch(`${API_BASE}/api/places?category=hangout&limit=50`),
    fetch(`${API_BASE}/api/places?category=campus&is_on_campus=false&limit=20`),
  ]);

  if (!r1.ok) throw new Error(`HTTP ${r1.status}`);
  // r2 may 404 if the category doesn't exist; treat as empty
  const [j1, j2] = await Promise.all([
    r1.json(),
    r2.ok ? r2.json() : { data: [] },
  ]);

  const allPlaces = [...(j1.data || []), ...(j2.data || [])];

  // Deduplicate by id
  const seen = new Set<string>();
  const places = allPlaces.filter((p: Record<string, unknown>) => {
    const id = p.id as string;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return places.map(placeToExplorePlace);
}

export function useExplorePlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["explore_places"],
    queryFn: fetchExplorePlaces,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

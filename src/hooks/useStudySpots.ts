import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface StudySpot {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  distance: string;
  timing: string;
  noise: string;
  has_wifi: boolean;
  image: string;
  comment: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getPhotoUrl(place: Record<string, unknown>, fallback: string): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const placeId = typeof place.id === "string" ? place.id : null;
  if (!placeId || refs.length === 0) return fallback;
  return `${API_BASE}/api/places/${placeId}/photo/0`;
}

// Per-card fallback images (B4 fix)
const STUDY_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
  "https://images.unsplash.com/photo-1568667256549-094345857637?w=400",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=400",
];

function formatNoise(raw: string | null | undefined): string {
  const labels: Record<string, string> = { quiet: "Silent", moderate: "Medium", loud: "Loud" };
  return raw ? labels[raw] || "Varies" : "Varies";
}

/**
 * Adapter: Map a Place record to the StudySpot shape expected by UI components.
 */
function placeToStudySpot(place: Record<string, unknown>): StudySpot {
  let timing = (place.timing as string) || "";
  if (!timing) {
    const extra = (place.extra as Record<string, unknown>) || {};
    const openingHours = extra.opening_hours as Record<string, unknown> | undefined;
    timing = openingHours
      ? (openingHours.weekday_text as string[] || [])[0] || "Check online"
      : "Check online";
  }

  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % STUDY_FALLBACK_IMAGES.length;
  const rawType = (place.sub_type as string) || (place.type as string) || "library";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.distance_from_campus as string) || "Nearby campus",
    timing,
    noise: formatNoise(place.noise_level as string | null),
    has_wifi: typeof place.has_wifi === "boolean" ? place.has_wifi : true,
    image: getPhotoUrl(place, STUDY_FALLBACK_IMAGES[fallbackIndex]),
    comment: ((place.description as string) || (place.address as string) || "").trim(),
  };
}

async function fetchStudySpots(): Promise<StudySpot[]> {
  const res = await fetch(`${API_BASE}/api/places?category=study&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToStudySpot);
}

export function useStudySpots() {
  const { data, isLoading } = useQuery({
    queryKey: ["study_spots"],
    queryFn: fetchStudySpots,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface StudySpot {
  id: string;
  name: string;
  type: string[];
  rating: number;
  reviews: number;
  address: string | null;
  distance: string;
  timing: string;
  noise: string;
  has_wifi: boolean;
  image: string;
  comment: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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

// Keyword-based type detection. Each entry lists words that, if found anywhere
// in sub_type + type + name (case-insensitive), tag the place with that type.
// A place can match multiple types (e.g. "Library Cafe" → ["Library","Cafe"]).
const TYPE_KEYWORD_MAP: Array<{ keywords: string[]; type: string }> = [
  {
    keywords: ["library", "libraries"],
    type: "Library",
  },
  {
    keywords: ["cafe", "café", "coffee", "cafeteria", "canteen"],
    type: "Cafe",
  },
  {
    keywords: ["coworking", "co working", "cowork"],
    type: "Coworking",
  },
  {
    keywords: ["outdoor", "garden", "park", "courtyard", "terrace", "rooftop", "lawn"],
    type: "Outdoor",
  },
  // "Lab" is the catch-all for dedicated study spaces: labs, circles, lounges, etc.
  {
    keywords: [
      "lab", "laboratory",
      "circle", "center", "centre",
      "hall", "room", "zone",
      "lounge", "hub", "study",
    ],
    type: "Lab",
  },
];

/**
 * Scans sub_type, type, and name fields for type keywords.
 * Returns every matching canonical type (may be multiple).
 * Returns an empty array if nothing matches — caller should discard the place.
 */
function detectTypes(place: Record<string, unknown>): string[] {
  const raw = [place.sub_type, place.type, place.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ");

  const matched = new Set<string>();
  for (const { keywords, type } of TYPE_KEYWORD_MAP) {
    if (keywords.some((kw) => raw.includes(kw))) {
      matched.add(type);
    }
  }
  return Array.from(matched);
}

/**
 * Adapter: Map a Place record to the StudySpot shape expected by UI components.
 * Returns null if no study-relevant type can be detected (e.g. trading agencies).
 */
function placeToStudySpot(place: Record<string, unknown>): StudySpot | null {
  const types = detectTypes(place);
  if (types.length === 0) return null;

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

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: types,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    address: (place.address as string) || null,
    distance: (place.distance_from_campus as string) || "Nearby campus",
    timing,
    noise: formatNoise(place.noise_level as string | null),
    has_wifi: typeof place.has_wifi === "boolean" ? place.has_wifi : true,
    image: getPhotoUrl(place, STUDY_FALLBACK_IMAGES[fallbackIndex]),
    comment: ((place.description as string)
      || (place.has_wifi ? "WiFi available" : null)
      || "Study friendly space").trim(),
  };
}

async function fetchStudySpots(): Promise<StudySpot[]> {
  const res = await fetch(`${API_BASE}/api/places?category=study&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToStudySpot).filter((s): s is StudySpot => s !== null);
}

export function useStudySpots() {
  const { data, isLoading } = useQuery({
    queryKey: ["study_spots"],
    queryFn: fetchStudySpots,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

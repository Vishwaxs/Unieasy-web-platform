import { useQuery } from "@tanstack/react-query";

export interface ExplorePlace {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  address: string | null;
  distance: string;
  timing: string;
  openNow: boolean | null;
  crowd: string;
  image: string;
  comment: string;
  lat?: number;
  lng?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Type-aware fallback pools — keyed by keyword match
const EXPLORE_TYPE_IMAGES: Array<{ keywords: string[]; images: string[] }> = [
  {
    keywords: ["park", "garden", "botanical", "nature", "lake", "forest"],
    images: [
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400",
      "https://images.unsplash.com/photo-1568632234157-ce7b4619aadd?w=400",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400",
    ],
  },
  {
    keywords: ["cinema", "movie", "theatre", "theater", "multiplex", "pvr", "inox"],
    images: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400",
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400",
    ],
  },
  {
    keywords: ["mall", "shopping", "forum", "nexus", "market", "bazaar"],
    images: [
      "https://images.unsplash.com/photo-1555529771-7888783a18d3?w=400",
      "https://images.unsplash.com/photo-1519566335946-e6f65f0f4fdf?w=400",
      "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400",
    ],
  },
  {
    keywords: ["museum", "gallery", "art", "heritage", "palace", "fort", "monument"],
    images: [
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400",
      "https://images.unsplash.com/photo-1574182245530-967d9b3831af?w=400",
      "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?w=400",
    ],
  },
  {
    keywords: ["temple", "church", "mosque", "religious", "worship"],
    images: [
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=400",
      "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=400",
    ],
  },
  {
    keywords: ["cafe", "coffee", "bistro", "lounge", "restaurant"],
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400",
    ],
  },
];

const EXPLORE_DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
  "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400",
  "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=400",
];

function getExplorePhotoUrl(place: Record<string, unknown>): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const placeId = typeof place.id === "string" ? place.id : null;

  // API proxy — use when photo_refs are populated
  if (placeId && refs.length > 0) return `${API_BASE}/api/places/${placeId}/photo/0`;

  // primary_photo_url from DB
  if (typeof place.primary_photo_url === "string" && place.primary_photo_url)
    return place.primary_photo_url;

  // Type-aware fallback
  const searchStr = [
    (place.sub_type as string) || "",
    (place.type as string) || "",
    (place.name as string) || "",
  ]
    .join(" ")
    .toLowerCase();

  const idStr = (place.id as string) || "a";

  for (const rule of EXPLORE_TYPE_IMAGES) {
    if (rule.keywords.some((k) => searchStr.includes(k))) {
      const idx = idStr.charCodeAt(0) % rule.images.length;
      return rule.images[idx];
    }
  }

  const idx = idStr.charCodeAt(0) % EXPLORE_DEFAULT_IMAGES.length;
  return EXPLORE_DEFAULT_IMAGES[idx];
}

/**
 * Adapter: Map a Place record to the ExplorePlace shape expected by UI components.
 */
function placeToExplorePlace(place: Record<string, unknown>): ExplorePlace {
  // ── Opening hours — stored in extra.opening_hours ──────────────────────
  const extra = (place.extra as Record<string, unknown>) || {};
  const openingHours = (extra.opening_hours as Record<string, unknown>) || {};
  // Google weekdayDescriptions: index 0 = Monday … 6 = Sunday
  const weekdayDescs = Array.isArray(openingHours.weekdayDescriptions)
    ? (openingHours.weekdayDescriptions as string[])
    : [];
  const openNow =
    typeof openingHours.openNow === "boolean" ? openingHours.openNow : null;

  let timing: string;
  if (openNow !== null) {
    // Convert JS day (0=Sun) to Google weekdayDescriptions index (0=Mon)
    const dayIdx = (new Date().getDay() + 6) % 7;
    const todayLine = weekdayDescs[dayIdx] ?? "";
    // Each entry looks like "Monday: 6:00 AM – 8:00 PM"
    const todayHours = todayLine.includes(": ")
      ? todayLine.split(": ").slice(1).join(": ")
      : todayLine;
    timing = openNow
      ? todayHours
        ? `Open · ${todayHours}`
        : "Open Now"
      : "Closed Now";
  } else {
    timing =
      (place.timing as string) ||
      weekdayDescs[0] ||
      "Check Google for hours";
  }

  // ── Crowd level ─────────────────────────────────────────────────────────
  const crowdLabels: Record<string, string> = {
    low: "Low",
    moderate: "Medium",
    high: "High",
  };
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
    address: (place.address as string) || null,
    distance: (place.distance_from_campus as string) || "Nearby",
    timing,
    openNow,
    crowd,
    image: getExplorePhotoUrl(place),
    comment:
      (place.description as string) ||
      (place.timing as string) ||
      "Popular spot near campus",
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchExplorePlaces(): Promise<ExplorePlace[]> {
  const res = await fetch(`${API_BASE}/api/places?category=hangout&limit=100`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const allPlaces: Record<string, unknown>[] = json.data || [];

  // Deduplicate by id, then by normalised name (catches same place entered twice)
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const places = allPlaces.filter((p) => {
    const id = p.id as string;
    const name = ((p.name as string) || "").trim().toLowerCase();
    if (!id || seenIds.has(id)) return false;
    if (name && seenNames.has(name)) return false;
    seenIds.add(id);
    if (name) seenNames.add(name);
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

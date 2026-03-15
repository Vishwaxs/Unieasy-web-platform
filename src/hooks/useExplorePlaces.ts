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

const mockPlaces: ExplorePlace[] = [
  {
    id: "1",
    name: "Sunset Park",
    type: "Park",
    rating: 4.6,
    reviews: 234,
    distance: "1.2 km",
    timing: "6 AM - 9 PM",
    crowd: "Medium",
    image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400",
    comment: "Perfect for evening walks",
  },
  {
    id: "2",
    name: "Coffee Corner",
    type: "Cafe",
    rating: 4.8,
    reviews: 456,
    distance: "0.5 km",
    timing: "8 AM - 11 PM",
    crowd: "High",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
    comment: "Best coffee in town!",
  },
  {
    id: "3",
    name: "City Mall",
    type: "Mall",
    rating: 4.4,
    reviews: 789,
    distance: "2.5 km",
    timing: "10 AM - 10 PM",
    crowd: "High",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400",
    comment: "Everything under one roof",
  },
  {
    id: "4",
    name: "Lake View Point",
    type: "Scenic",
    rating: 4.9,
    reviews: 123,
    distance: "4.0 km",
    timing: "24/7",
    crowd: "Low",
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400",
    comment: "Breathtaking sunsets",
  },
  {
    id: "5",
    name: "Sports Complex",
    type: "Sports",
    rating: 4.5,
    reviews: 345,
    distance: "1.8 km",
    timing: "5 AM - 10 PM",
    crowd: "Medium",
    image: "https://images.unsplash.com/photo-1461896836934-0b05b?w=400",
    comment: "Great facilities",
  },
  {
    id: "6",
    name: "Art Gallery",
    type: "Culture",
    rating: 4.7,
    reviews: 89,
    distance: "3.2 km",
    timing: "10 AM - 6 PM",
    crowd: "Low",
    image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400",
    comment: "Inspiring exhibitions",
  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const EXPLORE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=400",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400",
  "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400",
];

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeText(value: unknown): string {
  return safeString(value).trim().toLowerCase();
}

function normalizePlaceName(value: unknown): string {
  const normalized = normalizeText(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

function normalizePhotoRefs(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFallbackImage(place: Record<string, unknown>): string {
  const seed = `${safeString(place.id)}|${safeString(place.name)}|${safeString(place.address)}`;
  const index = stableHash(seed) % EXPLORE_FALLBACK_IMAGES.length;
  return EXPLORE_FALLBACK_IMAGES[index];
}

function getDedupKey(place: Record<string, unknown>): string {
  const googleId = normalizeText(place.google_place_id);
  if (googleId) return `google:${googleId}`;

  const name = normalizePlaceName(place.name);
  if (name) return `name:${name}`;

  const address = normalizeText(place.address);
  return `address:${address}`;
}

function pickBetterPlace(
  current: Record<string, unknown>,
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  const currentPhotoCount = normalizePhotoRefs(current.photo_refs).length;
  const candidatePhotoCount = normalizePhotoRefs(candidate.photo_refs).length;

  if (candidatePhotoCount !== currentPhotoCount) {
    return candidatePhotoCount > currentPhotoCount ? candidate : current;
  }

  const currentReviews =
    typeof current.rating_count === "number" ? current.rating_count : 0;
  const candidateReviews =
    typeof candidate.rating_count === "number" ? candidate.rating_count : 0;

  return candidateReviews > currentReviews ? candidate : current;
}

function dedupePlaces(
  places: Record<string, unknown>[],
): Record<string, unknown>[] {
  const unique = new Map<string, Record<string, unknown>>();

  for (const place of places) {
    const key = getDedupKey(place);
    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, place);
      continue;
    }

    unique.set(key, pickBetterPlace(existing, place));
  }

  return Array.from(unique.values());
}

function dedupeExplorePlaces(items: ExplorePlace[]): ExplorePlace[] {
  const unique = new Map<string, ExplorePlace>();

  for (const item of items) {
    const key =
      normalizePlaceName(item.name) || normalizeText(item.distance) || item.id;
    const existing = unique.get(key);

    if (!existing) {
      unique.set(key, item);
      continue;
    }

    const existingHasProxyImage = existing.image.includes("/api/places/");
    const itemHasProxyImage = item.image.includes("/api/places/");

    if (itemHasProxyImage && !existingHasProxyImage) {
      unique.set(key, item);
      continue;
    }

    if (item.reviews > existing.reviews) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values());
}

/**
 * Adapter: Map a Place record to the ExplorePlace shape expected by UI components.
 */
function placeToExplorePlace(place: Record<string, unknown>): ExplorePlace {
  const extra = (place.extra as Record<string, unknown>) || {};
  const openingHours = extra.opening_hours as
    | Record<string, unknown>
    | undefined;
  const timing = openingHours
    ? ((openingHours.weekday_text as string[]) || [])[0] || "Check online"
    : "Check online";

  const photoRefs = normalizePhotoRefs(place.photo_refs);
  const hasPhoto = photoRefs.length > 0;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type:
      ((place.type as string) || "place").charAt(0).toUpperCase() +
      ((place.type as string) || "place").slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.address as string) || "Nearby",
    timing,
    crowd: "Varies",
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : getFallbackImage(place),
    comment: (place.address as string) || "",
  };
}

async function fetchExplorePlaces(): Promise<ExplorePlace[]> {
  try {
    const res = await fetch(`${API_BASE}/api/places?category=hangout&limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const places = json.data;
    if (!places || places.length === 0) {
      console.warn(
        "[useExplorePlaces] No places returned, using fallback mock data",
      );
      return mockPlaces;
    }

    const uniquePlaces = dedupePlaces(places as Record<string, unknown>[]);
    return dedupeExplorePlaces(uniquePlaces.map(placeToExplorePlace));
  } catch (err) {
    console.warn(
      "[useExplorePlaces] Backend fetch failed, using fallback mock data:",
      err,
    );
    return mockPlaces;
  }
}

export function useExplorePlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["explore_places", "v2_unique"],
    queryFn: fetchExplorePlaces,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockPlaces,
  });

  return { items: data ?? mockPlaces, loading: isLoading };
}

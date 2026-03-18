import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface EssentialItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  image: string;
  comment: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Essentials page shows items from multiple categories: services, health, fitness, safety, essentials
const ESSENTIALS_CATEGORIES = [
  "services",
  "health",
  "fitness",
  "safety",
  "essentials",
];

// Per-card fallback images (B4 fix)
const ESSENTIALS_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
  "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400",
  "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400",
];

/**
 * Adapter: Map a Place record to the EssentialItem shape expected by UI components.
 */
function placeToEssentialItem(place: Record<string, unknown>): EssentialItem {
  const photoRefs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const hasPhoto = photoRefs.length > 0;
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % ESSENTIALS_FALLBACK_IMAGES.length;
  const dist = (place.distance_from_campus as string) || "";
  const address = (place.address as string) || null;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    category: (place.category as string) || "essentials",
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: dist ? `${dist} from campus` : shortAddress(address),
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : ESSENTIALS_FALLBACK_IMAGES[fallbackIndex],
    comment: ((place.short_description as string) || "").trim(),
  };
}

async function fetchEssentials(): Promise<EssentialItem[]> {
  // Fetch from multiple categories in parallel
  const fetches = ESSENTIALS_CATEGORIES.map((cat) =>
    fetch(`${API_BASE}/api/places?category=${cat}&limit=20`).then((r) =>
      r.ok ? r.json() : { data: [] },
    ),
  );
  const results = await Promise.all(fetches);
  const allPlaces = results.flatMap((r) => r.data || []);

  if (allPlaces.length === 0) return [];

  return allPlaces.map(placeToEssentialItem);
}

export function useEssentials() {
  const { data, isLoading } = useQuery({
    queryKey: ["essentials"],
    queryFn: fetchEssentials,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

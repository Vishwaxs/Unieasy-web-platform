import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface FoodItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  display_price_label?: string;
  rating: number;
  reviews: number;
  is_veg: boolean | null;
  image: string;
  comment: string;
  cuisine_tags?: string[];
  lat?: number;
  lng?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getPhotoUrl(place: Record<string, unknown>, fallback: string): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const placeId = typeof place.id === "string" ? place.id : null;
  if (!placeId || refs.length === 0) return fallback;
  return `${API_BASE}/api/places/${placeId}/photo/0`;
}

// Category-specific fallback images so different cards show different images (B4 fix)
const FOOD_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
];

/** Map price_level (0-4) to approx INR — used only when price_inr is null */
function priceLevelToINR(level: number): number {
  const map: Record<number, number> = { 0: 50, 1: 150, 2: 350, 3: 800, 4: 2000 };
  return map[level] ?? 200;
}

/**
 * Adapter: Map a Place record from the unified places API to the FoodItem shape
 * expected by existing UI components.
 */
function placeToFoodItem(place: Record<string, unknown>): FoodItem {
  const dist = (place.distance_from_campus as string) || "";
  const locality = shortAddress((place.address as string) || null);

  // Deterministic per-card fallback using id
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % FOOD_FALLBACK_IMAGES.length;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    restaurant: dist ? `${dist} from campus` : locality,
    price: typeof place.price_inr === "number"
      ? place.price_inr
      : priceLevelToINR(typeof place.price_level === "number" ? place.price_level : 1),
    display_price_label: (place.display_price_label as string) || undefined,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    is_veg: typeof place.is_veg === "boolean" ? place.is_veg : null,
    cuisine_tags: Array.isArray(place.cuisine_tags) ? (place.cuisine_tags as string[]) : undefined,
    image: getPhotoUrl(place, FOOD_FALLBACK_IMAGES[fallbackIndex]),
    comment: ((place.description as string) || (place.address as string) || "").trim(),
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchFoodItems(): Promise<FoodItem[]> {
  const res = await fetch(`${API_BASE}/api/places?category=food&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToFoodItem);
}

export function useFoodItems() {
  const { data, isLoading } = useQuery({
    queryKey: ["food_items"],
    queryFn: fetchFoodItems,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

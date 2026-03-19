import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  price: number;
  display_price_label?: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string | null;
  amenities: string[];
  image: string;
  comment: string;
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

// Per-card fallback images
const ACCOMMODATION_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400",
];

/** Map price_level to monthly rent INR — used only when price_inr is null */
function priceLevelToRent(level: number): number {
  const map: Record<number, number> = { 0: 4000, 1: 7000, 2: 11000, 3: 16000, 4: 25000 };
  return map[level] ?? 8000;
}

/** Capitalize the first letter of a sub_type for display */
function formatSubType(raw: string): string {
  if (!raw) return "Hostel";
  const labels: Record<string, string> = {
    pg: "PG",
    apartment: "Apartment",
    hostel: "Hostel",
    coliving: "Co-living",
    lodging: "Hostel",
  };
  return labels[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Adapter: Map a Place record to the Accommodation shape expected by UI components.
 * Returns null for food-type places that are misclassified as accommodation.
 */
function placeToAccommodation(place: Record<string, unknown>): Accommodation | null {
  // ── Guard: skip food places misclassified as accommodation ──────────────
  const foodTypes = ['cafe', 'restaurant', 'fast_food', 'bakery', 'juice_bar'];
  const placeType = ((place.type as string) || '').toLowerCase();
  const placeSubType = ((place.sub_type as string) || '').toLowerCase();
  if (foodTypes.some(ft => placeType.includes(ft) || placeSubType.includes(ft))) {
    return null;
  }

  // ── Price: prefer DB values, fall back to price_level map ───────────────
  const priceLevel = typeof place.price_level === 'number' ? place.price_level : 1;
  const price =
    (typeof place.price_inr === 'number' && place.price_inr > 0 ? place.price_inr : null) ??
    (typeof place.price_range_min === 'number' && place.price_range_min > 0 ? place.price_range_min : null) ??
    priceLevelToRent(priceLevel);

  // ── Photo URL ───────────────────────────────────────────────────────────
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % ACCOMMODATION_FALLBACK_IMAGES.length;
  const image = getPhotoUrl(place, ACCOMMODATION_FALLBACK_IMAGES[fallbackIndex]);

  // ── Other fields ────────────────────────────────────────────────────────
  const subType = (place.sub_type as string) || (place.type as string) || "hostel";
  const fullAddress = (place.address as string) || null;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: formatSubType(subType),
    price,
    display_price_label: (place.display_price_label as string) || undefined,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.distance_from_campus as string) || "Nearby campus",
    address: fullAddress,
    amenities: Array.isArray(place.amenities) ? (place.amenities as string[]) : ["wifi"],
    image,
    comment: ((place.description as string)
      || `${subType} • ${(place.distance_from_campus as string) || "Near campus"}`).trim(),
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchAccommodations(): Promise<Accommodation[]> {
  const res = await fetch(
    `${API_BASE}/api/places?category=accommodation&limit=50`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToAccommodation).filter(Boolean) as Accommodation[];
}

export function useAccommodations() {
  const { data, isLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: fetchAccommodations,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

import { useQuery } from "@tanstack/react-query";

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  price: number;
  display_price_label?: string;
  rating: number;
  reviews: number;
  distance: string;
  amenities: string[];
  image: string;
  comment: string;
  lat?: number;
  lng?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Per-card fallback images (B4 fix)
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
  const map: Record<number, number> = { 0: 5000, 1: 7000, 2: 10000, 3: 15000, 4: 20000 };
  return map[level] ?? 10000;
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
 * B3 fix: use sub_type for PG/apartment/hostel/coliving instead of just type
 * B5 fix: prefer price_inr from DB over price_level mapping
 * B4 fix: deterministic per-card fallback images
 */
function placeToAccommodation(place: Record<string, unknown>): Accommodation {
  const photoRefs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const hasPhoto = photoRefs.length > 0;
  const address = (place.address as string) || "Nearby";
  const extra =
    typeof place.extra === "object" && place.extra !== null
      ? (place.extra as Record<string, unknown>)
      : null;
  const reviews =
    extra && Array.isArray(extra.reviews)
      ? (extra.reviews as Array<Record<string, unknown>>)
      : [];
  const firstReview = reviews.length > 0 ? reviews[0] : null;
  const reviewSnippet =
    firstReview && typeof firstReview.text === "string" ? firstReview.text : "";

  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % ACCOMMODATION_FALLBACK_IMAGES.length;

  // B3 fix: prefer sub_type over type for accommodation classification
  const subType = (place.sub_type as string) || (place.type as string) || "hostel";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: formatSubType(subType),
    // B5 fix: prefer actual price_inr from DB
    price: typeof place.price_inr === "number"
      ? place.price_inr
      : priceLevelToRent(typeof place.price_level === "number" ? place.price_level : 1),
    display_price_label: (place.display_price_label as string) || undefined,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.distance_from_campus as string) || (place.address as string) || "Nearby",
    amenities: Array.isArray(place.amenities) ? (place.amenities as string[]) : ["wifi"],
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : ACCOMMODATION_FALLBACK_IMAGES[fallbackIndex],
    comment: (place.address as string) || "",
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
  return places.map(placeToAccommodation);
}

export function useAccommodations() {
  const { data, isLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: fetchAccommodations,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

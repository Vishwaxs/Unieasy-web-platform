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

/**
 * Estimate monthly rent from Google signals.
 * Base ranges (Bangalore near-campus, per month):
 *   0 – ₹3K–₹5K  (very basic / free hostel)
 *   1 – ₹5K–₹9K  (budget hostel / PG)
 *   2 – ₹9K–₹15K (mid-range PG / shared apartment)
 *   3 – ₹15K–₹25K (good PG / 1BHK)
 *   4 – ₹25K–₹45K (premium apartment)
 * Adjusted by sub_type: PG slightly cheaper, apartment/flat higher.
 */
function estimateRent(
  priceLevel: number,
  subType: string,
): { midpoint: number; label: string } {
  const BASE: Record<number, [number, number]> = {
    0: [3000, 5000],
    1: [5000, 9000],
    2: [9000, 15000],
    3: [15000, 25000],
    4: [25000, 45000],
  };

  const t = subType.toLowerCase();
  const isHotel = t.includes("hotel") || t === "lodging" || t.includes("motel")
    || t.includes("guest_house") || t.includes("inn") || t.includes("bed_and_breakfast");

  // Hotels charge per night — use different base ranges and suffix
  if (isHotel) {
    const HOTEL_BASE: Record<number, [number, number]> = {
      0: [500, 1000],
      1: [1000, 2000],
      2: [2000, 4000],
      3: [4000, 8000],
      4: [8000, 20000],
    };
    let [hlo, hhi] = HOTEL_BASE[priceLevel] ?? [2000, 4000];
    hlo = Math.round(hlo / 500) * 500;
    hhi = Math.round(hhi / 500) * 500;
    const fmt = (v: number) =>
      v >= 1000 ? `₹${v / 1000 % 1 === 0 ? v / 1000 : (v / 1000).toFixed(1)}K` : `₹${v}`;
    const midpoint = Math.round((hlo + hhi) / 2);
    const label = hlo === hhi ? `${fmt(hlo)}/night` : `${fmt(hlo)}–${fmt(hhi)}/night`;
    return { midpoint, label };
  }

  let [lo, hi] = BASE[priceLevel] ?? [9000, 15000];

  if (t.includes("pg")) {
    lo = Math.round(lo * 0.85); hi = Math.round(hi * 0.85);
  } else if (t.includes("apartment") || t.includes("flat")) {
    lo = Math.round(lo * 1.25); hi = Math.round(hi * 1.25);
  } else if (t.includes("coliving") || t.includes("co-living")) {
    lo = Math.round(lo * 1.1); hi = Math.round(hi * 1.1);
  }

  // Round to nearest ₹500
  lo = Math.round(lo / 500) * 500;
  hi = Math.round(hi / 500) * 500;

  const fmt = (v: number) =>
    v >= 1000 ? `₹${v / 1000 % 1 === 0 ? v / 1000 : (v / 1000).toFixed(1)}K` : `₹${v}`;

  const midpoint = Math.round((lo + hi) / 2);
  const label = lo === hi ? `${fmt(lo)}/mo` : `${fmt(lo)}–${fmt(hi)}/mo`;
  return { midpoint, label };
}

/** Map raw DB/Google sub_type to a display label */
function formatSubType(raw: string): string {
  if (!raw) return "Hostel";
  const labels: Record<string, string> = {
    pg: "PG",
    apartment: "Apartment",
    flat: "Apartment",
    hostel: "Hostel",
    coliving: "Co-living",
    "co-living": "Co-living",
    co_living: "Co-living",
    "shared living": "Co-living",
    shared_living: "Co-living",
    // Google returns "lodging" as the generic type for hotels, motels, B&Bs
    lodging: "Hotel",
    hotel: "Hotel",
    motel: "Hotel",
    guest_house: "Hotel",
    inn: "Hotel",
    bed_and_breakfast: "Hotel",
    extended_stay_hotel: "Hotel",
    resort: "Hotel",
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

  // ── Price: always estimate from signals for uniform display ─────────────
  const priceLevel = typeof place.price_level === 'number' ? place.price_level : 1;
  const subType = (place.sub_type as string) || (place.type as string) || "hostel";
  const placeName = ((place.name as string) || "").toLowerCase();

  // Name is the strongest signal — use word boundaries to avoid substring false-positives
  // Brand names checked as substrings (safe — brand names won't appear in unrelated contexts)
  const HOTEL_BRANDS = [
    "mercure", "marriott", "hilton", "ibis", "novotel", "radisson", "hyatt",
    "taj hotel", "lemon tree", "treebo", "fabhotel", "oyo rooms",
    "marvella", "ramada", "sheraton", "westin", "courtyard",
  ];
  const isHotelBrand = HOTEL_BRANDS.some((b) => placeName.includes(b));

  const nameOverride =
    /\bhotel\b/i.test(placeName) || isHotelBrand ? "hotel" :
    /\bmotel\b/i.test(placeName) ? "motel" :
    /\bsuites?\b/i.test(placeName) ? "hotel" :
    /\bresort\b/i.test(placeName) ? "hotel" :
    /\binn\b/i.test(placeName) ? "inn" :
    /\bpg\b/i.test(placeName) ? "pg" :
    /\bco[\s-]?living\b/i.test(placeName) ? "coliving" :
    null;

  const resolvedSubType = nameOverride ?? subType;
  const est = estimateRent(priceLevel, resolvedSubType);
  const price = est.midpoint;
  const display_price_label = est.label;

  // ── Photo URL ───────────────────────────────────────────────────────────
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % ACCOMMODATION_FALLBACK_IMAGES.length;
  const image = getPhotoUrl(place, ACCOMMODATION_FALLBACK_IMAGES[fallbackIndex]);

  // ── Other fields ────────────────────────────────────────────────────────
  const fullAddress = (place.address as string) || null;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: formatSubType(resolvedSubType),
    price,
    display_price_label,
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

import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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

// Per-card fallback images (B4 fix)
const EXPLORE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
  "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400",
  "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400",
];

const filterMap: Record<string, string> = {
  "co-living": "co-living",
  coliving: "co-living",
  pg: "pg",
  hostel: "hostel",
  apartment: "flat",
  flat: "flat",
  hotel: "hotel",
  park: "park",
  mall: "mall",
  cafe: "cafe",
  restaurant: "restaurant",
  gym: "gym",
  library: "library",
};

/**
 * Adapter: Map a Place record to the ExplorePlace shape expected by UI components.
 */
function placeToExplorePlace(place: Record<string, unknown>): ExplorePlace {
  let timing = (place.timing as string) || "";
  if (!timing) {
    const extra = (place.extra as Record<string, unknown>) || {};
    const openingHours = extra.opening_hours as Record<string, unknown> | undefined;
    timing = openingHours
      ? (openingHours.weekday_text as string[] || [])[0] || "Check online"
      : "Check online";
  }

  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % EXPLORE_FALLBACK_IMAGES.length;

  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };
  const crowd = (place.crowd_level as string) ? crowdLabels[(place.crowd_level as string)] || "Varies" : "Varies";
  const rawType = (place.sub_type as string) || (place.type as string) || "place";
  const dist = (place.distance_from_campus as string) || "";
  const address = (place.address as string) || null;
  const primaryPhotoUrl = (place.primary_photo_url as string) || "";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: dist ? `${dist} from campus` : shortAddress(address),
    timing,
    crowd,
    image: primaryPhotoUrl || EXPLORE_FALLBACK_IMAGES[fallbackIndex],
    comment: ((place.short_description as string) || "").trim(),
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchExplorePlaces(params?: {
  category?: string;
  selectedType?: string;
  onCampus?: boolean;
}): Promise<ExplorePlace[]> {
  const category = params?.category ?? "hangout";
  const selectedType = (params?.selectedType ?? "all").toLowerCase();
  const onCampus = params?.onCampus ?? false;

  const selectCols =
    "id, name, category, type, sub_type, address, short_description, rating, rating_count, primary_photo_url, distance_from_campus, is_on_campus, crowd_level, timing, extra, lat, lng";

  let query = supabase.from("places").select(selectCols).eq("category", category).limit(60);

  if (onCampus) {
    query = query.eq("is_on_campus", true);
  }

  if (selectedType && selectedType !== "all") {
    const dbValue = filterMap[selectedType] || selectedType;
    query = query.or(`type.eq.${dbValue},sub_type.ilike.%${dbValue}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const id = (row.id as string) || "";
    if (!id) continue;
    deduped.set(id, row);
  }

  return Array.from(deduped.values()).map(placeToExplorePlace);
}

export function useExplorePlaces(params?: {
  category?: string;
  selectedType?: string;
  onCampus?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["explore_places", params?.category ?? "hangout", params?.selectedType ?? "all", params?.onCampus ?? false],
    queryFn: () => fetchExplorePlaces(params),
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

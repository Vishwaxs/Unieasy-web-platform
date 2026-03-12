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

// Per-card fallback images (B4 fix)
const EXPLORE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
  "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400",
  "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400",
];

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

  const photoRefs = normalizePhotoRefs(place.photo_refs);
  const hasPhoto = photoRefs.length > 0;
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % EXPLORE_FALLBACK_IMAGES.length;

  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };
  const crowd = (place.crowd_level as string) ? crowdLabels[(place.crowd_level as string)] || "Varies" : "Varies";
  const rawType = (place.sub_type as string) || (place.type as string) || "place";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.distance_from_campus as string) || (place.address as string) || "Nearby",
    timing,
    crowd,
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : EXPLORE_FALLBACK_IMAGES[fallbackIndex],
    comment: (place.address as string) || "",
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
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

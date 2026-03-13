import { useQuery } from "@tanstack/react-query";

export interface CampusPlace {
  id: string;
  name: string;
  type: string;
  subType: string;
  address: string;
  rating: number;
  ratingCount: number;
  image: string;
  timing: string;
  crowdLevel: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const CAMPUS_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
  "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400",
];

function placeToCampusPlace(place: Record<string, unknown>): CampusPlace {
  const photoRefs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const hasPhoto = photoRefs.length > 0;
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % CAMPUS_FALLBACK_IMAGES.length;

  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: (place.type as string) || "Shop",
    subType: (place.sub_type as string) || "",
    address: (place.address as string) || "",
    rating: typeof place.rating === "number" ? place.rating : 0,
    ratingCount: typeof place.rating_count === "number" ? place.rating_count : 0,
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : CAMPUS_FALLBACK_IMAGES[fallbackIndex],
    timing: (place.timing as string) || "Check on-site",
    crowdLevel: crowdLabels[(place.crowd_level as string)] || "Varies",
  };
}

async function fetchCampusPlaces(): Promise<CampusPlace[]> {
  const res = await fetch(`${API_BASE}/api/places?category=campus&is_on_campus=true&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToCampusPlace);
}

export function useCampusPlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["campus_places"],
    queryFn: fetchCampusPlaces,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

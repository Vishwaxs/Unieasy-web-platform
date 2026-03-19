import { useQuery } from "@tanstack/react-query";
import { getCampusImage } from "@/lib/campusData";

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

function placeToCampusPlace(place: Record<string, unknown>): CampusPlace {
  const photoRefs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const hasPhoto = photoRefs.length > 0;
  const name = (place.name as string) || "Unknown";
  const subType = (place.sub_type as string) || "";
  const crowdLabels: Record<string, string> = { low: "Low", moderate: "Medium", high: "High" };

  return {
    id: place.id as string,
    name,
    type: (place.type as string) || "Shop",
    subType,
    address: (place.address as string) || "",
    rating: typeof place.rating === "number" ? place.rating : 0,
    ratingCount: typeof place.rating_count === "number" ? place.rating_count : 0,
    // Prefer Google photo, then contextual name/subtype image
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : getCampusImage(name, subType),
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

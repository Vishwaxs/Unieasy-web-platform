import { useQuery } from "@tanstack/react-query";
import { getCampusImage, normalizeCampusName } from "@/lib/campusData";

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function parsePhotoRefs(value: unknown): unknown[] {
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

function isPrayerStylePlace(
  name: string,
  subType: string,
  type: string,
): boolean {
  const normalized =
    `${normalizeCampusName(name)} ${subType} ${type}`.toLowerCase();
  return /(chapel|prayer|prayer room|oratory|worship)/.test(normalized);
}

function deriveCampusType(
  name: string,
  rawType: string,
  subType: string,
): string {
  if (isPrayerStylePlace(name, subType, rawType)) {
    return "Services";
  }

  if (!rawType) return "Shop";
  const normalized = rawType.toLowerCase();
  if (normalized === "food") return "Food";
  if (normalized === "study") return "Study";
  if (normalized === "services") return "Services";
  if (normalized === "shop") return "Shop";
  return rawType;
}

function placeToCampusPlace(place: Record<string, unknown>): CampusPlace {
  const photoRefs = parsePhotoRefs(place.photo_refs);
  const hasPhoto = photoRefs.length > 0;
  const name = (place.name as string) || "Unknown";
  const subType = (place.sub_type as string) || "";
  const rawType = (place.type as string) || "";
  const type = deriveCampusType(name, rawType, subType);
  const crowdLabels: Record<string, string> = {
    low: "Low",
    moderate: "Medium",
    high: "High",
  };

  return {
    id: place.id as string,
    name,
    type,
    subType,
    address: (place.address as string) || "",
    rating: typeof place.rating === "number" ? place.rating : 0,
    ratingCount:
      typeof place.rating_count === "number" ? place.rating_count : 0,
    // Prefer Google photo, then contextual name/subtype image
    image: hasPhoto
      ? `${API_BASE}/api/places/${place.id}/photo/0`
      : getCampusImage(name, subType, type),
    timing: (place.timing as string) || "Check on-site",
    crowdLevel: crowdLabels[place.crowd_level as string] || "Varies",
  };
}

async function fetchCampusPlaces(): Promise<CampusPlace[]> {
  const res = await fetch(
    `${API_BASE}/api/places?category=campus&is_on_campus=true&limit=50`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToCampusPlace);
}

export function useCampusPlaces() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["campus_places"],
    queryFn: fetchCampusPlaces,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading, isError, error };
}

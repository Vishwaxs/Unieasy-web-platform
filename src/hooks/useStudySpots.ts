import { useQuery } from "@tanstack/react-query";

export interface StudySpot {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  distance: string;
  timing: string;
  noise: string;
  has_wifi: boolean;
  image: string;
  comment: string;
}

const mockStudySpots: StudySpot[] = [
  { id: "1", name: "Central Library", type: "Library", rating: 4.8, reviews: 456, distance: "0.2 km", timing: "8 AM - 10 PM", noise: "Silent", has_wifi: true, image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400", comment: "Best study spot on campus" },
  { id: "2", name: "Study Cafe", type: "Cafe", rating: 4.5, reviews: 234, distance: "0.8 km", timing: "7 AM - 11 PM", noise: "Low", has_wifi: true, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400", comment: "Great coffee while studying" },
  { id: "3", name: "Reading Room", type: "Library", rating: 4.7, reviews: 178, distance: "0.5 km", timing: "9 AM - 9 PM", noise: "Silent", has_wifi: true, image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=400", comment: "Peaceful atmosphere" },
  { id: "4", name: "Co-working Hub", type: "Coworking", rating: 4.4, reviews: 89, distance: "1.5 km", timing: "24/7", noise: "Medium", has_wifi: true, image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400", comment: "Modern facilities" },
  { id: "5", name: "Garden Study Area", type: "Outdoor", rating: 4.3, reviews: 67, distance: "0.3 km", timing: "6 AM - 8 PM", noise: "Low", has_wifi: false, image: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400", comment: "Fresh air while studying" },
  { id: "6", name: "Department Lab", type: "Lab", rating: 4.6, reviews: 145, distance: "0.1 km", timing: "9 AM - 6 PM", noise: "Low", has_wifi: true, image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400", comment: "Access to resources" },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Adapter: Map a Place record to the StudySpot shape expected by UI components.
 */
function placeToStudySpot(place: Record<string, unknown>): StudySpot {
  // Try to extract opening hours from extra field
  const extra = (place.extra as Record<string, unknown>) || {};
  const openingHours = extra.opening_hours as Record<string, unknown> | undefined;
  const timing = openingHours
    ? (openingHours.weekday_text as string[] || [])[0] || "Check online"
    : "Check online";

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: ((place.type as string) || "library").charAt(0).toUpperCase() + ((place.type as string) || "library").slice(1),
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.address as string) || "Nearby",
    timing,
    noise: "Varies",
    has_wifi: true,
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
    comment: (place.address as string) || "",
  };
}

async function fetchStudySpots(): Promise<StudySpot[]> {
  try {
    const res = await fetch(`${API_BASE}/api/places?category=study&limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const places = json.data;
    if (!places || places.length === 0) {
      console.warn("[useStudySpots] No places returned, using fallback mock data");
      return mockStudySpots;
    }
    return places.map(placeToStudySpot);
  } catch (err) {
    console.warn("[useStudySpots] Backend fetch failed, using fallback mock data:", err);
    return mockStudySpots;
  }
}

export function useStudySpots() {
  const { data, isLoading } = useQuery({
    queryKey: ["study_spots"],
    queryFn: fetchStudySpots,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockStudySpots,
  });

  return { items: data ?? mockStudySpots, loading: isLoading };
}

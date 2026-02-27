import { useQuery } from "@tanstack/react-query";

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  price: number;
  rating: number;
  reviews: number;
  distance: string;
  amenities: string[];
  image: string;
  comment: string;
}

const mockAccommodations: Accommodation[] = [
  { id: "1", name: "Sunrise Hostel", type: "Hostel", price: 8000, rating: 4.5, reviews: 89, distance: "0.5 km", amenities: ["wifi", "parking", "security"], image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400", comment: "Great community vibes!" },
  { id: "2", name: "Green Valley PG", type: "PG", price: 12000, rating: 4.7, reviews: 156, distance: "1.2 km", amenities: ["wifi", "meals", "laundry"], image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", comment: "Home-cooked meals included" },
  { id: "3", name: "Student Villa", type: "Apartment", price: 15000, rating: 4.3, reviews: 67, distance: "0.8 km", amenities: ["wifi", "gym", "parking"], image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", comment: "Modern amenities" },
  { id: "4", name: "Campus Lodge", type: "Hostel", price: 6500, rating: 4.2, reviews: 203, distance: "0.3 km", amenities: ["wifi", "security"], image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400", comment: "Walking distance to campus" },
  { id: "5", name: "Royal Residency", type: "PG", price: 18000, rating: 4.8, reviews: 45, distance: "2.0 km", amenities: ["wifi", "ac", "meals", "laundry"], image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400", comment: "Premium facilities" },
  { id: "6", name: "Budget Bunks", type: "Hostel", price: 5000, rating: 4.0, reviews: 312, distance: "1.5 km", amenities: ["wifi"], image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400", comment: "Affordable and clean" },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Adapter: Map a Place record to the Accommodation shape expected by UI components.
 */
function placeToAccommodation(place: Record<string, unknown>): Accommodation {
  const priceLevelMap: Record<number, number> = { 0: 5000, 1: 7000, 2: 10000, 3: 15000, 4: 20000 };
  const priceLevel = typeof place.price_level === "number" ? place.price_level : 1;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    type: ((place.type as string) || "hostel").charAt(0).toUpperCase() + ((place.type as string) || "hostel").slice(1),
    price: priceLevelMap[priceLevel] ?? 10000,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    distance: (place.address as string) || "Nearby",
    amenities: ["wifi"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
    comment: (place.address as string) || "",
  };
}

async function fetchAccommodations(): Promise<Accommodation[]> {
  try {
    const res = await fetch(`${API_BASE}/api/places?category=accommodation&limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const places = json.data;
    if (!places || places.length === 0) {
      console.warn("[useAccommodations] No places returned, using fallback mock data");
      return mockAccommodations;
    }
    return places.map(placeToAccommodation);
  } catch (err) {
    console.warn("[useAccommodations] Backend fetch failed, using fallback mock data:", err);
    return mockAccommodations;
  }
}

export function useAccommodations() {
  const { data, isLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: fetchAccommodations,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockAccommodations,
  });

  return { items: data ?? mockAccommodations, loading: isLoading };
}

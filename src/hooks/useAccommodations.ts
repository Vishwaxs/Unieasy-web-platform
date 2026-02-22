import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

async function fetchAccommodations(): Promise<Accommodation[]> {
  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .order("rating", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("[useAccommodations] Using fallback mock data:", error?.message);
    return mockAccommodations;
  }
  return data as Accommodation[];
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

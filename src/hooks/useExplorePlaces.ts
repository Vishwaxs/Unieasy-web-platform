import { useQuery } from "@tanstack/react-query";
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

const mockPlaces: ExplorePlace[] = [
  { id: "1", name: "Sunset Park", type: "Park", rating: 4.6, reviews: 234, distance: "1.2 km", timing: "6 AM - 9 PM", crowd: "Medium", image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400", comment: "Perfect for evening walks", lat: 12.9447, lng: 77.6109 },
  { id: "2", name: "Coffee Corner", type: "Cafe", rating: 4.8, reviews: 456, distance: "0.5 km", timing: "8 AM - 11 PM", crowd: "High", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400", comment: "Best coffee in town!", lat: 12.9348, lng: 77.6081 },
  { id: "3", name: "City Mall", type: "Mall", rating: 4.4, reviews: 789, distance: "2.5 km", timing: "10 AM - 10 PM", crowd: "High", image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400", comment: "Everything under one roof", lat: 12.9243, lng: 77.6116 },
  { id: "4", name: "Lake View Point", type: "Scenic", rating: 4.9, reviews: 123, distance: "4.0 km", timing: "24/7", crowd: "Low", image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400", comment: "Breathtaking sunsets", lat: 12.9502, lng: 77.5908 },
  { id: "5", name: "Sports Complex", type: "Sports", rating: 4.5, reviews: 345, distance: "1.8 km", timing: "5 AM - 10 PM", crowd: "Medium", image: "https://images.unsplash.com/photo-1461896836934-0b05b?w=400", comment: "Great facilities", lat: 12.9282, lng: 77.6226 },
  { id: "6", name: "Art Gallery", type: "Culture", rating: 4.7, reviews: 89, distance: "3.2 km", timing: "10 AM - 6 PM", crowd: "Low", image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400", comment: "Inspiring exhibitions", lat: 12.9198, lng: 77.6002 },
];

async function fetchExplorePlaces(): Promise<ExplorePlace[]> {
  const { data, error } = await supabase
    .from("explore_places")
    .select("*")
    .order("rating", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("[useExplorePlaces] Using fallback mock data:", error?.message);
    return mockPlaces;
  }
  return data as ExplorePlace[];
}

export function useExplorePlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["explore_places"],
    queryFn: fetchExplorePlaces,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockPlaces,
  });

  return { items: data ?? mockPlaces, loading: isLoading };
}

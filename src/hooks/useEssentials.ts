import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface EssentialItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  image: string;
  comment: string;
}

const mockItems: EssentialItem[] = [
  { id: "1", name: "Campus Gym", category: "essentials", rating: 4.5, reviews: 234, distance: "0.2 km", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400", comment: "Modern equipment, student rates" },
  { id: "2", name: "Quick Laundry", category: "essentials", rating: 4.3, reviews: 156, distance: "0.5 km", image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400", comment: "24/7 self-service laundry" },
  { id: "3", name: "Print & Copy Center", category: "essentials", rating: 4.6, reviews: 89, distance: "0.1 km", image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400", comment: "Cheap prints for students" },
  { id: "4", name: "Campus Security", category: "safety", rating: 4.8, reviews: 45, distance: "0 km", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400", comment: "24/7 emergency response" },
  { id: "5", name: "Health Center", category: "safety", rating: 4.7, reviews: 312, distance: "0.3 km", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400", comment: "Free consultations for students" },
  { id: "6", name: "Women's Safety Cell", category: "safety", rating: 4.9, reviews: 67, distance: "0.2 km", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400", comment: "Safe space and support" },
  { id: "7", name: "Tech Store", category: "discounts", rating: 4.4, reviews: 178, distance: "1.5 km", image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400", comment: "15% off with student ID" },
  { id: "8", name: "Movie Theater", category: "discounts", rating: 4.5, reviews: 456, distance: "2.0 km", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", comment: "Student Tuesday specials" },
  { id: "9", name: "Bookstore", category: "discounts", rating: 4.6, reviews: 234, distance: "0.8 km", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400", comment: "20% off textbooks" },
  { id: "10", name: "Student Union", category: "events", rating: 4.7, reviews: 567, distance: "0.1 km", image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400", comment: "Weekly events and meetups" },
  { id: "11", name: "Cultural Center", category: "events", rating: 4.5, reviews: 123, distance: "0.4 km", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", comment: "Festivals and celebrations" },
  { id: "12", name: "Sports Club", category: "events", rating: 4.6, reviews: 345, distance: "0.6 km", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400", comment: "Join teams and tournaments" },
  { id: "13", name: "Career Center", category: "career", rating: 4.8, reviews: 289, distance: "0.3 km", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400", comment: "Resume help and job fairs" },
  { id: "14", name: "Skill Workshop", category: "career", rating: 4.5, reviews: 167, distance: "0.5 km", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400", comment: "Free coding bootcamps" },
  { id: "15", name: "Mentorship Program", category: "career", rating: 4.9, reviews: 78, distance: "0.2 km", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400", comment: "Connect with alumni" },
];

async function fetchEssentials(): Promise<EssentialItem[]> {
  const { data, error } = await supabase
    .from("essentials")
    .select("*")
    .order("rating", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("[useEssentials] Using fallback mock data:", error?.message);
    return mockItems;
  }
  return data as EssentialItem[];
}

export function useEssentials() {
  const { data, isLoading } = useQuery({
    queryKey: ["essentials"],
    queryFn: fetchEssentials,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockItems,
  });

  return { items: data ?? mockItems, loading: isLoading };
}

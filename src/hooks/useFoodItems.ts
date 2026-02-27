import { useQuery } from "@tanstack/react-query";

export interface FoodItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  rating: number;
  reviews: number;
  is_veg: boolean;
  image: string;
  comment: string;
}

// Fallback mock data (used when backend is unavailable or returns empty)
const mockFoodItems: FoodItem[] = [
  { id: "1", name: "Margherita Pizza", restaurant: "Pizza Palace", price: 249, rating: 4.5, reviews: 128, is_veg: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400", comment: "Best cheese pizza in town!" },
  { id: "2", name: "Butter Chicken", restaurant: "Spice Garden", price: 320, rating: 4.8, reviews: 256, is_veg: false, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400", comment: "Creamy and flavorful" },
  { id: "3", name: "Paneer Tikka", restaurant: "Tandoor Express", price: 180, rating: 4.3, reviews: 89, is_veg: true, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400", comment: "Perfectly grilled!" },
  { id: "4", name: "Chicken Biryani", restaurant: "Biryani House", price: 280, rating: 4.7, reviews: 312, is_veg: false, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400", comment: "Authentic Hyderabadi taste" },
  { id: "5", name: "Masala Dosa", restaurant: "South Cafe", price: 120, rating: 4.4, reviews: 156, is_veg: true, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", comment: "Crispy and delicious" },
  { id: "6", name: "Fish Curry", restaurant: "Coastal Kitchen", price: 350, rating: 4.6, reviews: 98, is_veg: false, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400", comment: "Fresh catch daily" },
  { id: "7", name: "Veg Thali", restaurant: "Annapurna", price: 150, rating: 4.2, reviews: 203, is_veg: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400", comment: "Complete meal experience" },
  { id: "8", name: "Egg Fried Rice", restaurant: "Wok Station", price: 160, rating: 4.1, reviews: 145, is_veg: false, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", comment: "Quick and tasty" },
  { id: "9", name: "Chole Bhature", restaurant: "Punjab Dhaba", price: 130, rating: 4.5, reviews: 178, is_veg: true, image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", comment: "Authentic Punjabi flavors" },
  { id: "10", name: "Mutton Rogan Josh", restaurant: "Kashmir Flavors", price: 420, rating: 4.9, reviews: 87, is_veg: false, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=400", comment: "Rich and aromatic" },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Adapter: Map a Place record from the unified places API to the FoodItem shape
 * expected by existing UI components. No layout/component changes needed.
 */
function placeToFoodItem(place: Record<string, unknown>): FoodItem {
  // Map price_level (0-4) to an approximate INR price for display
  const priceLevelMap: Record<number, number> = { 0: 50, 1: 100, 2: 200, 3: 350, 4: 500 };
  const priceLevel = typeof place.price_level === "number" ? place.price_level : 1;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    restaurant: (place.address as string) || "",
    price: priceLevelMap[priceLevel] ?? 200,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    is_veg: true, // Default — Google Places doesn't provide veg/non-veg
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    comment: (place.address as string) || "",
  };
}

async function fetchFoodItems(): Promise<FoodItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/places?category=food&limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const places = json.data;
    if (!places || places.length === 0) {
      console.warn("[useFoodItems] No places returned, using fallback mock data");
      return mockFoodItems;
    }
    return places.map(placeToFoodItem);
  } catch (err) {
    console.warn("[useFoodItems] Backend fetch failed, using fallback mock data:", err);
    return mockFoodItems;
  }
}

export function useFoodItems() {
  const { data, isLoading } = useQuery({
    queryKey: ["food_items"],
    queryFn: fetchFoodItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: mockFoodItems,
  });

  return { items: data ?? mockFoodItems, loading: isLoading };
}

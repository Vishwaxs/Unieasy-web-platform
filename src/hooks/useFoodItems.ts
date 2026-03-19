import { useQuery } from "@tanstack/react-query";
import { shortAddress } from "@/lib/utils";

export interface FoodItem {
  id: string;
  name: string;
  restaurant: string;
  address: string | null;
  /** Estimated price for two (INR) — midpoint, used for sorting */
  price: number;
  /** Lower bound of the estimated price range — used for filter bucketing */
  price_lo: number;
  /** Human-readable price label, e.g. "₹300–₹500 for two" */
  display_price_label?: string;
  rating: number;
  reviews: number;
  is_veg: boolean | null;
  image: string;
  comment: string;
  cuisine_tags?: string[];
  lat?: number;
  lng?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getPhotoUrl(place: Record<string, unknown>, fallback: string): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const placeId = typeof place.id === "string" ? place.id : null;
  if (!placeId || refs.length === 0) return fallback;
  return `${API_BASE}/api/places/${placeId}/photo/0`;
}

// Category-specific fallback images so different cards show different images (B4 fix)
const FOOD_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
];

/**
 * Infer veg/non-veg status from place name, cuisine tags, and type.
 * Only used when the DB has no explicit value (is_veg === null).
 *
 * Non-veg signals take priority over veg signals.
 * Returns null when genuinely ambiguous (cafes, bakeries, multi-cuisine).
 */
export function inferIsVeg(
  name: string,
  cuisineTags: string[],
  type: string,
): boolean | null {
  const all = [name, ...cuisineTags, type].join(" ").toLowerCase();

  // Non-veg keywords (checked first — higher priority)
  const nonVegWords = [
    "chicken", "fish", "mutton", "meat", "prawn", "crab", "lamb", "beef",
    "pork", "seafood", "egg", "biryani", "kebab", "shawarma", "bbq",
    "non-veg", "nonveg", "kfc", "mcdonald", "burger king", "subway",
    "grills", "barbeque", "tandoori chicken",
  ];
  if (nonVegWords.some((w) => all.includes(w))) return false;

  // Veg keywords
  const vegWords = [
    "pure veg", "purely veg", "vegetarian", "veg restaurant", "veg cafe",
    "jain", "satvik", "udupi", "darshini", "satvic",
  ];
  if (vegWords.some((w) => all.includes(w))) return true;

  // "veg" standalone but not preceded by "non"
  if (/(?<!non[-\s]?)veg/i.test(all)) return true;

  return null; // Genuinely ambiguous — cafe, bakery, multi-cuisine, etc.
}

/**
 * Estimate realistic "price for two" (INR) from Google signals.
 *
 * Base ranges by price_level (Bangalore near-campus benchmarks):
 *   0 – Free
 *   1 – ₹100–₹250  (darshini, canteen, street food, chai stall)
 *   2 – ₹300–₹600  (casual dining, fast-food chains, small cafes)
 *   3 – ₹700–₹1,200 (proper restaurants, family dining)
 *   4 – ₹1,500–₹3,000 (upscale / fine dining)
 *
 * Signals that shift the estimate within the band:
 *   - place type: cafe/bakery → -10%; bar/lounge → +15%; fast_food → -10%
 *   - cuisine: south_indian/street_food → lower band;
 *              continental/japanese/italian/korean → upper band
 */
function estimatePriceForTwo(
  priceLevel: number,
  type: string,
  cuisineTags: string[],
): { midpoint: number; label: string; lo: number } {
  // price_level 0 means Google has no pricing data — treat as inexpensive
  const level = priceLevel === 0 ? 1 : priceLevel;

  // Base [low, high] for each level
  const BASE: Record<number, [number, number]> = {
    1: [100, 250],
    2: [300, 600],
    3: [700, 1200],
    4: [1500, 3000],
  };

  let [lo, hi] = BASE[level] ?? [300, 600];

  // ── Type-based shift ───────────────────────────────────────────────────────
  const t = type.toLowerCase();
  if (t.includes("cafe") || t.includes("bakery") || t.includes("coffee")) {
    lo = Math.round(lo * 0.85);
    hi = Math.round(hi * 0.85);
  } else if (t.includes("fast_food") || t.includes("snack")) {
    lo = Math.round(lo * 0.85);
    hi = Math.round(hi * 0.9);
  } else if (t.includes("bar") || t.includes("lounge") || t.includes("pub")) {
    lo = Math.round(lo * 1.15);
    hi = Math.round(hi * 1.2);
  }

  // ── Cuisine-based shift ────────────────────────────────────────────────────
  const tags = cuisineTags.map((c) => c.toLowerCase()).join(" ");

  const cheap = ["south indian", "darshini", "street food", "chaat", "udupi", "tiffin", "idli"];
  const pricey = ["continental", "japanese", "italian", "korean", "mediterranean", "sushi", "steak", "thai", "french"];

  const isCheap = cheap.some((c) => tags.includes(c));
  const isPricey = pricey.some((c) => tags.includes(c));

  if (isCheap) {
    lo = Math.round(lo * 0.8);
    hi = Math.round(hi * 0.85);
  } else if (isPricey) {
    lo = Math.round(lo * 1.1);
    hi = Math.round(hi * 1.15);
  }

  // Round to nearest ₹50 for cleaner display
  lo = Math.round(lo / 50) * 50;
  hi = Math.round(hi / 50) * 50;

  const midpoint = Math.round((lo + hi) / 2);
  const label = lo === hi ? `₹${lo} for two` : `₹${lo}–₹${hi} for two`;

  return { midpoint, label, lo };
}

/**
 * Adapter: Map a Place record from the unified places API to the FoodItem shape
 * expected by existing UI components.
 */
function placeToFoodItem(place: Record<string, unknown>): FoodItem {
  const dist = (place.distance_from_campus as string) || "";
  const locality = shortAddress((place.address as string) || null);

  // Deterministic per-card fallback using id
  const idStr = (place.id as string) || "a";
  const fallbackIndex = idStr.charCodeAt(0) % FOOD_FALLBACK_IMAGES.length;

  const priceLevel = typeof place.price_level === "number" ? place.price_level : 2;
  const type = (place.type as string) || (place.sub_type as string) || "";
  const cuisineTags = Array.isArray(place.cuisine_tags) ? (place.cuisine_tags as string[]) : [];

  // Always estimate from signals for uniform display across all cards
  const est = estimatePriceForTwo(priceLevel, type, cuisineTags);
  const price = est.midpoint;
  const display_price_label = est.label;

  return {
    id: place.id as string,
    name: (place.name as string) || "Unknown",
    restaurant: dist ? `${dist} from campus` : locality,
    address: (place.address as string) || null,
    price,
    price_lo: est.lo,
    display_price_label,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviews: typeof place.rating_count === "number" ? place.rating_count : 0,
    // Priority: explicit DB value → Google servesVegetarianFood → name/cuisine inference
    is_veg: typeof place.is_veg === "boolean"
      ? place.is_veg
      : (() => {
          const extra = (place.extra as Record<string, unknown>) || {};
          // Google tells us if the place serves vegetarian food.
          // false → definitely non-veg focus; true → veg-friendly (not necessarily veg-only,
          // so we still run the name inference to distinguish pure-veg from mixed).
          if (extra.serves_vegetarian_food === false) return false;
          return inferIsVeg(
            (place.name as string) || "",
            cuisineTags,
            type,
          );
        })(),
    cuisine_tags: cuisineTags,
    image: getPhotoUrl(place, FOOD_FALLBACK_IMAGES[fallbackIndex]),
    comment: ((place.description as string)
      || (cuisineTags.length > 0
          ? `${cuisineTags.slice(0, 2).join(" & ")} cuisine`
          : null)
      || (place.timing as string)
      || "Popular dining spot near campus").trim(),
    lat: typeof place.lat === "number" ? place.lat : undefined,
    lng: typeof place.lng === "number" ? place.lng : undefined,
  };
}

async function fetchFoodItems(): Promise<FoodItem[]> {
  const res = await fetch(`${API_BASE}/api/places?category=food&limit=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const places = json.data;
  if (!places || places.length === 0) return [];
  return places.map(placeToFoodItem);
}

export function useFoodItems() {
  const { data, isLoading } = useQuery({
    queryKey: ["food_items"],
    queryFn: fetchFoodItems,
    staleTime: 5 * 60 * 1000,
  });

  return { items: data ?? [], loading: isLoading };
}

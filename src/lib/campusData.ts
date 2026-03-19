/**
 * Static data for CHRIST University, Central Campus, Bangalore.
 *
 * Contextual images + food menus for the 10 known on-campus places.
 * All images are keyed by lowercase place name.
 */

// ─── Images ──────────────────────────────────────────────────────────────────

/** Per-place contextual images — matched by lowercase name. */
export const CAMPUS_PLACE_IMAGES: Record<string, string> = {
  // Food & Beverage
  "mingos":
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",      // warm café counter
  "michael":
    "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800",   // café interior
  "nandini":
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",   // Indian meal spread
  "fresteria":
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",   // fresh juices / healthy
  "kiosk":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",   // quick snack counter
  "justbake":
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",      // bakery / cakes
  "punjabi bites":
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",   // North Indian dishes

  // Shop & Services
  "stationery store":
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",   // stationery / notebooks
  "xerox & print center":
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",   // printing / documents

  // Study
  "christ central library":
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800",   // library shelves
};

/** Sub-type fallbacks for any future campus place without a name match. */
const CAMPUS_SUBTYPE_IMAGES: Record<string, string> = {
  "cafe":        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
  "snacks":      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  "cake shop":   "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
  "restaurant":  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
  "stationery":  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
  "print":       "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
  "library":     "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800",
};

const CAMPUS_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=800"; // university building

export function getCampusImage(
  name: string,
  subType?: string | null,
): string {
  return (
    CAMPUS_PLACE_IMAGES[name.toLowerCase().trim()] ??
    CAMPUS_SUBTYPE_IMAGES[(subType ?? "").toLowerCase().trim()] ??
    CAMPUS_DEFAULT_IMAGE
  );
}

// ─── Menus ───────────────────────────────────────────────────────────────────

export interface MenuItem {
  name: string;
  price?: string;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

/**
 * Static food menus for CHRIST University campus eateries.
 * Keyed by lowercase place name. Prices are approximate (typical Bangalore
 * college canteen rates) and may not reflect current pricing.
 */
export const CAMPUS_FOOD_MENUS: Record<string, MenuSection[]> = {
  mingos: [
    {
      section: "Beverages",
      items: [
        { name: "Tea",          price: "₹10" },
        { name: "Coffee",       price: "₹20" },
        { name: "Cold Coffee",  price: "₹40" },
        { name: "Lemonade",     price: "₹30" },
        { name: "Lassi",        price: "₹35" },
      ],
    },
    {
      section: "Snacks",
      items: [
        { name: "Veg Sandwich", price: "₹40" },
        { name: "Veg Burger",   price: "₹60" },
        { name: "Veg Roll",     price: "₹50" },
        { name: "Samosa",       price: "₹15" },
        { name: "Bread Omelette", price: "₹35" },
      ],
    },
  ],

  michael: [
    {
      section: "South Indian",
      items: [
        { name: "Masala Dosa",    price: "₹45" },
        { name: "Plain Dosa",     price: "₹35" },
        { name: "Idli (2 pcs)",   price: "₹30" },
        { name: "Medu Vada",      price: "₹25" },
        { name: "Upma",           price: "₹30" },
        { name: "Pongal",         price: "₹35" },
      ],
    },
    {
      section: "Beverages",
      items: [
        { name: "Tea",           price: "₹10" },
        { name: "Filter Coffee", price: "₹20" },
      ],
    },
  ],

  nandini: [
    {
      section: "Meals",
      items: [
        { name: "Full Veg Meals", price: "₹70" },
        { name: "Mini Meals",     price: "₹50" },
      ],
    },
    {
      section: "À la Carte",
      items: [
        { name: "Steamed Rice + Dal", price: "₹40" },
        { name: "Chapati (2 pcs)",    price: "₹20" },
        { name: "Rajma Chawal",       price: "₹50" },
        { name: "Mix Veg Curry",      price: "₹35" },
        { name: "Curd Rice",          price: "₹30" },
      ],
    },
  ],

  fresteria: [
    {
      section: "Fresh Juices",
      items: [
        { name: "Fresh Lime Water",  price: "₹25" },
        { name: "Watermelon Juice",  price: "₹35" },
        { name: "Pineapple Juice",   price: "₹40" },
        { name: "Mixed Fruit Juice", price: "₹50" },
        { name: "Mango Lassi",       price: "₹50" },
      ],
    },
    {
      section: "Light Bites",
      items: [
        { name: "Garden Sandwich",   price: "₹45" },
        { name: "Veggie Wrap",       price: "₹55" },
        { name: "Fruit Bowl",        price: "₹60" },
      ],
    },
  ],

  kiosk: [
    {
      section: "Packaged Snacks",
      items: [
        { name: "Chips",              price: "₹20" },
        { name: "Biscuits",           price: "₹10–₹30" },
        { name: "Chocolate Bar",      price: "₹20–₹50" },
        { name: "Namkeen",            price: "₹20" },
      ],
    },
    {
      section: "Drinks",
      items: [
        { name: "Mineral Water",      price: "₹20" },
        { name: "Cold Drink (can)",   price: "₹40" },
        { name: "Energy Drink",       price: "₹90" },
      ],
    },
  ],

  "justbake": [
    {
      section: "Baked Goods",
      items: [
        { name: "Chocolate Cake (slice)", price: "₹60" },
        { name: "Red Velvet Slice",       price: "₹70" },
        { name: "Brownie",                price: "₹50" },
        { name: "Croissant",              price: "₹45" },
        { name: "Muffin",                 price: "₹40" },
        { name: "Cookie",                 price: "₹20" },
      ],
    },
    {
      section: "Beverages",
      items: [
        { name: "Hot Chocolate", price: "₹60" },
        { name: "Latte",         price: "₹70" },
        { name: "Cappuccino",    price: "₹65" },
      ],
    },
  ],

  "punjabi bites": [
    {
      section: "Main Course",
      items: [
        { name: "Dal Makhani",            price: "₹60" },
        { name: "Paneer Butter Masala",   price: "₹80" },
        { name: "Chole",                  price: "₹55" },
        { name: "Aloo Jeera",             price: "₹45" },
        { name: "Rajma",                  price: "₹55" },
      ],
    },
    {
      section: "Breads",
      items: [
        { name: "Tandoori Roti",  price: "₹10" },
        { name: "Butter Naan",    price: "₹20" },
        { name: "Laccha Paratha", price: "₹30" },
      ],
    },
    {
      section: "Rice",
      items: [
        { name: "Steamed Rice",   price: "₹30" },
        { name: "Jeera Rice",     price: "₹40" },
        { name: "Veg Pulao",      price: "₹60" },
      ],
    },
  ],
};

/** Returns the menu for a given campus place name, or null if none exists. */
export function getCampusMenu(name: string): MenuSection[] | null {
  return CAMPUS_FOOD_MENUS[name.toLowerCase().trim()] ?? null;
}

// ─── Timings ─────────────────────────────────────────────────────────────────

/**
 * Static opening hours for all known CHRIST University campus places.
 * Used as a guaranteed fallback when the API doesn't return place.timing.
 * Matches the values seeded in 015_campus_places_seed.sql.
 */
export const CAMPUS_TIMINGS: Record<string, string> = {
  "mingos":                 "8:00 AM – 6:00 PM",
  "michael":                "8:00 AM – 5:30 PM",
  "nandini":                "7:30 AM – 6:00 PM",
  "fresteria":              "8:00 AM – 5:00 PM",
  "kiosk":                  "8:30 AM – 4:30 PM",
  "justbake":               "9:00 AM – 7:00 PM",
  "punjabi bites":          "11:00 AM – 3:00 PM",
  "stationery store":       "8:00 AM – 5:00 PM",
  "xerox & print center":   "8:00 AM – 6:00 PM",
  "christ central library": "8:00 AM – 8:00 PM",
};

/** Returns the timing for a campus place, from the API or the static map. */
export function getCampusTiming(
  name: string,
  apiTiming?: string | null,
): string | null {
  return apiTiming || CAMPUS_TIMINGS[name.toLowerCase().trim()] || null;
}

/** Returns true if a campus place type/sub_type is food-related. */
export function isCampusFoodPlace(
  type?: string | null,
  subType?: string | null,
): boolean {
  const FOOD_SUB_TYPES = new Set([
    "cafe", "snacks", "cake shop", "restaurant", "bakery", "canteen", "mess",
  ]);
  return (
    (type ?? "").toLowerCase() === "food" ||
    FOOD_SUB_TYPES.has((subType ?? "").toLowerCase())
  );
}

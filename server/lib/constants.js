// server/lib/constants.js
// TTL constants and category/type mapping for places API.

// ─── TTL Constants (in milliseconds) ────────────────────────────────────────
// These are named constants — never use magic numbers for TTL checks.

/** Name and address fields are considered stable; refresh only manually. */
export const NAME_ADDRESS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Rating refreshes every 6 hours for reasonably fresh data. */
export const RATING_TTL = 6 * 60 * 60 * 1000; // 6 hours

/** Opening hours change frequently; refresh every 15 minutes on detail view. */
export const OPENING_HOURS_TTL = 15 * 60 * 1000; // 15 minutes

/** Reviews refresh daily. */
export const REVIEWS_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Valid Categories ────────────────────────────────────────────────────────

export const VALID_CATEGORIES = [
    "food",
    "accommodation",
    "study",
    "health",
    "fitness",
    "services",
    "transport",
    "campus",
    "essentials",
    "hangout",
    "safety",
    "events",
    "marketplace",
];

// ─── Google Place Type → Category/Type Mapping ──────────────────────────────

export const GOOGLE_TYPE_MAP = {
    restaurant: { category: "food", type: "restaurant" },
    cafe: { category: "food", type: "cafe" },
    gym: { category: "fitness", type: "gym" },
    lodging: { category: "accommodation", type: "hostel" },
    library: { category: "study", type: "library" },
    laundry: { category: "services", type: "laundry" },
    pharmacy: { category: "health", type: "pharmacy" },
    store: { category: "services", type: "store" },
};

// ─── Google Place Details fields to request ─────────────────────────────────

export const DETAIL_FIELDS = [
    "rating",
    "user_ratings_total",
    "opening_hours",
    "business_status",
    "reviews",
    "photos",
];

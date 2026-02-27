// server/lib/constants.js
// TTL constants and category/type mapping for places API.

// ─── TTL Constants (in milliseconds) ────────────────────────────────────────
// These are named constants — never use magic numbers for TTL checks.

/** Name and address fields are considered stable; refresh only manually. */
export const NAME_ADDRESS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Rating refreshes every 24 hours — reduces API calls significantly. */
export const RATING_TTL = 24 * 60 * 60 * 1000; // 24 hours

/** Opening hours refresh every 2 hours — balances freshness vs API cost. */
export const OPENING_HOURS_TTL = 2 * 60 * 60 * 1000; // 2 hours

/** Reviews refresh weekly — rarely changes significantly. */
export const REVIEWS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Photo references are stable; refresh every 30 days. */
export const PHOTO_REFS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

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

// ─── Google Places API (New) — Field mask for Place Details ─────────────────
// Used by placesService.js for GET /v1/places/{id}

export const DETAIL_FIELD_MASK = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
    "currentOpeningHours",
    "businessStatus",
    "reviews",
    "photos",
    "internationalPhoneNumber",
    "websiteUri",
    "types",
    "priceLevel",
].join(",");

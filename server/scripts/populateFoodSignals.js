/**
 * server/scripts/populateFoodSignals.js
 *
 * One-shot script that populates price_inr and is_veg (where null) for all
 * food places using the same signal-based estimators as the frontend.
 *
 * Run: node server/scripts/populateFoodSignals.js
 *
 * What it does:
 *   - price_inr  → always overwritten with the estimated midpoint (for two / 2)
 *   - is_veg     → only filled in where the DB currently has NULL
 *   - display_price_label → always overwritten with the range label
 *
 * Safe to re-run. Manually curated is_veg values (true/false) are preserved.
 */

import "../loadEnv.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ─── Price estimator (mirrors src/hooks/useFoodItems.ts) ─────────────────────

const BASE_RANGES = {
  0: [0, 0],
  1: [100, 250],
  2: [300, 600],
  3: [700, 1200],
  4: [1500, 3000],
};

function estimatePriceForTwo(priceLevel, type, cuisineTags) {
  if (priceLevel === 0) return { midpoint: 0, label: "Free" };

  let [lo, hi] = BASE_RANGES[priceLevel] ?? [300, 600];
  const t = (type || "").toLowerCase();

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

  const tags = (cuisineTags || []).map((c) => c.toLowerCase()).join(" ");
  const cheap = [
    "south indian",
    "darshini",
    "street food",
    "chaat",
    "udupi",
    "tiffin",
    "idli",
  ];
  const pricey = [
    "continental",
    "japanese",
    "italian",
    "korean",
    "mediterranean",
    "sushi",
    "steak",
    "thai",
    "french",
  ];

  if (cheap.some((c) => tags.includes(c))) {
    lo = Math.round(lo * 0.8);
    hi = Math.round(hi * 0.85);
  } else if (pricey.some((c) => tags.includes(c))) {
    lo = Math.round(lo * 1.1);
    hi = Math.round(hi * 1.15);
  }

  lo = Math.round(lo / 50) * 50;
  hi = Math.round(hi / 50) * 50;

  const midpoint = Math.round((lo + hi) / 2);
  // price_inr stores per-person; divide midpoint by 2
  const perPerson = Math.round(midpoint / 2 / 50) * 50;
  const label = lo === hi ? `₹${lo} for two` : `₹${lo}–₹${hi} for two`;

  return { midpoint, perPerson, label };
}

// ─── Veg inferrer (mirrors src/hooks/useFoodItems.ts) ────────────────────────

const NON_VEG_WORDS = [
  "chicken",
  "fish",
  "mutton",
  "meat",
  "prawn",
  "crab",
  "lamb",
  "beef",
  "pork",
  "seafood",
  "egg",
  "biryani",
  "kebab",
  "shawarma",
  "bbq",
  "non-veg",
  "nonveg",
  "kfc",
  "mcdonald",
  "burger king",
  "subway",
  "grills",
  "barbeque",
  "tandoori chicken",
];

const VEG_WORDS = [
  "pure veg",
  "purely veg",
  "vegetarian",
  "veg restaurant",
  "veg cafe",
  "jain",
  "satvik",
  "udupi",
  "darshini",
  "satvic",
];

function inferIsVeg(name, cuisineTags, type) {
  const all = [name, ...(cuisineTags || []), type || ""]
    .join(" ")
    .toLowerCase();
  if (NON_VEG_WORDS.some((w) => all.includes(w))) return false;
  if (VEG_WORDS.some((w) => all.includes(w))) return true;
  if (/(?<!non[-\s]?)veg/i.test(all)) return true;
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching all food places...");

  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, type, sub_type, cuisine_tags, price_level, is_veg")
    .eq("category", "food");

  if (error) {
    console.error("Failed to fetch places:", error.message);
    process.exit(1);
  }

  console.log(`Found ${places.length} food places. Processing...`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const place of places) {
    const type = place.type || place.sub_type || "";
    const cuisineTags = place.cuisine_tags || [];
    const priceLevel =
      typeof place.price_level === "number" ? place.price_level : 2;

    const est = estimatePriceForTwo(priceLevel, type, cuisineTags);

    const patch = {
      // Store midpoint/2 as price_inr (per-person equivalent) so server-side
      // price filters remain sensible; display_price_label has the "for two" range
      price_inr: est.perPerson,
      display_price_label: est.label,
    };

    // Only fill in is_veg if the DB has NULL — never overwrite a curated value
    if (place.is_veg === null || place.is_veg === undefined) {
      const inferred = inferIsVeg(place.name, cuisineTags, type);
      if (inferred !== null) patch.is_veg = inferred;
    }

    const { error: updateError } = await supabase
      .from("places")
      .update(patch)
      .eq("id", place.id);

    if (updateError) {
      console.error(`  ✗ ${place.name} (${place.id}): ${updateError.message}`);
      errors++;
    } else {
      const vegLabel =
        patch.is_veg === true
          ? "veg"
          : patch.is_veg === false
            ? "non-veg"
            : "—";
      console.log(`  ✓ ${place.name}: ${est.label}  is_veg=${vegLabel}`);
      updated++;
    }
  }

  console.log(
    `\nDone. Updated: ${updated}  Skipped: ${skipped}  Errors: ${errors}`,
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

/**
 * server/scripts/populatePlaceDetails.js
 *
 * Triggers a live Google Places API fetch for all places that have a
 * google_place_id but haven't had their details populated yet (no photo_refs).
 *
 * Run: node server/scripts/populatePlaceDetails.js
 * Run specific categories: node server/scripts/populatePlaceDetails.js --category=hangout
 * Force-refetch all (ignore last_fetched_at): node server/scripts/populatePlaceDetails.js --force
 *
 * This is identical to what the detail endpoint does when a user visits a place
 * page for the first time — but run in bulk so the list pages show real photos
 * and opening hours immediately.
 *
 * Rate limiting: 300ms delay between requests (Google Places allows ~10 req/s,
 * but we stay conservative to avoid quota issues).
 */

import "../loadEnv.js";
import { createClient } from "@supabase/supabase-js";
import { fetchAndUpdatePlaceDetails } from "../lib/placesService.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DELAY_MS = 300;
const FORCE = process.argv.includes("--force");
const CATEGORY_ARG = process.argv.find((a) => a.startsWith("--category="));
const CATEGORY = CATEGORY_ARG ? CATEGORY_ARG.split("=")[1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== populatePlaceDetails ===");
  console.log(`Force: ${FORCE} | Category filter: ${CATEGORY || "all"}`);

  // Fetch places that need a live fetch
  let query = supabase
    .from("places")
    .select("*")
    .not("google_place_id", "is", null)
    .neq("data_source", "manual_skeleton");

  if (CATEGORY) {
    query = query.eq("category", CATEGORY);
  }

  if (!FORCE) {
    // Only places that have never had a live fetch (last_fetched_at is null)
    // photo_refs may be [] (empty array) rather than null, so checking
    // last_fetched_at is a more reliable indicator of "never fetched"
    query = query.is("last_fetched_at", null);
  }

  const { data: places, error } = await query;
  if (error) {
    console.error("Failed to fetch places:", error.message);
    process.exit(1);
  }

  console.log(`Found ${places.length} place(s) to fetch\n`);
  if (places.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    process.stdout.write(
      `[${i + 1}/${places.length}] ${place.name} (${place.category})... `,
    );

    const { liveFetch, liveFetchError } = await fetchAndUpdatePlaceDetails(
      supabase,
      place,
    );

    if (!liveFetch || liveFetchError) {
      console.log("✗ failed");
      failed++;
    } else {
      console.log("✓");
      succeeded++;
    }

    // Rate limit — don't hammer the Google API
    if (i < places.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone — ${succeeded} succeeded, ${failed} failed`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

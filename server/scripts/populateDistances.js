/**
 * server/scripts/populateDistances.js
 *
 * Computes and stores distance_from_campus for all places that have
 * lat/lng coordinates but no distance_from_campus value.
 *
 * Run: node server/scripts/populateDistances.js
 *
 * Safe to re-run — only updates rows where distance_from_campus IS NULL.
 * Pass --force to overwrite all rows.
 */

import "../loadEnv.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ─── Campus coordinates (Christ University, Hosur Road, Bengaluru) ───────────
const CAMPUS_LAT = 12.9348;
const CAMPUS_LNG = 77.6087;

// ─── Haversine formula — returns distance in km ───────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const FORCE = process.argv.includes("--force");

async function main() {
  console.log(`Mode: ${FORCE ? "force (overwrite all)" : "fill missing only"}`);
  console.log(`Campus: ${CAMPUS_LAT}, ${CAMPUS_LNG}`);

  // Fetch places with lat/lng
  let query = supabase
    .from("places")
    .select("id, name, category, lat, lng, distance_from_campus")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (!FORCE) {
    query = query.is("distance_from_campus", null);
  }

  const { data: places, error } = await query;
  if (error) {
    console.error("Failed to fetch places:", error.message);
    process.exit(1);
  }

  console.log(`Found ${places.length} places to update`);
  if (places.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const place of places) {
    const km = haversineKm(CAMPUS_LAT, CAMPUS_LNG, place.lat, place.lng);
    const distance = formatDistance(km);

    const { error: updateError } = await supabase
      .from("places")
      .update({ distance_from_campus: distance })
      .eq("id", place.id);

    if (updateError) {
      console.error(`  ✗ ${place.name} (${place.category}): ${updateError.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${place.name} (${place.category}): ${distance}`);
      updated++;
    }
  }

  console.log(`\nDone — ${updated} updated, ${failed} failed`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

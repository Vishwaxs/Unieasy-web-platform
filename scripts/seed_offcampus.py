#!/usr/bin/env python3
"""
seed_offcampus.py — Production-ready seeding script for UniEasy places table.

Fetches places from Google Places API (Nearby Search) and upserts them into
the Supabase `places` table. Designed to be idempotent and safe to re-run.

Usage:
    python scripts/seed_offcampus.py --dry-run --verbose
    python scripts/seed_offcampus.py --categories restaurant,cafe,gym --radius 2500
    python scripts/seed_offcampus.py --location "12.9345,77.6069" --radius 2000
"""

import argparse
import json
import logging
import os
import random
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import requests  # pyre-ignore[21]
from dotenv import load_dotenv  # pyre-ignore[21]
from supabase import create_client, Client  # pyre-ignore[21]

# ─── Constants ────────────────────────────────────────────────────────────────

DEFAULT_LAT = 12.9345
DEFAULT_LNG = 77.6069
DEFAULT_RADIUS = 2500
MAX_RADIUS = 5000
DEFAULT_CITY = "Bangalore"
DATA_SOURCE = "google_places_seed"

# ── Google Places API (New) ──────────────────────────────────────────────────
GOOGLE_NEARBY_SEARCH_URL = (
    "https://places.googleapis.com/v1/places:searchNearby"
)

# Fields to request from the API
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.businessStatus",
    "places.currentOpeningHours",
    "places.photos",
    "places.types",
])

# Google place type → (category, sub-type) mapping
GOOGLE_TYPE_MAP = {
    "restaurant": ("food", "restaurant"),
    "cafe": ("food", "cafe"),
    "gym": ("fitness", "gym"),
    "lodging": ("accommodation", "hostel"),
    "library": ("study", "library"),
    "laundry": ("services", "laundry"),
    "pharmacy": ("health", "pharmacy"),
    "store": ("services", "store"),
}

# Keywords for filtering "store" type to relevant sub-types only
STORE_FILTER_KEYWORDS = {"print", "xerox", "stationery", "courier", "copy", "stationary"}

# Keywords for lodging sub-type heuristic override
PG_KEYWORDS = {"pg", "paying guest", "p.g.", "paying-guest"}
FLAT_KEYWORDS = {"flat", "apartment", "rental", "rent"}
COLIVING_KEYWORDS = {"co-living", "coliving", "co living"}

# Retry / backoff settings
INITIAL_WAIT = 1.0
MAX_WAIT = 30.0
MAX_RETRIES = 3
OVER_QUERY_LIMIT_WAIT = 60

# ─── Logger setup ─────────────────────────────────────────────────────────────

logger = logging.getLogger("seed_offcampus")


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(fmt)
    logger.setLevel(level)
    logger.addHandler(handler)


# ─── Environment loading ─────────────────────────────────────────────────────

def load_env() -> tuple[str, str, str]:
    """Load required env vars from .env.local. Returns (api_key, sb_url, sb_key)."""
    # Look for .env.local in project root and server/ directory
    project_root = Path(__file__).resolve().parent.parent
    env_paths = [
        project_root / "server" / ".env.local",
        project_root / ".env.local",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            logger.debug(f"Loaded env from: {env_path}")
            break
    else:
        logger.warning("No .env.local found; relying on environment variables.")

    api_key: str | None = os.getenv("GOOGLE_PLACES_API_KEY")
    sb_url: str | None = os.getenv("SUPABASE_URL")
    sb_key: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    missing: list[str] = []
    if not api_key:
        missing.append("GOOGLE_PLACES_API_KEY")
    if not sb_url:
        missing.append("SUPABASE_URL")
    if not sb_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")

    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error(
            "Set them in server/.env.local or as environment variables. "
            "See README_EXECUTE.md for details."
        )
        sys.exit(1)

    # After the missing check + sys.exit, these are guaranteed non-None
    assert api_key is not None
    assert sb_url is not None
    assert sb_key is not None
    return api_key, sb_url, sb_key


# ─── Google Places API (New) ─────────────────────────────────────────────────

def fetch_with_backoff(api_key: str, body: dict) -> dict | None:
    """
    Make a Google Places API (New) POST request with exponential backoff + jitter.
    Returns parsed JSON or None on unrecoverable error.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    wait = INITIAL_WAIT

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                GOOGLE_NEARBY_SEARCH_URL,
                headers=headers,
                json=body,
                timeout=30,
            )

            # HTTP-level errors
            if resp.status_code == 429:
                logger.warning(
                    f"Rate limited (429) (attempt {attempt}/{MAX_RETRIES}). "
                    f"Waiting {OVER_QUERY_LIMIT_WAIT}s..."
                )
                time.sleep(OVER_QUERY_LIMIT_WAIT)
                continue

            if resp.status_code == 403:
                data = resp.json()
                logger.error(
                    f"Google API 403 Forbidden: {data.get('error', {}).get('message', 'No details')}. "
                    "Check your GOOGLE_PLACES_API_KEY and enabled APIs."
                )
                sys.exit(2)

            if resp.status_code >= 400:
                data = resp.json()
                error_msg = data.get("error", {}).get("message", resp.text[:200])
                logger.warning(f"HTTP {resp.status_code}: {error_msg} (attempt {attempt})")
                if resp.status_code >= 500:
                    # Server error — retry
                    pass
                else:
                    # Client error — don't retry
                    return None
            else:
                # Success
                return resp.json()

        except requests.exceptions.RequestException as e:
            logger.warning(f"Request error (attempt {attempt}): {e}")

        # Exponential backoff with jitter
        jitter = random.uniform(0, wait * 0.5)
        sleep_time = min(wait + jitter, MAX_WAIT)
        logger.debug(f"Backing off {sleep_time:.1f}s before retry...")
        time.sleep(sleep_time)
        wait *= 2

    logger.error(f"Max retries ({MAX_RETRIES}) exhausted for request.")
    return None


def fetch_nearby_places(
    api_key: str, place_type: str, lat: float, lng: float, radius: int
) -> list[dict]:
    """
    Fetch nearby places using Google Places API (New) — searchNearby.
    The new API uses POST with JSON body. Max 20 results per call (no pagination token).
    """
    body = {
        "includedTypes": [place_type],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lng,
                },
                "radius": float(radius),
            }
        },
    }

    logger.debug(f"Fetching {place_type} (max 20 results)...")
    data = fetch_with_backoff(api_key, body)

    if data is None:
        return []

    results = data.get("places", [])
    logger.debug(f"Got {len(results)} results for {place_type}")
    return results


# ─── Data mapping ─────────────────────────────────────────────────────────────

def infer_lodging_subtype(name: str) -> str:
    """Attempt to override the default 'hostel' type for lodging based on name."""
    name_lower = name.lower()
    for kw in PG_KEYWORDS:
        if kw in name_lower:
            return "pg"
    for kw in FLAT_KEYWORDS:
        if kw in name_lower:
            return "flat"
    for kw in COLIVING_KEYWORDS:
        if kw in name_lower:
            return "co-living"
    return "hostel"


def should_include_store(name: str) -> bool:
    """Filter store results to only include printing/stationery/courier stores."""
    name_lower = name.lower()
    return any(kw in name_lower for kw in STORE_FILTER_KEYWORDS)


def map_place_to_record(place: dict, google_type: str) -> dict | None:
    """
    Map a Google Places API (New) result to a places table record.
    Returns None if the place should be skipped.

    New API field names:
      displayName.text  → name
      id                → google_place_id (resource name, e.g. "places/ChIJ...")
      formattedAddress  → address
      location          → {latitude, longitude}
      rating            → rating
      userRatingCount   → rating_count
      priceLevel        → price_level (enum string → int)
      businessStatus    → business_status
      currentOpeningHours → opening_hours
      photos[].name     → photo resource name
      types             → google types
    """
    category, sub_type = GOOGLE_TYPE_MAP[google_type]

    # Extract display name
    display_name_obj = place.get("displayName", {})
    name = display_name_obj.get("text", "Unknown") if isinstance(display_name_obj, dict) else "Unknown"

    # Special filtering for stores
    if google_type == "store":
        if not should_include_store(name):
            return None

    # Override lodging sub-type based on name heuristics
    if google_type == "lodging":
        sub_type = infer_lodging_subtype(name)

    # Extract google_place_id — new API returns "places/ChIJ..." format
    raw_id = place.get("id", "")
    google_place_id = raw_id  # Already in the right format for the new API

    # Extract photo resource names (new API uses "name" field, not "photo_reference")
    photos = place.get("photos", [])
    photo_refs = [p.get("name", "") for p in photos if p.get("name")]

    # Extract location (new API uses location.latitude / location.longitude)
    location = place.get("location", {})
    lat = location.get("latitude")
    lng = location.get("longitude")

    if lat is None or lng is None:
        logger.warning(f"Skipping place '{name}' — missing lat/lng.")
        return None

    # Map priceLevel enum string to integer
    price_level_map = {
        "PRICE_LEVEL_FREE": 0,
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }
    raw_price = place.get("priceLevel")
    price_level = price_level_map.get(raw_price) if isinstance(raw_price, str) else raw_price

    # Build extra JSONB with fields not mapped to named columns
    opening_hours = place.get("currentOpeningHours", {})
    extra = {
        "business_status": place.get("businessStatus"),
        "open_now": opening_hours.get("openNow") if isinstance(opening_hours, dict) else None,
        "google_types": place.get("types", []),
    }

    now_utc = datetime.now(timezone.utc).isoformat()

    return {
        "name": name,
        "google_place_id": google_place_id,
        "category": category,
        "type": sub_type,
        "address": place.get("formattedAddress"),
        "city": DEFAULT_CITY,
        "lat": lat,
        "lng": lng,
        "phone": None,  # Not available from searchNearby
        "website": None,  # Not available from searchNearby
        "is_on_campus": False,
        "is_static": True,
        "is_manual_override": False,
        "data_source": DATA_SOURCE,
        "last_fetched_at": now_utc,
        "rating": place.get("rating"),
        "rating_count": place.get("userRatingCount"),
        "price_level": price_level,
        "photo_refs": photo_refs,
        "extra": extra,
        "updated_at": now_utc,
    }


# ─── Supabase operations ─────────────────────────────────────────────────────

def check_manual_override(supabase: Client, google_place_id: str) -> bool:
    """Check if a record exists with is_on_campus=true AND is_manual_override=true."""
    try:
        result = (
            supabase.table("places")
            .select("id, name, is_on_campus, is_manual_override")
            .eq("google_place_id", google_place_id)
            .eq("is_on_campus", True)
            .eq("is_manual_override", True)
            .execute()
        )
        return len(result.data) > 0
    except Exception as e:
        logger.warning(f"Error checking manual override for {google_place_id}: {e}")
        return False


def upsert_place(supabase: Client, record: dict, dry_run: bool) -> str:
    """
    Upsert a single place record. Returns 'inserted', 'updated', 'skipped', or 'error'.
    """
    google_place_id: str = str(record.get("google_place_id", ""))

    # Check for manual override protection
    if check_manual_override(supabase, google_place_id):
        logger.warning(
            f"SKIP (manual_override): '{record['name']}' ({google_place_id}) — "
            "is_on_campus=true AND is_manual_override=true."
        )
        return "skipped"

    if dry_run:
        # Check if record already exists to determine action
        try:
            existing = (
                supabase.table("places")
                .select("id")
                .eq("google_place_id", google_place_id)
                .execute()
            )
            action = "update" if existing.data else "insert"
        except Exception:
            action = "insert"

        print(
            json.dumps(
                {
                    "google_place_id": google_place_id,
                    "name": record["name"],
                    "category": record["category"],
                    "type": record["type"],
                    "lat": record["lat"],
                    "lng": record["lng"],
                    "action": action,
                },
                ensure_ascii=False,
            )
        )
        return action + "d"  # 'inserted' or 'updated' for counting

    try:
        # Upsert with conflict on google_place_id
        # On conflict, update only the allowed fields
        result = (
            supabase.table("places")
            .upsert(
                record,
                on_conflict="google_place_id",
                # These columns are updated on conflict:
                # name, address, lat, lng, rating, rating_count, price_level,
                # photo_refs, extra, last_fetched_at, updated_at
                # id, is_on_campus (if manual_override), is_static, created_at are NOT updated
            )
            .execute()
        )

        if result.data:
            logger.info(f"UPSERT: '{record['name']}' ({google_place_id}) → {record['category']}/{record['type']}")
            return "upserted"
        else:
            logger.warning(f"Upsert returned no data for '{record['name']}'")
            return "error"

    except Exception as e:
        logger.error(f"Supabase error for '{record['name']}' ({google_place_id}): {e}")
        return "error"


# ─── Main logic ───────────────────────────────────────────────────────────────

def run(args: argparse.Namespace) -> None:
    setup_logging(args.verbose)
    logger.info("=" * 60)
    logger.info("UniEasy Off-Campus Seeder")
    logger.info("=" * 60)

    # Load environment
    api_key, sb_url, sb_key = load_env()

    # Parse location
    try:
        lat_str, lng_str = args.location.split(",")
        lat = float(lat_str.strip())
        lng = float(lng_str.strip())
    except (ValueError, AttributeError):
        logger.error(f"Invalid --location format: '{args.location}'. Use 'lat,lng'.")
        sys.exit(1)

    # Validate radius
    radius = min(args.radius, MAX_RADIUS)
    if args.radius > MAX_RADIUS:
        logger.warning(f"Radius clamped to maximum: {MAX_RADIUS}m (requested: {args.radius}m)")

    # Parse categories
    if args.categories:
        categories = [c.strip() for c in args.categories.split(",")]
        invalid = [c for c in categories if c not in GOOGLE_TYPE_MAP]
        if invalid:
            logger.error(
                f"Invalid Google place types: {invalid}. "
                f"Valid types: {list(GOOGLE_TYPE_MAP.keys())}"
            )
            sys.exit(1)
    else:
        categories = list(GOOGLE_TYPE_MAP.keys())

    logger.info(f"Center: ({lat}, {lng}), Radius: {radius}m")
    logger.info(f"Google types: {categories}")
    logger.info(f"Dry run: {args.dry_run}")

    # Initialize Supabase client
    try:
        supabase: Client = create_client(sb_url, sb_key)
        # Test connection
        if not args.dry_run:
            supabase.table("places").select("id").limit(1).execute()
            logger.info("Supabase connection verified.")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        sys.exit(3)

    # Counters
    total_fetched: int = 0
    total_inserted: int = 0
    total_updated: int = 0
    total_skipped: int = 0
    total_errors: int = 0

    # Iterate over each Google place type
    for google_type in categories:
        logger.info(f"\n--- Fetching type: {google_type} ---")
        places = fetch_nearby_places(api_key, google_type, lat, lng, radius)
        logger.info(f"Found {len(places)} places for type '{google_type}'")
        total_fetched += len(places)

        for place in places:
            record = map_place_to_record(place, google_type)
            if record is None:
                logger.debug(f"Filtered out: {place.get('name', 'Unknown')}")
                continue

            result = upsert_place(supabase, record, args.dry_run)

            if result == "inserted":
                total_inserted += 1
            elif result == "updated":
                total_updated += 1
            elif result == "upserted":
                # We can't distinguish insert vs update from Supabase upsert response
                total_inserted += 1
            elif result == "skipped":
                total_skipped += 1
            elif result == "error":
                total_errors += 1

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("SEED SUMMARY")
    logger.info("=" * 60)
    logger.info(f"  Total places fetched:  {total_fetched}")
    logger.info(f"  Total inserted:        {total_inserted}")
    logger.info(f"  Total updated:         {total_updated}")
    logger.info(f"  Total skipped (override): {total_skipped}")
    logger.info(f"  Total errors:          {total_errors}")
    logger.info("=" * 60)

    if args.dry_run:
        logger.info("DRY RUN — no records were written to the database.")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed Supabase places table from Google Places API (Nearby Search).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run (preview all upserts as JSON, no DB writes)
  python scripts/seed_offcampus.py --dry-run --verbose

  # Seed MVP categories only
  python scripts/seed_offcampus.py --categories restaurant,cafe,gym,lodging,library,laundry

  # Seed with custom center point and radius
  python scripts/seed_offcampus.py --location "12.9345,77.6069" --radius 2000 --categories restaurant,cafe
        """,
    )

    parser.add_argument(
        "--radius",
        type=int,
        default=DEFAULT_RADIUS,
        help=f"Search radius in metres. Default: {DEFAULT_RADIUS}. Max: {MAX_RADIUS}.",
    )
    parser.add_argument(
        "--location",
        type=str,
        default=f"{DEFAULT_LAT},{DEFAULT_LNG}",
        help=f'Center point as "lat,lng". Default: "{DEFAULT_LAT},{DEFAULT_LNG}".',
    )
    parser.add_argument(
        "--categories",
        type=str,
        default=None,
        help=(
            "Comma-separated list of Google place types to seed. "
            f"Default: all ({','.join(GOOGLE_TYPE_MAP.keys())}). "
            "Example: --categories restaurant,cafe,gym"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Print intended DB upserts as JSON; do not write to DB.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        default=False,
        help="Set log level to DEBUG for detailed output.",
    )

    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()

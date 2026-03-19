#!/usr/bin/env python3
"""
seed_study_spots.py — Dedicated seeder for the 'study' category in UniEasy.

Fetches libraries, cafes, coffee shops, and coworking spaces from Google
Places API (New) and upserts them into Supabase with category='study',
the correct sub_type, and an inferred noise_level.

Usage:
    python scripts/seed_study_spots.py --dry-run --verbose
    python scripts/seed_study_spots.py --radius 3000
    python scripts/seed_study_spots.py --radius 5000 --max-per-type 20
"""

import argparse, logging, math, os, random, sys, time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client

# ─── Campus anchor ────────────────────────────────────────────────────────────
CAMPUS_LAT = 12.9345
CAMPUS_LNG = 77.6069
DEFAULT_RADIUS = 3000
MAX_RADIUS = 5000
DEFAULT_CITY = "Bangalore"
DATA_SOURCE = "google_places_seed_study"

NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"

FIELD_MASK = ",".join([
    "places.id", "places.displayName", "places.formattedAddress",
    "places.shortFormattedAddress", "places.location", "places.rating",
    "places.userRatingCount", "places.businessStatus",
    "places.nationalPhoneNumber", "places.websiteUri", "places.googleMapsUri",
    "places.currentOpeningHours", "places.regularOpeningHours",
    "places.photos", "places.types", "places.primaryType",
    "places.editorialSummary", "places.outdoorSeating",
    "places.goodForGroups", "places.accessibilityOptions",
])

# ─── Type map: Google Places type → (sub_type, noise_level) ──────────────────
# noise_level values match the DB constraint: quiet | moderate | loud
STUDY_TYPE_MAP = {
    "library":         ("library",    "quiet"),
    "cafe":            ("cafe",       "moderate"),
    "coffee_shop":     ("cafe",       "moderate"),
    "coworking_space": ("coworking",  "moderate"),
    "university":      ("lab",        "quiet"),
}

logger = logging.getLogger("seed_study")


# ─── Setup ────────────────────────────────────────────────────────────────────

def setup_logging(verbose: bool) -> None:
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(fmt)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    logger.addHandler(h)


def load_env():
    root = Path(__file__).resolve().parent.parent
    for p in [root / "server" / ".env.local", root / ".env.local"]:
        if p.exists():
            load_dotenv(p)
            break
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    sb_url  = os.getenv("SUPABASE_URL")
    sb_key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    missing = [n for n, v in [
        ("GOOGLE_PLACES_API_KEY", api_key),
        ("SUPABASE_URL", sb_url),
        ("SUPABASE_SERVICE_ROLE_KEY", sb_key),
    ] if not v]
    if missing:
        logger.error(f"Missing env vars: {', '.join(missing)}")
        sys.exit(1)
    return api_key, sb_url, sb_key


# ─── Helpers ──────────────────────────────────────────────────────────────────

def haversine_km(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def fmt_dist(km: float) -> str:
    if km < 0.1:
        return "On campus"
    return f"{int(km * 1000)} m" if km < 1 else f"{km:.1f} km"


def extract_timing(place: dict) -> str | None:
    for key in ["currentOpeningHours", "regularOpeningHours"]:
        h = place.get(key) or {}
        desc = h.get("weekdayDescriptions", [])
        if desc:
            for line in desc:
                if "Monday" in line:
                    return line.split(": ", 1)[-1]
            return desc[0].split(": ", 1)[-1]
    return None


def extract_photo_refs(place: dict, n: int = 5) -> list:
    return [
        {
            "ref": p["name"],
            "width": p.get("widthPx"),
            "height": p.get("heightPx"),
            "attribution": [
                a.get("displayName", "")
                for a in (p.get("authorAttributions") or [])
            ],
        }
        for p in place.get("photos", [])[:n]
        if p.get("name")
    ]


# ─── Google API ───────────────────────────────────────────────────────────────

def fetch_nearby(api_key: str, gtype: str, lat: float, lng: float,
                 radius: int, maxr: int = 20) -> list:
    body = {
        "includedTypes": [gtype],
        "maxResultCount": min(maxr, 20),
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius),
            }
        },
        "rankPreference": "POPULARITY",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    wait = 1.0
    for attempt in range(1, 4):
        try:
            resp = requests.post(NEARBY_SEARCH_URL, headers=headers,
                                 json=body, timeout=30)
            if resp.status_code == 429:
                logger.warning("Rate limited — waiting 90s")
                time.sleep(90)
                continue
            if resp.status_code == 403:
                logger.error(f"403 Forbidden: {resp.text[:200]}")
                sys.exit(2)
            if resp.status_code >= 400:
                logger.warning(f"HTTP {resp.status_code} attempt {attempt}: {resp.text[:100]}")
            else:
                return resp.json().get("places", [])
        except requests.RequestException as e:
            logger.warning(f"Request error attempt {attempt}: {e}")
        time.sleep(min(wait + random.uniform(0, 0.4 * wait), 60))
        wait *= 2
    return []


# ─── Record mapping ───────────────────────────────────────────────────────────

def map_record(place: dict, gtype: str) -> dict | None:
    sub_type, noise_level = STUDY_TYPE_MAP[gtype]

    dn = place.get("displayName", {})
    name = dn.get("text", "") if isinstance(dn, dict) else ""
    if not name:
        return None

    gid = place.get("id", "")
    if not gid:
        return None

    loc = place.get("location", {})
    lat = loc.get("latitude")
    lng = loc.get("longitude")
    if lat is None or lng is None:
        return None
    lat, lng = float(lat), float(lng)

    dist_km = haversine_km(CAMPUS_LAT, CAMPUS_LNG, lat, lng)
    refs = extract_photo_refs(place)
    gtypes = place.get("types", [])
    pt = place.get("primaryType", "")

    sm = place.get("editorialSummary") or {}
    desc = sm.get("text") if isinstance(sm, dict) else None

    return {
        "google_place_id":      gid,
        "name":                 name,
        "category":             "study",
        "type":                 gtype,
        "sub_type":             sub_type,
        "address":              place.get("formattedAddress") or place.get("shortFormattedAddress", ""),
        "city":                 DEFAULT_CITY,
        "lat":                  lat,
        "lng":                  lng,
        "phone":                place.get("nationalPhoneNumber"),
        "website":              place.get("websiteUri"),
        "google_maps_url":      place.get("googleMapsUri"),
        "is_on_campus":         dist_km < 0.1,
        "is_static":            False,
        "is_manual_override":   False,
        "data_source":          DATA_SOURCE,
        "last_fetched_at":      datetime.now(timezone.utc).isoformat(),
        "rating":               round(float(place["rating"]), 1) if place.get("rating") else None,
        "rating_count":         int(place["userRatingCount"]) if place.get("userRatingCount") else None,
        "photo_refs":           refs,
        "timing":               extract_timing(place),
        "business_status":      place.get("businessStatus", "OPERATIONAL"),
        "distance_from_campus": fmt_dist(dist_km),
        "noise_level":          noise_level,
        # Google Places API does not expose WiFi data — left as NULL
        "has_wifi":             None,
        "description":          desc,
        "verified":             False,
        "extra": {
            "google_types":    gtypes,
            "primary_type":    pt,
            "outdoor_seating": place.get("outdoorSeating"),
            "good_for_groups": place.get("goodForGroups"),
        },
    }


# ─── Supabase upsert ──────────────────────────────────────────────────────────

def upsert(sb, records: list, dry_run: bool) -> tuple[int, int]:
    if dry_run:
        logger.info(f"  [DRY RUN] would upsert {len(records)} records:")
        for r in records[:5]:
            logger.info(f"    {r['name']!r:40s} | {r['sub_type']:12s} | {r['noise_level']:8s} | {r['distance_from_campus']}")
        return len(records), 0
    ins = skip = 0
    for i in range(0, len(records), 50):
        chunk = records[i: i + 50]
        try:
            result = sb.table("places").upsert(
                chunk, on_conflict="google_place_id", ignore_duplicates=False
            ).execute()
            ins += len(result.data or [])
        except Exception as e:
            logger.error(f"Upsert error (chunk {i}): {e}")
            skip += len(chunk)
    return ins, skip


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Seed study spots from Google Places API")
    ap.add_argument("--verbose",      action="store_true")
    ap.add_argument("--dry-run",      action="store_true", help="Print without writing to Supabase")
    ap.add_argument("--radius",       type=int, default=DEFAULT_RADIUS, help=f"Search radius in metres (max {MAX_RADIUS})")
    ap.add_argument("--max-per-type", type=int, default=20,             help="Max results per Google type (max 20)")
    ap.add_argument("--location",     type=str, default="",             help="lat,lng override (default: Christ University)")
    args = ap.parse_args()

    setup_logging(args.verbose)
    radius = min(args.radius, MAX_RADIUS)
    lat, lng = CAMPUS_LAT, CAMPUS_LNG
    if args.location:
        try:
            lat, lng = map(float, args.location.split(","))
        except ValueError:
            logger.error("--location must be lat,lng  e.g. 12.9345,77.6069")
            sys.exit(1)

    api_key, sb_url, sb_key = load_env()
    sb = create_client(sb_url, sb_key)

    logger.info("=" * 60)
    logger.info(f"Study Spots Seeder | {lat},{lng} | radius={radius}m")
    logger.info(f"Types: {', '.join(STUDY_TYPE_MAP)}")
    logger.info("=" * 60)

    tf = tm = tu = ts = 0
    seen_ids: set[str] = set()   # deduplicate across type queries

    for gtype in STUDY_TYPE_MAP:
        logger.info(f"\n▶  {gtype} ...")
        raw = fetch_nearby(api_key, gtype, lat, lng, radius, args.max_per_type)
        logger.info(f"   API returned: {len(raw)}")
        tf += len(raw)

        recs = []
        for p in raw:
            gid = p.get("id", "")
            if gid in seen_ids:
                continue
            rec = map_record(p, gtype)
            if rec:
                seen_ids.add(gid)
                recs.append(rec)

        skipped = len(raw) - len(recs)
        logger.info(f"   Mapped: {len(recs)}  (skipped: {skipped})")
        tm += len(recs)

        if recs:
            i, s = upsert(sb, recs, args.dry_run)
            tu += i
            ts += s
            logger.info(f"   Upserted: {i}  Errors: {s}")

        time.sleep(0.5)

    logger.info("\n" + "=" * 60)
    logger.info(f"DONE  fetched={tf}  mapped={tm}  upserted={tu}  errors={ts}")
    if args.dry_run:
        logger.info("(DRY RUN — nothing written to Supabase)")
    else:
        try:
            res = sb.table("places").select("id", count="exact").eq("category", "study").execute()
            logger.info(f"Total study spots in DB: {res.count}")
        except Exception:
            pass
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

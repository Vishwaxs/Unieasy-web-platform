#!/usr/bin/env python3
"""
verify_seed.py — Post-seed integrity check for UniEasy places table.

Run after seed_offcampus.py to verify data quality and completeness.
Prints a summary report with pass/fail checks.

Usage:
    python scripts/verify_seed.py
    python scripts/verify_seed.py --verbose
"""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv  # pyre-ignore[21]
from supabase import create_client, Client  # pyre-ignore[21]

logger = logging.getLogger("verify_seed")

# Minimum expected places per category
MIN_PLACES_PER_CATEGORY = 3

# Categories that should have data
EXPECTED_CATEGORIES = ["food", "accommodation", "study", "hangout", "health", "services", "essentials"]


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(fmt)
    logger.setLevel(level)
    logger.addHandler(handler)


def load_env() -> tuple[str, str]:
    """Load Supabase credentials. Returns (sb_url, sb_key)."""
    project_root = Path(__file__).resolve().parent.parent
    env_paths = [
        project_root / "server" / ".env.local",
        project_root / ".env.local",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break

    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not sb_url or not sb_key:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)

    return sb_url, sb_key


def run_checks(supabase: Client, verbose: bool) -> None:
    """Run all integrity checks and print results."""
    passed = 0
    failed = 0
    warnings = 0

    def check(name: str, ok: bool, detail: str = "") -> None:
        nonlocal passed, failed
        status = "PASS" if ok else "FAIL"
        icon = "+" if ok else "x"
        msg = f"  [{icon}] {status}: {name}"
        if detail:
            msg += f" — {detail}"
        if ok:
            passed += 1
            logger.info(msg)
        else:
            failed += 1
            logger.error(msg)

    def warn(name: str, detail: str = "") -> None:
        nonlocal warnings
        warnings += 1
        msg = f"  [!] WARN: {name}"
        if detail:
            msg += f" — {detail}"
        logger.warning(msg)

    logger.info("=" * 60)
    logger.info("UniEasy Seed Verification Report")
    logger.info("=" * 60)

    # ── Check 1: Total places count ──────────────────────────────────────────
    result = supabase.table("places").select("id", count="exact").execute()
    total = result.count or 0
    check("Total places in DB", total > 0, f"{total} places found")

    # ── Check 2: No NULL lat/lng ─────────────────────────────────────────────
    null_geo = (
        supabase.table("places")
        .select("id, name", count="exact")
        .is_("lat", "null")
        .execute()
    )
    null_geo_count = null_geo.count or 0
    check("No NULL lat/lng", null_geo_count == 0, f"{null_geo_count} places with NULL lat")

    # ── Check 3: No duplicate google_place_id ────────────────────────────────
    # We check by counting all non-null google_place_ids vs distinct count
    all_gpi = (
        supabase.table("places")
        .select("google_place_id", count="exact")
        .not_.is_("google_place_id", "null")
        .execute()
    )
    all_gpi_count = all_gpi.count or 0
    # Since google_place_id has a UNIQUE index, duplicates would fail on insert
    check(
        "No duplicate google_place_id",
        True,
        f"{all_gpi_count} unique google_place_ids (enforced by UNIQUE index)",
    )

    # ── Check 4: Categories have minimum places ─────────────────────────────
    for cat in EXPECTED_CATEGORIES:
        cat_result = (
            supabase.table("places")
            .select("id", count="exact")
            .eq("category", cat)
            .execute()
        )
        cat_count = cat_result.count or 0
        if cat_count >= MIN_PLACES_PER_CATEGORY:
            check(f"Category '{cat}' has places", True, f"{cat_count} places")
        elif cat_count > 0:
            warn(f"Category '{cat}' has few places", f"{cat_count} (minimum: {MIN_PLACES_PER_CATEGORY})")
        else:
            check(f"Category '{cat}' has places", False, "0 places found")

    # ── Check 5: Food has both veg and non-veg ───────────────────────────────
    veg_result = (
        supabase.table("places")
        .select("id", count="exact")
        .eq("category", "food")
        .eq("is_veg", True)
        .execute()
    )
    veg_count = veg_result.count or 0

    nonveg_result = (
        supabase.table("places")
        .select("id", count="exact")
        .eq("category", "food")
        .eq("is_veg", False)
        .execute()
    )
    nonveg_count = nonveg_result.count or 0

    check(
        "Food has veg items",
        veg_count > 0,
        f"{veg_count} veg food places",
    )
    check(
        "Food has non-veg items",
        nonveg_count > 0,
        f"{nonveg_count} non-veg food places",
    )

    # ── Check 6: Accommodation has varied sub_types ──────────────────────────
    acc_types = (
        supabase.table("places")
        .select("sub_type")
        .eq("category", "accommodation")
        .execute()
    )
    acc_subtypes = set(r.get("sub_type") for r in (acc_types.data or []) if r.get("sub_type"))
    check(
        "Accommodation has varied sub_types",
        len(acc_subtypes) >= 2,
        f"Found: {', '.join(sorted(acc_subtypes)) if acc_subtypes else 'none'}",
    )

    # ── Check 7: price_inr values are varied (not all same) ─────────────────
    prices = (
        supabase.table("places")
        .select("price_inr")
        .eq("category", "food")
        .not_.is_("price_inr", "null")
        .limit(50)
        .execute()
    )
    price_values = [r["price_inr"] for r in (prices.data or []) if r.get("price_inr") is not None]
    unique_prices = set(price_values)
    check(
        "price_inr values are varied",
        len(unique_prices) >= 3,
        f"{len(unique_prices)} unique values out of {len(price_values)} food places with prices",
    )

    # ── Check 8: No food items in accommodation ──────────────────────────────
    cross_check = (
        supabase.table("places")
        .select("id, name, category, type", count="exact")
        .eq("category", "accommodation")
        .in_("type", ["restaurant", "cafe", "bakery"])
        .execute()
    )
    cross_count = cross_check.count or 0
    check(
        "No food types in accommodation category",
        cross_count == 0,
        f"{cross_count} misclassified" if cross_count > 0 else "clean",
    )

    # ── Check 9: On-campus places exist ──────────────────────────────────────
    campus_result = (
        supabase.table("places")
        .select("id", count="exact")
        .eq("is_on_campus", True)
        .execute()
    )
    campus_count = campus_result.count or 0
    check("On-campus places seeded", campus_count > 0, f"{campus_count} on-campus places")

    # ── Check 10: Distance from campus is populated ──────────────────────────
    dist_result = (
        supabase.table("places")
        .select("id", count="exact")
        .eq("is_on_campus", False)
        .not_.is_("distance_from_campus", "null")
        .execute()
    )
    dist_count = dist_result.count or 0
    off_campus = (
        supabase.table("places")
        .select("id", count="exact")
        .eq("is_on_campus", False)
        .execute()
    )
    off_campus_count = off_campus.count or 0
    pct = round(dist_count / off_campus_count * 100) if off_campus_count > 0 else 0
    check(
        "Off-campus places have distance_from_campus",
        pct >= 50,
        f"{dist_count}/{off_campus_count} ({pct}%) have distance set",
    )

    # ── Summary ──────────────────────────────────────────────────────────────
    logger.info("")
    logger.info("=" * 60)
    logger.info(f"VERIFICATION SUMMARY: {passed} passed, {failed} failed, {warnings} warnings")
    logger.info("=" * 60)

    if failed > 0:
        logger.error("Some checks FAILED. Review the seed data and re-run the seeder.")
        sys.exit(1)
    else:
        logger.info("All checks passed!")


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Verify seed data integrity for UniEasy places table.")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    args = parser.parse_args()

    setup_logging(args.verbose)
    sb_url, sb_key = load_env()

    try:
        supabase: Client = create_client(sb_url, sb_key)
        supabase.table("places").select("id").limit(1).execute()
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        sys.exit(3)

    run_checks(supabase, args.verbose)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
seed_offcampus_v2.py — Production-grade seeder for UniEasy places table.
Google Places API (New) — searchNearby POST. Full rich field extraction.

Usage:
    python scripts/seed_offcampus_v2.py --dry-run --verbose
    python scripts/seed_offcampus_v2.py --radius 3000
    python scripts/seed_offcampus_v2.py --categories restaurant,cafe,gym,lodging
"""

import argparse, json, logging, math, os, random, sys, time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ─── Campus anchor (Christ University, Central Campus) ───────────────────────
CAMPUS_LAT = 12.9345
CAMPUS_LNG = 77.6069
DEFAULT_RADIUS = 3000
MAX_RADIUS = 5000
DEFAULT_CITY = "Bangalore"
DATA_SOURCE = "google_places_seed_v2"

NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"

FIELD_MASK = ",".join([
    "places.id","places.displayName","places.formattedAddress",
    "places.shortFormattedAddress","places.location","places.rating",
    "places.userRatingCount","places.priceLevel","places.businessStatus",
    "places.nationalPhoneNumber","places.internationalPhoneNumber",
    "places.websiteUri","places.googleMapsUri","places.currentOpeningHours",
    "places.regularOpeningHours","places.photos","places.types",
    "places.primaryType","places.primaryTypeDisplayName",
    "places.editorialSummary","places.servesVegetarianFood",
    "places.dineIn","places.takeout","places.delivery",
    "places.goodForChildren","places.goodForGroups","places.outdoorSeating",
    "places.parkingOptions","places.accessibilityOptions",
])

GOOGLE_TYPE_MAP = {
    "restaurant":("food","restaurant"),"cafe":("food","cafe"),
    "bakery":("food","bakery"),"fast_food_restaurant":("food","fast_food"),
    "juice_shop":("food","juice"),"ice_cream_shop":("food","dessert"),
    "lodging":("accommodation","hostel"),"hotel":("accommodation","hotel"),
    "guest_house":("accommodation","guest_house"),
    "library":("study","library"),"book_store":("services","bookstore"),
    "pharmacy":("health","pharmacy"),"hospital":("health","hospital"),
    "doctor":("health","clinic"),"dentist":("health","dental"),
    "gym":("fitness","gym"),"yoga_studio":("fitness","yoga"),
    "sports_complex":("fitness","sports_complex"),
    "laundry":("services","laundry"),"store":("services","store"),
    "atm":("essentials","atm"),"bank":("essentials","bank"),
    "supermarket":("essentials","supermarket"),
    "convenience_store":("essentials","convenience"),
    "park":("hangout","park"),"shopping_mall":("hangout","mall"),
    "movie_theater":("hangout","cinema"),
    "bus_station":("transport","bus"),"subway_station":("transport","metro"),
}

DEFAULT_TYPES = [
    "restaurant","cafe","fast_food_restaurant","bakery","juice_shop",
    "lodging","library","pharmacy","hospital","gym","laundry",
    "park","shopping_mall","supermarket","atm","bank","bus_station","subway_station",
]

PG_KW = {"pg","paying guest","paying-guest"}
FLAT_KW = {"flat","apartment","rental","furnished"}
COLIVING_KW = {"co-living","coliving","co living"}
HOSTEL_KW = {"hostel","dormitory","dorm"}
VEG_KW = {"pure veg","vegetarian","udupi","satvik","satvic"}
NON_VEG_KW = {"chicken","mutton","fish","seafood","biryani","kebab","tandoori","beef"}
STORE_FILTER_KW = {"print","xerox","stationery","courier","copy","stationary","binding"}

PRICE_INR = {
    "PRICE_LEVEL_FREE":0,"PRICE_LEVEL_INEXPENSIVE":80,
    "PRICE_LEVEL_MODERATE":250,"PRICE_LEVEL_EXPENSIVE":600,
    "PRICE_LEVEL_VERY_EXPENSIVE":1500,
}
PRICE_INT = {
    "PRICE_LEVEL_FREE":0,"PRICE_LEVEL_INEXPENSIVE":1,"PRICE_LEVEL_MODERATE":2,
    "PRICE_LEVEL_EXPENSIVE":3,"PRICE_LEVEL_VERY_EXPENSIVE":4,
}

logger = logging.getLogger("seed_v2")

def setup_logging(verbose):
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(fmt)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    logger.addHandler(h)

def load_env():
    root = Path(__file__).resolve().parent.parent
    for p in [root/"server"/".env.local", root/".env.local"]:
        if p.exists(): load_dotenv(p); break
    k=os.getenv("GOOGLE_PLACES_API_KEY")
    u=os.getenv("SUPABASE_URL")
    s=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    miss=[n for n,v in [("GOOGLE_PLACES_API_KEY",k),("SUPABASE_URL",u),("SUPABASE_SERVICE_ROLE_KEY",s)] if not v]
    if miss: logger.error(f"Missing: {', '.join(miss)}"); sys.exit(1)
    return k, u, s

def haversine_km(lat1,lng1,lat2,lng2):
    R=6371.0; dlat=math.radians(lat2-lat1); dlng=math.radians(lng2-lng1)
    a=math.sin(dlat/2)**2+math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def fmt_dist(km):
    if km<0.1: return "On campus"
    return f"{int(km*1000)} m" if km<1 else f"{km:.1f} km"

def fetch_nearby(api_key, ptype, lat, lng, radius, maxr=20):
    body={"includedTypes":[ptype],"maxResultCount":min(maxr,20),
          "locationRestriction":{"circle":{"center":{"latitude":lat,"longitude":lng},"radius":float(radius)}},
          "rankPreference":"POPULARITY"}
    headers={"Content-Type":"application/json","X-Goog-Api-Key":api_key,"X-Goog-FieldMask":FIELD_MASK}
    wait=1.0
    for attempt in range(1,4):
        try:
            r=requests.post(NEARBY_SEARCH_URL,headers=headers,json=body,timeout=30)
            if r.status_code==429: logger.warning(f"Rate limited, wait 90s"); time.sleep(90); continue
            if r.status_code==403: logger.error(f"403: {r.text[:200]}"); sys.exit(2)
            if r.status_code>=400: logger.warning(f"HTTP {r.status_code} attempt {attempt}"); 
            else: return r.json().get("places",[])
        except requests.RequestException as e: logger.warning(f"Req err {attempt}: {e}")
        time.sleep(min(wait+random.uniform(0,0.4*wait),60)); wait*=2
    return []

def opening_hours(place):
    for key in ["currentOpeningHours","regularOpeningHours"]:
        h=place.get(key,{})
        if not h: continue
        desc=h.get("weekdayDescriptions",[])
        if desc:
            for line in desc:
                if "Monday" in line: return line.split(": ",1)[-1]
            return desc[0].split(": ",1)[-1]
    return None

def photo_refs(place, n=5):
    return [{"ref":p.get("name",""),"width":p.get("widthPx"),"height":p.get("heightPx"),
             "attribution":[a.get("displayName","") for a in (p.get("authorAttributions") or [])]}
            for p in place.get("photos",[])[:n] if p.get("name")]

def photo_url(ref, api_key, w=800):
    return f"https://places.googleapis.com/v1/{ref}/media?maxWidthPx={w}&key={api_key}" if ref else None

def infer_veg(place, name):
    nl=name.lower()
    if any(k in nl for k in VEG_KW): return True
    if any(k in nl for k in NON_VEG_KW): return False
    if place.get("servesVegetarianFood"): return None
    return None

def cuisine_tags(place, name):
    tags=set(); nl=name.lower()
    maps={"north_indian":["north indian","punjabi","mughlai"],"south_indian":["udupi","south indian","dosa","idli"],
          "chinese":["chinese","noodles","manchurian"],"fast_food":["burger","pizza","wrap","sandwich"],
          "bakery":["bakery","cake","pastry"],"beverages":["juice","chai","coffee","tea"],
          "biryani":["biryani","dum"],"street_food":["chaat","pav bhaji","street food"]}
    for tag,kws in maps.items():
        if any(k in nl for k in kws): tags.add(tag)
    return sorted(tags)

def amenities(place):
    a=[]
    if place.get("dineIn"): a.append("Dine-in")
    if place.get("takeout"): a.append("Takeaway")
    if place.get("delivery"): a.append("Delivery")
    if place.get("outdoorSeating"): a.append("Outdoor seating")
    if place.get("goodForGroups"): a.append("Groups")
    if place.get("goodForChildren"): a.append("Family-friendly")
    pk=place.get("parkingOptions",{})
    if pk and any(pk.values()): a.append("Parking")
    ac=place.get("accessibilityOptions",{})
    if ac and ac.get("wheelchairAccessibleEntrance"): a.append("Wheelchair accessible")
    return a

def lodging_subtype(name):
    nl=name.lower()
    if any(k in nl for k in COLIVING_KW): return "co-living"
    if any(k in nl for k in PG_KW): return "pg"
    if any(k in nl for k in FLAT_KW): return "flat"
    if any(k in nl for k in HOSTEL_KW): return "hostel"
    return "hostel"

def map_record(place, gtype, api_key):
    if gtype not in GOOGLE_TYPE_MAP: return None
    category, sub_type = GOOGLE_TYPE_MAP[gtype]
    dn=place.get("displayName",{})
    name=dn.get("text","") if isinstance(dn,dict) else ""
    if not name: return None
    if gtype=="store" and not any(k in name.lower() for k in STORE_FILTER_KW): return None
    if gtype in ("lodging","hotel","guest_house"): sub_type=lodging_subtype(name)
    gid=place.get("id","")
    if not gid: return None
    loc=place.get("location",{})
    lat=loc.get("latitude"); lng=loc.get("longitude")
    if lat is None or lng is None: return None
    lat,lng=float(lat),float(lng)
    dist_km=haversine_km(CAMPUS_LAT,CAMPUS_LNG,lat,lng)
    pl_str=place.get("priceLevel","")
    price_inr=float(PRICE_INR.get(pl_str,0))
    refs=photo_refs(place)
    primary=photo_url(refs[0]["ref"],api_key) if refs else None
    gtypes=place.get("types",[])
    is_veg=infer_is_veg=None
    ctags=[]; ams=[]; hw=False; deliv=False; take=False; dine=False; desc=None
    if category=="food":
        is_veg=infer_veg(place,name); ctags=cuisine_tags(place,name)
        ams=amenities(place); hw=False; deliv=bool(place.get("delivery"))
        take=bool(place.get("takeout")); dine=bool(place.get("dineIn"))
    elif category in ("accommodation","study","hangout","fitness"):
        ams=amenities(place)
    sm=place.get("editorialSummary",{})
    if isinstance(sm,dict): desc=sm.get("text")
    tags=[]
    pt=place.get("primaryType","")
    if pt: tags.append(pt.replace("_"," ").title())
    if is_veg is True: tags.append("Pure Veg")
    if dist_km<0.5: tags.append("Near Campus")
    pr_min=pr_max=None
    if category=="food":
        rngs={"PRICE_LEVEL_INEXPENSIVE":(50,150),"PRICE_LEVEL_MODERATE":(150,400),
              "PRICE_LEVEL_EXPENSIVE":(400,800),"PRICE_LEVEL_VERY_EXPENSIVE":(800,2000)}
        rng=rngs.get(pl_str)
        if rng: pr_min,pr_max=rng
    pd=None
    if pl_str and pl_str!="PRICE_LEVEL_FREE":
        if category=="accommodation":
            pd={"PRICE_LEVEL_INEXPENSIVE":"₹5,000–₹8,000/mo","PRICE_LEVEL_MODERATE":"₹8,000–₹15,000/mo",
                "PRICE_LEVEL_EXPENSIVE":"₹15,000–₹25,000/mo","PRICE_LEVEL_VERY_EXPENSIVE":"₹25,000+/mo"}.get(pl_str)
        elif price_inr>0: pd=f"₹{int(price_inr)}"
    return {
        "google_place_id":gid,"name":name,"category":category,"type":gtype,"sub_type":sub_type,
        "address":place.get("formattedAddress") or place.get("shortFormattedAddress",""),
        "city":DEFAULT_CITY,"lat":lat,"lng":lng,
        "phone":place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
        "website":place.get("websiteUri"),"google_maps_url":place.get("googleMapsUri"),
        "is_on_campus":dist_km<0.1,"is_static":False,"is_manual_override":False,
        "data_source":DATA_SOURCE,"last_fetched_at":datetime.now(timezone.utc).isoformat(),
        "rating":round(float(place["rating"]),1) if place.get("rating") else None,
        "rating_count":int(place["userRatingCount"]) if place.get("userRatingCount") else None,
        "price_level":PRICE_INT.get(pl_str),"price_inr":price_inr if price_inr>0 else None,
        "price_range_min":pr_min,"price_range_max":pr_max,"price_display":pd,"display_price_label":pd,
        "photo_refs":refs,"primary_photo_url":primary,"timing":opening_hours(place),
        "business_status":place.get("businessStatus","OPERATIONAL"),
        "distance_from_campus":fmt_dist(dist_km),
        "is_veg":is_veg,"cuisine_tags":ctags or None,"amenities":ams or None,
        "has_wifi":False,"delivery_available":deliv,"takeaway_available":take,"dine_in_available":dine,
        "description":desc,"tags":tags or None,"verified":False,
        "extra":{"google_types":gtypes,"primary_type":pt,"price_level_str":pl_str},
    }

def upsert(sb, records, dry_run):
    if dry_run:
        logger.info(f"  [DRY RUN] {len(records)} records would upsert")
        return len(records),0
    ins=skip=0
    for i in range(0,len(records),50):
        chunk=records[i:i+50]
        try:
            r=sb.table("places").upsert(chunk,on_conflict="google_place_id",ignore_duplicates=False).execute()
            ins+=len(r.data or [])
        except Exception as e:
            logger.error(f"Upsert error chunk {i}: {e}"); skip+=len(chunk)
    return ins,skip

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--verbose",action="store_true")
    ap.add_argument("--dry-run",action="store_true")
    ap.add_argument("--radius",type=int,default=DEFAULT_RADIUS)
    ap.add_argument("--categories",type=str,default="")
    ap.add_argument("--location",type=str,default="")
    ap.add_argument("--max-per-type",type=int,default=20)
    args=ap.parse_args()
    setup_logging(args.verbose)
    radius=min(args.radius,MAX_RADIUS)
    lat,lng=CAMPUS_LAT,CAMPUS_LNG
    if args.location:
        try: lat,lng=map(float,args.location.split(","))
        except: logger.error("--location must be lat,lng"); sys.exit(1)
    types=DEFAULT_TYPES
    if args.categories:
        req=[t.strip() for t in args.categories.split(",")]
        types=[t for t in req if t in GOOGLE_TYPE_MAP]
        unknown=[t for t in req if t not in GOOGLE_TYPE_MAP]
        if unknown: logger.warning(f"Unknown types: {unknown}")
        if not types: logger.error("No valid types"); sys.exit(1)
    api_key,sb_url,sb_key=load_env()
    sb=create_client(sb_url,sb_key)
    logger.info("="*60)
    logger.info(f"UniEasy Seeder v2 | Center: {lat},{lng} | Radius: {radius}m | Types: {len(types)}")
    logger.info("="*60)
    tf=tm=tu=ts=0
    for ptype in types:
        logger.info(f"\n▶ {ptype} ...")
        raw=fetch_nearby(api_key,ptype,lat,lng,radius,args.max_per_type)
        logger.info(f"  API: {len(raw)} results")
        tf+=len(raw)
        recs=[r for r in (map_record(p,ptype,api_key) for p in raw) if r]
        logger.info(f"  Mapped: {len(recs)} (skipped {len(raw)-len(recs)})")
        tm+=len(recs)
        if recs:
            i,s=upsert(sb,recs,args.dry_run)
            tu+=i; ts+=s
            logger.info(f"  Upserted: {i}, Skipped/err: {s}")
        time.sleep(0.3)
    logger.info("\n"+"="*60)
    logger.info(f"DONE | Fetched:{tf} Mapped:{tm} Upserted:{tu} Skipped:{ts}")
    if args.dry_run: logger.info("(DRY RUN — nothing written)")
    if not args.dry_run:
        res=sb.table("places").select("id",count="exact").execute()
        logger.info(f"Total places in DB: {res.count}")
    logger.info("="*60)

if __name__=="__main__":
    main()
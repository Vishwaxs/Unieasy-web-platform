import googlemaps
from supabase import create_client

GOOGLE_API = "YOUR_API_KEY"
SUPABASE_URL = "YOUR_URL"
SUPABASE_KEY = "YOUR_KEY"

gmaps = googlemaps.Client(key=GOOGLE_API)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

places = gmaps.places_nearby(
location=(12.9716, 77.5946),
radius=2000,
type="gym"
)

for place in places['results']:

    data = {
        "name": place['name'],
        "address": place.get('vicinity'),
        "lat": place['geometry']['location']['lat'],
        "lng": place['geometry']['location']['lng'],
        "rating": place.get('rating'),
        "google_place_id": place['place_id'],
        "category": "gym",
        "is_static": True
    }

    supabase.table("places").insert(data).execute()

print("Done seeding")
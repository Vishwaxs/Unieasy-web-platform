import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock3,
  Globe,
  Leaf,
  Drumstick,
  CheckCircle2,
  Loader2,
  Navigation,
  Bookmark,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewSection from "@/components/ReviewSection";
import SentimentPoll from "@/components/SentimentPoll";
import ReactionBar from "@/components/ReactionBar";
import { usePlaceDetail, placePhotoUrl } from "@/hooks/usePlaceDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FoodRestaurantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: place, isLoading, isError } = usePlaceDetail(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !place) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold text-foreground">Restaurant not found</h1>
              <p className="text-muted-foreground mt-2">Please go back and select another restaurant.</p>
              <Link to="/food" className="text-primary mt-4 inline-block hover:underline">
                Go to Food
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heroImage = place.photo_refs?.length > 0
    ? placePhotoUrl(place.id, 0)
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200";

  const cuisines = place.cuisine_tags || [];
  const amenities = place.amenities || [];
  const weekdayDescriptions: string[] =
    place.extra?.opening_hours?.weekdayDescriptions || [];
  const priceLabel =
    place.display_price_label || (place.price_inr ? `Rs. ${place.price_inr}` : null);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-10">
        {/* Hero */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={heroImage}
            alt={place.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-950/85 via-black/60 to-black/40 dark:from-orange-950/70 dark:via-background/50 dark:to-background/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 md:px-6 pb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{place.name}</h1>
              {place.address && (
                <p className="text-white/85 mt-2 max-w-2xl">{place.address}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/90">
                <ReactionBar placeId={place.id} />
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{place.rating}</span>
                  <span className="text-xs text-white/70">({place.rating_count} reviews)</span>
                </div>
                {place.is_veg !== null && (
                  <Badge
                    className={`${place.is_veg ? "bg-green-500" : "bg-red-500"} text-white border-0`}
                  >
                    {place.is_veg ? (
                      <Leaf className="w-3 h-3 mr-1" />
                    ) : (
                      <Drumstick className="w-3 h-3 mr-1" />
                    )}
                    {place.is_veg ? "Veg" : "Non-Veg"}
                  </Badge>
                )}
                {place.business_status && (
                  <Badge
                    className={`${
                      place.is_open_now ? "bg-green-600" : "bg-red-600"
                    } text-white border-0`}
                  >
                    {place.is_open_now ? "Open Now" : "Closed"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Navigation className="w-4 h-4" />
                  Directions
                </Button>
              </a>
              {place.phone && (
                <a href={`tel:${place.phone}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </a>
              )}
              {place.website && (
                <a href={place.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Globe className="w-4 h-4" />
                    Website
                  </Button>
                </a>
              )}
            </div>

            {/* Cuisine Tags */}
            {cuisines.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-3">Cuisine</h2>
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* About / Description */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {place.name} is located at {place.address}.
                {place.distance_from_campus && ` It's ${place.distance_from_campus} from campus.`}
                {priceLabel && ` Average cost: ${priceLabel}.`}
              </p>
            </div>

            {/* Photo Gallery */}
            {place.photo_refs?.length > 1 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {place.photo_refs.slice(0, 6).map((_, i) => (
                    <img
                      key={i}
                      src={placePhotoUrl(place.id, i)}
                      alt={`${place.name} photo ${i + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                      referrerPolicy="no-referrer-when-downgrade"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Google Map Embed */}
            {place.lat && place.lng && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                <div className="rounded-xl overflow-hidden h-64">
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"}&q=${place.lat},${place.lng}&zoom=16`}
                  />
                </div>
              </div>
            )}

            {/* Reviews & Sentiment */}
            <ReviewSection placeId={place.id} />
            <SentimentPoll placeId={place.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Info</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {place.distance_from_campus && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {place.distance_from_campus} from campus
                  </li>
                )}
                {place.timing && (
                  <li className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-primary" />
                    {place.timing}
                  </li>
                )}
                {place.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <a href={`tel:${place.phone}`} className="hover:text-primary">
                      {place.phone}
                    </a>
                  </li>
                )}
                {priceLabel && (
                  <li className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" />
                    {priceLabel}
                  </li>
                )}
              </ul>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="bg-muted/70 capitalize">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {weekdayDescriptions.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Hours</h3>
                <div className="space-y-1.5">
                  {weekdayDescriptions.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Link
              to="/food"
              className="inline-flex text-primary hover:underline text-sm"
            >
              Browse more food options
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FoodRestaurantDetails;

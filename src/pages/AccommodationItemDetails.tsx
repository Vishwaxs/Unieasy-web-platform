import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Car,
  Shield,
  UtensilsCrossed,
  Shirt,
  Dumbbell,
  Snowflake,
  Phone,
  Clock3,
  CheckCircle2,
  Building2,
  Navigation,
  Globe,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DetailPageSkeleton } from "@/components/CardSkeleton";
import ReviewSection from "@/components/ReviewSection";
import SentimentPoll from "@/components/SentimentPoll";
import ReactionButtons from "@/components/ReactionButtons";
import RatingBadge from "@/components/RatingBadge";
import { usePlaceDetail, placePhotoUrl } from "@/hooks/usePlaceDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const amenityMeta: Record<string, { icon: ReactNode; label: string }> = {
  wifi: { icon: <Wifi className="w-4 h-4" />, label: "High-Speed WiFi" },
  parking: { icon: <Car className="w-4 h-4" />, label: "Parking" },
  security: { icon: <Shield className="w-4 h-4" />, label: "24x7 Security" },
  meals: { icon: <UtensilsCrossed className="w-4 h-4" />, label: "Meals Included" },
  laundry: { icon: <Shirt className="w-4 h-4" />, label: "Laundry" },
  gym: { icon: <Dumbbell className="w-4 h-4" />, label: "Gym" },
  ac: { icon: <Snowflake className="w-4 h-4" />, label: "Air Conditioning" },
};

const AccommodationItemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: place, isLoading, isError } = usePlaceDetail(id);

  useEffect(() => {
    if (location.hash === "#reviews") {
      setTimeout(() => {
        document
          .getElementById("reviews")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [location.hash]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <DetailPageSkeleton />
        </main>
        <Footer />
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
              <h1 className="text-2xl font-semibold text-foreground">Accommodation not found</h1>
              <p className="text-muted-foreground mt-2">Please go back and choose another accommodation option.</p>
              <Link to="/accommodation" className="inline-block mt-4 text-primary hover:underline">
                Go to Accommodation
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
    : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200";

  const amenities = place.amenities || [];
  const subType = place.sub_type || "Accommodation";
  const priceLabel =
    place.display_price_label || (place.price_inr ? `Rs. ${place.price_inr.toLocaleString()}/month` : null);
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
          <div className="absolute inset-0 bg-gradient-to-r from-violet-950/85 via-black/60 to-black/40 dark:from-violet-950/70 dark:via-background/50 dark:to-background/30" />
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
                <ReactionButtons
                  placeId={place.id}
                  initialCounts={{
                    likes: place.like_count ?? 0,
                    dislikes: place.dislike_count ?? 0,
                    bookmarks: place.bookmark_count ?? 0,
                  }}
                />
                <Badge className="bg-primary text-primary-foreground capitalize">{subType}</Badge>
                <RatingBadge
                  rating={place.rating}
                  ratingCount={place.rating_count}
                  reviewCount={place.review_count}
                  source="both"
                  size="lg"
                />
                {place.distance_from_campus && (
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{place.distance_from_campus} from campus</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
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

            {/* Overview */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {place.name} is a {subType.toLowerCase()} located at {place.address}.
                {place.distance_from_campus && ` It's ${place.distance_from_campus} from campus.`}
                {priceLabel && ` Starting at ${priceLabel}.`}
              </p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {amenities.map((amenity) => {
                    const meta = amenityMeta[amenity] ?? { icon: <Building2 className="w-4 h-4" />, label: amenity };
                    return (
                      <div key={amenity} className="rounded-xl border border-border p-3 bg-background/60 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">{meta.icon}</div>
                        <span className="text-sm font-medium text-foreground capitalize">{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Google Map */}
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
            <ReviewSection placeId={place.id} placeName={place.name} />
            <SentimentPoll
              placeId={place.id}
              initialCounts={{
                love: place.sentiment_love ?? 0,
                like: place.sentiment_like ?? 0,
                neutral: place.sentiment_neutral ?? 0,
                dislike: place.sentiment_dislike ?? 0,
                terrible: place.sentiment_terrible ?? 0,
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Facts</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Type: {subType}
                </li>
                {place.distance_from_campus && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {place.distance_from_campus} from campus
                  </li>
                )}
                {priceLabel && (
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {priceLabel}
                  </li>
                )}
                {place.timing && (
                  <li className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-primary" />
                    {place.timing}
                  </li>
                )}
              </ul>
            </div>

            {place.phone && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Contact</h3>
                <a href={`tel:${place.phone}`}>
                  <Button className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call {place.phone}
                  </Button>
                </a>
              </div>
            )}

            <Link to="/accommodation" className="inline-flex text-primary hover:underline text-sm">
              Browse more options
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccommodationItemDetails;

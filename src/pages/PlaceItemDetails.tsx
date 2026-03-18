import { useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock3,
  Globe,
  Wifi,
  Volume2,
  VolumeX,
  Users,
  Loader2,
  Navigation,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DetailPageSkeleton } from "@/components/CardSkeleton";
import ReviewSection from "@/components/ReviewSection";
import SentimentPoll from "@/components/SentimentPoll";
import ReactionBar from "@/components/ReactionBar";
import { usePlaceDetail, placePhotoUrl } from "@/hooks/usePlaceDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PlaceItemDetails = () => {
  const { id } = useParams<{ id: string }>();
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Place not found.</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const photos = place.photo_refs || [];
  const amenities = place.amenities || [];
  const openingHours = place.extra?.opening_hours?.weekdayDescriptions || [];
  const backPath = place.category === "study" ? "/study" : place.category === "explore" ? "/explore" : place.category === "campus" ? "/campus" : "/essentials";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-8">
        {/* Hero */}
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img
            src={photos.length > 0 ? placePhotoUrl(place.id, 0) : `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200`}
            alt={place.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Link to={backPath} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors">
              <ArrowLeft className="w-5 h-5" /><span>Back</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{place.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {place.sub_type && <Badge className="bg-white/20 text-white border-0">{place.sub_type}</Badge>}
              <Badge className="bg-primary/80 text-white border-0">{place.category}</Badge>
              {place.rating > 0 && (
                <span className="flex items-center gap-1 text-white text-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {place.rating} ({place.rating_count || 0})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {place.lat && place.lng && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2"><Navigation className="w-4 h-4" />Directions</Button>
              </a>
            )}
            {place.phone && (
              <a href={`tel:${place.phone}`}>
                <Button variant="outline" size="sm" className="gap-2"><Phone className="w-4 h-4" />Call</Button>
              </a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2"><Globe className="w-4 h-4" />Website</Button>
              </a>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {place.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{place.address}</span>
              </div>
            )}
            {place.timing && (
              <div className="flex items-start gap-2">
                <Clock3 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{place.timing}</span>
              </div>
            )}
            {place.noise_level && (
              <div className="flex items-center gap-2">
                {place.noise_level === "Silent" ? <VolumeX className="w-4 h-4 text-green-500" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
                <span className="text-sm text-muted-foreground">{place.noise_level} noise</span>
              </div>
            )}
            {place.crowd_level && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{place.crowd_level} crowd</span>
              </div>
            )}
            {place.has_wifi && (
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">WiFi available</span>
              </div>
            )}
            {place.price_inr && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">₹{place.price_inr}</span>
                {place.display_price_label && <span className="text-xs text-muted-foreground">{place.display_price_label}</span>}
              </div>
            )}
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a: string, i: number) => (
                  <Badge key={i} variant="secondary">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {openingHours.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Opening Hours</h2>
              <div className="space-y-1">
                {openingHours.map((line: string, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {photos.length > 1 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.slice(0, 6).map((_: string, i: number) => (
                  <img
                    key={i}
                    src={placePhotoUrl(place.id, i)}
                    alt={`${place.name} photo ${i + 1}`}
                    className="w-full h-40 object-cover rounded-xl"
                    referrerPolicy="no-referrer-when-downgrade"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Google Maps */}
          {place.lat && place.lng && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Location</h2>
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  title="Map"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${place.lat},${place.lng}&zoom=16`}
                />
              </div>
            </div>
          )}

          {/* Community */}
          <SentimentPoll placeId={place.id} />
          <ReactionBar placeId={place.id} />
          <section id="reviews" className="scroll-mt-24">
            <ReviewSection placeId={place.id} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceItemDetails;

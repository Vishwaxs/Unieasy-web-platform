import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Car,
  Shield,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  useAccommodations,
  type Accommodation,
} from "@/hooks/useAccommodations";

type TypeFilter = "all" | "Hostel" | "PG" | "Apartment";
type SortType = "default" | "price-low" | "price-high" | "rating" | "distance";
type StayType = "short-stay" | "long-term" | "shared" | "private";
type UserReview = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  stayType: StayType;
};

const ratingOptions: Array<{
  value: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  label: string;
}> = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😋", label: "Great" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

const AccommodationCard = ({
  item,
  index,
  onReview,
}: {
  item: Accommodation;
  index: number;
  onReview: (item: Accommodation) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const showsDistanceKm = /\bkm\b/i.test(item.distance);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "parking":
        return <Car className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`group h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer-when-downgrade"
          loading="lazy"
        />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {item.type}
        </Badge>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm font-medium">{item.rating}</span>
        </div>
      </div>

      <div className="p-4 flex flex-1 flex-col">
        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>
            {showsDistanceKm ? `${item.distance} from campus` : item.distance}
          </span>
        </div>

        <div className="flex gap-2 mb-3">
          {item.amenities.slice(0, 3).map((amenity) => (
            <div
              key={amenity}
              className="p-1.5 bg-secondary rounded-lg"
              title={amenity}
            >
              {getAmenityIcon(amenity)}
            </div>
          ))}
        </div>

        {item.comment && (
          <p className="text-muted-foreground text-xs italic mb-3">
            "{item.comment}"
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-primary">
                ₹{item.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs">/month</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.reviews} reviews
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => onReview(item)}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

const AccommodationDetails = () => {
  const { openSignIn } = useClerk();
  const { isSignedIn, user } = useUser();
  const { items: accommodations, loading } = useAccommodations();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortType>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Accommodation | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5 | null>(
    null,
  );
  const [stayType, setStayType] = useState<StayType | "">("");
  const [reviewsByItem, setReviewsByItem] = useState<
    Record<string, UserReview[]>
  >({});

  const openReviewDialog = (item: Accommodation) => {
    setActiveItem(item);
    setReviewText("");
    setReviewRating(null);
    setStayType("");
    setReviewOpen(true);
  };

  const submitReview = () => {
    if (!activeItem || !isSignedIn) return;
    const text = reviewText.trim();
    if (!text || !reviewRating || !stayType) return;

    const newReview: UserReview = {
      id: `${activeItem.id}-${Date.now()}`,
      text,
      createdAt: new Date().toLocaleString(),
      author:
        user?.firstName ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress ||
        "User",
      rating: reviewRating,
      stayType,
    };

    setReviewsByItem((prev) => ({
      ...prev,
      [activeItem.id]: [newReview, ...(prev[activeItem.id] || [])],
    }));
    setReviewText("");
    setReviewRating(null);
    setStayType("");
  };

  const filteredItems = accommodations
    .filter((item) => filter === "all" || item.type === filter)
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "distance")
        return parseFloat(a.distance) - parseFloat(b.distance);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200"
            alt="Accommodation Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/80 to-purple-600/80 dark:from-violet-700/70 dark:to-purple-800/70" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link
                to="/home"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Accommodation
              </h1>
              <p className="text-white/90 mt-2">
                Find your perfect home away from home
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-muted-foreground text-sm">
              {filteredItems.length} options found
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                {(["all", "Hostel", "PG", "Apartment"] as TypeFilter[]).map(
                  (f) => (
                    <Button
                      key={f}
                      variant={filter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All" : f}
                    </Button>
                  ),
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Button
                  variant={sort === "price-low" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSort("price-low")}
                >
                  Price ↑
                </Button>
                <Button
                  variant={sort === "rating" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSort("rating")}
                >
                  Rating
                </Button>
                <Button
                  variant={sort === "distance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSort("distance")}
                >
                  Nearest
                </Button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden bg-card rounded-xl p-4 mb-6 border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">
                    Type
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "Hostel", "PG", "Apartment"] as TypeFilter[]).map(
                      (f) => (
                        <Button
                          key={f}
                          variant={filter === f ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilter(f)}
                        >
                          {f === "all" ? "All" : f}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">
                    Sort
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sort === "price-low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("price-low")}
                    >
                      Price ↑
                    </Button>
                    <Button
                      variant={sort === "rating" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("rating")}
                    >
                      Rating
                    </Button>
                    <Button
                      variant={sort === "distance" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("distance")}
                    >
                      Nearest
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <AccommodationCard
                key={item.id}
                item={item}
                index={index}
                onReview={openReviewDialog}
              />
            ))}
          </div>

          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="sm:max-w-lg [&>button]:hidden">
              <DialogHeader>
                <DialogTitle>
                  Reviews{activeItem ? ` - ${activeItem.name}` : ""}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {activeItem && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground font-medium">
                        Listing review stats
                      </p>
                      <Badge variant="secondary">
                        {activeItem.reviews} reviews
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Showing current listing count; user-posted reviews appear
                      below.
                    </p>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                  {activeItem &&
                  (reviewsByItem[activeItem.id] || []).length > 0 ? (
                    (reviewsByItem[activeItem.id] || []).map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="text-sm">
                            {
                              ratingOptions.find(
                                (r) => r.value === review.rating,
                              )?.emoji
                            }{" "}
                            {
                              ratingOptions.find(
                                (r) => r.value === review.rating,
                              )?.label
                            }
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {review.stayType.replace("-", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{review.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {review.author} · {review.createdAt}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No user-posted reviews yet.
                    </p>
                  )}
                </div>

                <SignedIn>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Your rating (required)
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {ratingOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setReviewRating(option.value)}
                            className={`rounded-md border px-2 py-2 text-center transition-colors ${
                              reviewRating === option.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <div className="text-lg leading-none">
                              {option.emoji}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {option.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="stayType"
                        className="mb-2 block text-sm font-medium text-foreground"
                      >
                        Stay type (required)
                      </label>
                      <select
                        id="stayType"
                        value={stayType}
                        onChange={(e) =>
                          setStayType(e.target.value as StayType | "")
                        }
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                      >
                        <option value="">Select stay type</option>
                        <option value="short-stay">Short stay</option>
                        <option value="long-term">Long term</option>
                        <option value="shared">Shared</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={submitReview}
                        disabled={
                          !reviewText.trim() || !reviewRating || !stayType
                        }
                      >
                        Post Review
                      </Button>
                    </div>
                  </div>
                </SignedIn>

                <SignedOut>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    You need to sign in to post a review.
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewOpen(false);
                          window.setTimeout(() => openSignIn(), 0);
                        }}
                      >
                        Sign in to Post Review
                      </Button>
                    </div>
                  </div>
                </SignedOut>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccommodationDetails;

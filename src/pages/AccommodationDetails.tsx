import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Wifi, Car, Shield, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useAccommodations, type Accommodation } from "@/hooks/useAccommodations";

const ACCOMMODATION_FILTER_GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "Hostel", label: "Hostel" },
      { value: "PG", label: "PG" },
      { value: "Apartment", label: "Apartment" },
      { value: "Co-living", label: "Co-living" },
    ],
  },
  {
    key: "price",
    label: "Price Range",
    options: [
      { value: "all", label: "Any" },
      { value: "0-5000", label: "Under \u20B95K/mo" },
      { value: "5000-10000", label: "\u20B95K\u2013\u20B910K" },
      { value: "10000-20000", label: "\u20B910K\u2013\u20B920K" },
      { value: "20000+", label: "\u20B920K+" },
    ],
  },
];

const ACCOMMODATION_SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "distance", label: "Nearest" },
];

const AccommodationCard = ({
  item,
  index,
  onReview,
  userReviews,
}: {
  item: Accommodation;
  index: number;
  onReview: (item: Accommodation) => void;
  userReviews?: ReviewEntry[];
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const showsDistanceKm = /\bkm\b/i.test(item.distance);

  const stats = computeCombinedReviewStats(item.rating, item.reviews, userReviews);

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
          <span className="text-white text-sm font-medium">
            {stats.emoji ? `${stats.emoji} ` : ""}
            {stats.averageRating > 0
              ? stats.averageRating.toFixed(1)
              : item.rating.toFixed(1)}
          </span>
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
              Google • {formatCompactCount(stats.totalReviews)} ratings
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
  const { items: accommodations, loading } = useAccommodations();
  const [filters, setFilters] = useState<FilterState>({ type: "all", price: "all" });
  const [sort, setSort] = useState("default");

  const filteredItems = useMemo(() => {
    let result = accommodations.filter((item) => {
      const typeVal = filters.type as string;
      if (typeVal !== "all" && item.type !== typeVal) return false;

      const priceVal = filters.price as string;
      if (priceVal === "0-5000" && item.price > 5000) return false;
      if (priceVal === "5000-10000" && (item.price < 5000 || item.price > 10000)) return false;
      if (priceVal === "10000-20000" && (item.price < 10000 || item.price > 20000)) return false;
      if (priceVal === "20000+" && item.price < 20000) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "distance")
        return parseFloat(a.distance) - parseFloat(b.distance);
      return 0;
    });

    return result;
  }, [accommodations, filters, sort]);

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
          <div className="mb-6">
            <FilterSortBar
              filterGroups={ACCOMMODATION_FILTER_GROUPS}
              sortOptions={ACCOMMODATION_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <AccommodationCard
                key={item.id}
                item={item}
                index={index}
                onReview={openReviewDialog}
                userReviews={reviewsByItem[item.id]}
              />
            ))}
          </div>

          <ReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            activeItem={activeItem}
            reviewsByItem={reviewsByItem}
            setReviewsByItem={setReviewsByItem}
            contextLabel="Stay type"
            contextPlaceholder="Select stay type"
            contextOptions={STAY_TYPE_OPTIONS}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccommodationDetails;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Wifi, Car, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeCombinedReviewStats, formatCompactCount } from "@/lib/reviewStats";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useAccommodations, type Accommodation } from "@/hooks/useAccommodations";
import { AccommodationCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";
const STAY_TYPE_OPTIONS = [
  { value: "hostel", label: "Hostel" },
  { value: "pg", label: "PG" },
  { value: "apartment", label: "Apartment" },
  { value: "co-living", label: "Co-living" },
];

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
      { value: "Hotel", label: "Hotel" },
    ],
  },
  {
    key: "price",
    label: "Price Range",
    options: [
      { value: "all", label: "Any" },
      { value: "under-8k", label: "Under \u20B98K/mo" },
      { value: "8k-12k", label: "\u20B98K\u2013\u20B912K" },
      { value: "12k-20k", label: "\u20B912K\u2013\u20B920K" },
      { value: "20k+", label: "\u20B920K+" },
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
}: {
  item: Accommodation;
  index: number;
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const showsDistanceKm = /\bkm\b/i.test(item.distance);

  const stats = computeCombinedReviewStats(item.rating, item.reviews, undefined);

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

  const AMENITY_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
    wifi: { icon: <Wifi className="w-3 h-3" />, label: "WiFi" },
    parking: { icon: <Car className="w-3 h-3" />, label: "Parking" },
    security: { icon: <Shield className="w-3 h-3" />, label: "Security" },
  };

  return (
    <Link to={`/accommodation/${item.id}`} className="block">
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
        <h3 className="min-h-[3.5rem] line-clamp-2 font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        <div className="mb-3 flex min-h-6 items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-1">
            {item.distance
              ? showsDistanceKm
                ? `${item.distance} from campus`
                : item.distance
              : "Nearby campus"}
          </span>
        </div>

        <div className="mb-4 min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
          <p className="line-clamp-3">{item.address || "Address unavailable"}</p>
        </div>

        <div className="mb-4 flex min-h-10 flex-wrap gap-2">
          {item.amenities.slice(0, 3).map((amenity) => {
            const info = AMENITY_MAP[amenity.toLowerCase()];
            if (!info) return null;
            return (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {info.icon}
                {info.label}
              </span>
            );
          })}
        </div>

        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-primary">
                {item.display_price_label ?? `₹${item.price.toLocaleString()}/mo`}
              </span>
            </div>
            <span className="hidden text-xs text-muted-foreground">
              Google • {formatCompactCount(stats.totalReviews)} ratings
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {item.type}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/accommodation/${item.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
    </Link>
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
      if (priceVal === "under-8k" && item.price >= 8000) return false;
      if (priceVal === "8k-12k" && (item.price < 8000 || item.price > 12000)) return false;
      if (priceVal === "12k-20k" && (item.price < 12000 || item.price > 20000)) return false;
      if (priceVal === "20k+" && item.price <= 20000) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "distance") {
        const aNum = parseFloat(a.distance || "");
        const bNum = parseFloat(b.distance || "");
        const safeA = Number.isFinite(aNum) ? aNum : Number.POSITIVE_INFINITY;
        const safeB = Number.isFinite(bNum) ? bNum : Number.POSITIVE_INFINITY;
        return safeA - safeB;
      }
      return 0;
    });

    return result;
  }, [accommodations, filters, sort]);

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

          {loading ? (
            <SkeletonGrid count={6} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AccommodationCardSkeleton />
            </SkeletonGrid>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <AccommodationCard key={item.id} item={item} index={index} />
            ))}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccommodationDetails;

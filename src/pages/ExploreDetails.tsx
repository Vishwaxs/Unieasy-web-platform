import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeCombinedReviewStats, formatCompactCount } from "@/lib/reviewStats";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useExplorePlaces, type ExplorePlace } from "@/hooks/useExplorePlaces";
import { ExploreCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";

const HANGOUT_TYPE_OPTIONS = [
  { value: "daytime", label: "Daytime Visit" },
  { value: "evening", label: "Evening Visit" },
  { value: "weekend", label: "Weekend Trip" },
];

const EXPLORE_FILTER_GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "Park", label: "Park" },
      { value: "Cafe", label: "Cafe" },
      { value: "Mall", label: "Mall" },
      { value: "Scenic", label: "Scenic" },
      { value: "Sports", label: "Sports" },
      { value: "Culture", label: "Culture" },
    ],
  },
  {
    key: "crowd",
    label: "Crowd Level",
    options: [
      { value: "all", label: "Any" },
      { value: "Low", label: "Low" },
      { value: "Medium", label: "Medium" },
      { value: "High", label: "High" },
    ],
  },
];

const EXPLORE_SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "rating", label: "Rating" },
];

const PlaceCard = ({
  item,
  index,
}: {
  item: ExplorePlace;
  index: number;
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const stats = computeCombinedReviewStats(item.rating, item.reviews, undefined);

  const getCrowdColor = (crowd: string) => {
    switch (crowd) {
      case "Low":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "High":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Link to={`/explore/${item.id}`} className="block">
    <div
      ref={cardRef}
      className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
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
        <Badge className="absolute top-3 left-3 bg-primary">{item.type}</Badge>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm">
            {stats.emoji ? `${stats.emoji} ` : ""}
            {stats.averageRating > 0
              ? stats.averageRating.toFixed(1)
              : item.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-1 flex-col">
        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-3 h-3" />
            <span>{item.distance}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-3 h-3" />
            <span>{item.timing}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-3 h-3 text-muted-foreground" />
            <Badge
              className={`${getCrowdColor(item.crowd)} text-white text-xs`}
            >
              {item.crowd} Crowd
            </Badge>
          </div>
        </div>

        <p className="text-muted-foreground text-xs italic">"{item.comment}"</p>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Google • {formatCompactCount(stats.totalReviews)} ratings
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/explore/${item.id}#reviews`);
            }}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
    </Link>
  );
};

const ExploreDetails = () => {
  const [filters, setFilters] = useState<FilterState>({ type: "all", crowd: "all" });
  const [sort, setSort] = useState("default");
  const { items: places, loading } = useExplorePlaces({
    category: "hangout",
    selectedType: (filters.type as string) || "all",
  });

  const filteredItems = useMemo(() => {
    let result = places.filter((item) => {
      const typeVal = filters.type as string;
      // Type filtering is handled in the data hook (type/sub_type aware).
      // Keep a no-op guard here so UI logic stays stable if hook params change.
      if (typeVal !== "all" && !item.type) return false;

      const crowdVal = filters.crowd as string;
      if (crowdVal !== "all" && item.crowd !== crowdVal) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });

    return result;
  }, [places, filters, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200"
            alt="Explore Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 dark:from-emerald-700/70 dark:to-teal-800/70" />
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
                Explore Nearby
              </h1>
              <p className="text-white/90 mt-2">
                Discover amazing places around your campus
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <FilterSortBar
              filterGroups={EXPLORE_FILTER_GROUPS}
              sortOptions={EXPLORE_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ type: "all", crowd: "all" });
                  setSort("default");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid count={6} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ExploreCardSkeleton />
            </SkeletonGrid>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <PlaceCard key={item.id} item={item} index={index} />
            ))}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreDetails;

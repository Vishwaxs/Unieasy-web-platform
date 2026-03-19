import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Drumstick, Leaf, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeCombinedReviewStats, formatCompactCount } from "@/lib/reviewStats";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useFoodItems, type FoodItem } from "@/hooks/useFoodItems";
import { FoodCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";

const VISIT_TYPE_OPTIONS = [
  { value: "dine-in", label: "Dine-in" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

const FOOD_FILTER_GROUPS = [
  {
    key: "diet",
    label: "Veg / Non-Veg",
    options: [
      { value: "all", label: "All" },
      { value: "veg", label: "Veg Only" },
      { value: "nonveg", label: "Non-Veg Only" },
    ],
  },
  {
    key: "rating",
    label: "Rating",
    options: [
      { value: "all", label: "Any" },
      { value: "4.5", label: "4.5+" },
      { value: "4.0", label: "4.0+" },
      { value: "3.5", label: "3.5+" },
    ],
  },
  {
    key: "price",
    label: "Price for Two",
    options: [
      { value: "all", label: "Any" },
      { value: "0-300", label: "Under ₹300" },
      { value: "300-600", label: "₹300–₹600" },
      { value: "600-1200", label: "₹600–₹1,200" },
      { value: "1200+", label: "₹1,200+" },
    ],
  },
];

const FOOD_SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "rating", label: "Rating" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "reviews", label: "Most Reviewed" },
];

const FoodCard = ({
  item,
  index,
}: {
  item: FoodItem;
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

  return (
    <Link to={`/food/${item.id}`} className="block">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent dark:from-background/70 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge
          className={`absolute top-3 left-3 ${item.is_veg === true ? "bg-green-500" : item.is_veg === false ? "bg-red-500" : "bg-amber-500"} text-white border-0`}
        >
          {item.is_veg === true ? <Leaf className="w-3 h-3 mr-1" /> : item.is_veg === false ? <Drumstick className="w-3 h-3 mr-1" /> : null}
          {item.is_veg === true ? "Veg" : item.is_veg === false ? "Non-Veg" : "Mixed"}
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
        <div className="mb-3 flex min-h-6 items-start gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="line-clamp-1">{item.restaurant}</p>
        </div>

        <div className="mb-4 min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
          <p>{item.address || "Address unavailable"}</p>
        </div>

        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="flex items-center gap-2">
            {(() => {
              const raw = item.display_price_label ?? `₹${item.price}`;
              const priceText = raw.replace(" for two", "").trim();
              const isFree = priceText.toLowerCase() === "free";
              return (
                <>
                  <span className="text-lg font-bold text-primary">{priceText}</span>
                  {!isFree && <span className="text-xs text-muted-foreground">for two</span>}
                </>
              );
            })()}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/food/${item.id}`);
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

const FoodDetails = () => {
  const { items: foodItems, loading } = useFoodItems();
  const [filters, setFilters] = useState<FilterState>({ diet: "all", rating: "all", price: "all" });
  const [sort, setSort] = useState("default");

  const filteredItems = useMemo(() => {
    let result = foodItems.filter((item) => {
      // Diet filter
      const diet = filters.diet as string;
      if (diet === "veg" && item.is_veg !== true) return false;
      if (diet === "nonveg" && item.is_veg !== false) return false;

      // Rating filter
      const rating = filters.rating as string;
      if (rating !== "all") {
        const min = parseFloat(rating);
        if (item.rating < min) return false;
      }

      // Price filter (price for two)
      const price = filters.price as string;
      if (price === "0-300" && item.price > 300) return false;
      if (price === "300-600" && (item.price < 300 || item.price > 600)) return false;
      if (price === "600-1200" && (item.price < 600 || item.price > 1200)) return false;
      if (price === "1200+" && item.price < 1200) return false;

      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "reviews") return b.reviews - a.reviews;
      return 0;
    });

    return result;
  }, [foodItems, filters, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        {/* Hero Banner */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
            alt="Food Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-red-600/80 dark:from-orange-700/70 dark:to-red-800/70" />
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
                Food & Eating
              </h1>
              <p className="text-white/90 mt-2">
                Discover the best food spots around campus
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <FilterSortBar
              filterGroups={FOOD_FILTER_GROUPS}
              sortOptions={FOOD_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          {/* Food Grid */}
          {loading ? (
            <SkeletonGrid count={8} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <FoodCardSkeleton />
            </SkeletonGrid>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <FoodCard key={item.id} item={item} index={index} />
            ))}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FoodDetails;

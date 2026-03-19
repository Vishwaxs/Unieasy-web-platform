import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useEssentials, type EssentialItem } from "@/hooks/useEssentials";
import { EssentialsCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";

const ESSENTIALS_FILTER_GROUPS = [
  {
    key: "category",
    label: "Category",
    options: [
      { value: "all", label: "All" },
      { value: "health", label: "Health" },
      { value: "services", label: "Services" },
      { value: "fitness", label: "Fitness" },
      { value: "essentials", label: "Essentials" },
      { value: "safety", label: "Safety" },
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
];

const ESSENTIALS_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name A–Z" },
];

const ItemCard = ({
  item,
  index,
}: {
  item: EssentialItem;
  index: number;
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link to={`/essentials/${item.id}`} className="block">
      <div
        ref={cardRef}
        className={`group h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
        <div className="relative h-40 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-xs capitalize">{item.category}</Badge>
          </div>
          {item.rating > 0 && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{item.rating}</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-1 flex-col">
          <h3 className="min-h-[3.5rem] line-clamp-2 font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors capitalize">
            {item.name}
          </h3>
          <div className="mb-3 flex min-h-6 items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{item.distance}</span>
          </div>
          <div className="mb-4 min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            <p className="line-clamp-3">{item.address || "Address unavailable"}</p>
          </div>
          <div className="mt-auto border-t border-border/60 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/essentials/${item.id}`);
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

const EssentialsDetails = () => {
  const { items: essentialItems, loading } = useEssentials();
  const [filters, setFilters] = useState<FilterState>({ category: "all", rating: "all" });
  const [sort, setSort] = useState("default");

  const filteredItems = useMemo(() => {
    let result = essentialItems.filter((item) => {
      const catVal = filters.category as string;
      if (catVal !== "all" && item.category !== catVal) return false;

      const ratingVal = filters.rating as string;
      if (ratingVal !== "all" && item.rating < parseFloat(ratingVal)) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [essentialItems, filters, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200"
            alt="Essentials Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/80 to-rose-600/80 dark:from-pink-700/70 dark:to-rose-800/70" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Essentials & More
              </h1>
              <p className="text-white/90 mt-2">Everything you need as a student</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <FilterSortBar
              filterGroups={ESSENTIALS_FILTER_GROUPS}
              sortOptions={ESSENTIALS_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          {loading ? (
            <SkeletonGrid count={8} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <EssentialsCardSkeleton />
            </SkeletonGrid>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No essentials found matching your filters.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EssentialsDetails;

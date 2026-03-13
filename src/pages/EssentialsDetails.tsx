import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import SponsoredCard from "@/components/SponsoredCard";
import { useEssentials, type EssentialItem } from "@/hooks/useEssentials";
import { useActiveAds } from "@/hooks/useActiveAds";

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

const categories = [
  {
    id: "essentials",
    name: "Student Essentials",
    icon: ShoppingBag,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "safety",
    name: "Safety & Emergency",
    icon: Shield,
    color: "from-red-500 to-orange-500",
  },
  {
    id: "discounts",
    name: "Student Discounts & Deals",
    icon: Tag,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "events",
    name: "Events & Community",
    icon: Calendar,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "career",
    name: "Career & Skill Support",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
  },
];

const ItemCard = ({
  item,
  index,
  onReview,
  userReviews,
}: {
  item: EssentialItem;
  index: number;
  onReview: (item: EssentialItem) => void;
  userReviews?: ReviewEntry[];
}) => {
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
        className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
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

        <div className="p-4">
          <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="w-3 h-3" />
            <span>{item.distance}</span>
          </div>
          {item.comment && (
            <p className="text-muted-foreground text-xs line-clamp-2">{item.comment}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

const EssentialsDetails = () => {
  const { items: essentialItems, loading } = useEssentials();
  const { data: activeAds } = useActiveAds();
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
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200"
            alt="Essentials Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/80 to-rose-600/80 dark:from-pink-700/70 dark:to-rose-800/70" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ItemCard item={item} index={index} />
                {activeAds && activeAds.length > 0 && (index + 1) % 5 === 0 && (
                  <SponsoredCard ad={activeAds[Math.floor(index / 5) % activeAds.length]} />
                )}
              </React.Fragment>
            ))}
          </div>

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

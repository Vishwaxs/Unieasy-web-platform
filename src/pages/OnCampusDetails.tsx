import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import SponsoredCard from "@/components/SponsoredCard";
import { useCampusPlaces, type CampusPlace } from "@/hooks/useCampusPlaces";
import { useActiveAds } from "@/hooks/useActiveAds";
import { CampusCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";

const CAMPUS_FILTER_GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "Food", label: "Food" },
      { value: "Shop", label: "Shop" },
      { value: "Services", label: "Services" },
      { value: "Study", label: "Study" },
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

const CAMPUS_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name A–Z" },
];

const CampusCard = ({ item, index }: { item: CampusPlace; index: number }) => {
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

  const getCrowdColor = (crowd: string) => {
    switch (crowd) {
      case "Low": return "bg-green-500";
      case "Medium": return "bg-yellow-500";
      case "High": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Link to={`/campus/${item.id}`} className="block">
      <div
        ref={cardRef}
        className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
        <div className="relative h-44 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
          />
          <Badge className="absolute top-3 left-3 bg-primary">{item.subType || item.type}</Badge>
          {item.rating > 0 && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{item.rating}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-3 h-3" />
              <span>{item.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-3 h-3" />
              <span>{item.timing}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-3 h-3 text-muted-foreground" />
              <Badge className={`${getCrowdColor(item.crowdLevel)} text-white text-xs`}>
                {item.crowdLevel} Crowd
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const OnCampusDetails = () => {
  const { items: places, loading } = useCampusPlaces();
  const { data: activeAds } = useActiveAds();
  const [filters, setFilters] = useState<FilterState>({ type: "all", crowd: "all" });
  const [sort, setSort] = useState("default");

  const filteredItems = useMemo(() => {
    let result = places.filter((item) => {
      const typeVal = filters.type as string;
      if (typeVal !== "all" && item.type !== typeVal) return false;

      const crowdVal = filters.crowd as string;
      if (crowdVal !== "all" && item.crowdLevel !== crowdVal) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "name") return a.name.localeCompare(b.name);
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
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200"
            alt="On Campus Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/80 to-slate-900/80 dark:from-slate-800/70 dark:to-background/80" />
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
                On Christ Central Campus
              </h1>
              <p className="text-white/90 mt-2">
                Find on-campus shops, cafes, and services
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <FilterSortBar
              filterGroups={CAMPUS_FILTER_GROUPS}
              sortOptions={CAMPUS_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          {loading ? (
            <SkeletonGrid count={6} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <CampusCardSkeleton />
            </SkeletonGrid>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <CampusCard item={item} index={index} />
                {activeAds && activeAds.length > 0 && (index + 1) % 5 === 0 && (
                  <SponsoredCard ad={activeAds[Math.floor(index / 5) % activeAds.length]} />
                )}
              </React.Fragment>
            ))}
          </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No on-campus places found matching your filters.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OnCampusDetails;

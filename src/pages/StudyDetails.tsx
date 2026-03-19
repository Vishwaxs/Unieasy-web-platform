import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Clock, Wifi, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  computeCombinedReviewStats,
  formatCompactCount,
} from "@/lib/reviewStats";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useStudySpots, type StudySpot } from "@/hooks/useStudySpots";
import { StudyCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";

const STUDY_SESSION_TYPE_OPTIONS = [
  { value: "solo", label: "Solo Study" },
  { value: "group", label: "Group Study" },
  { value: "exam-prep", label: "Exam Prep" },
];

const STUDY_FILTER_GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "Library", label: "Library" },
      { value: "Cafe", label: "Cafe" },
      { value: "Coworking", label: "Coworking" },
      { value: "Outdoor", label: "Outdoor" },
      { value: "Lab", label: "Lab" },
    ],
  },
];

const STUDY_SORT_OPTIONS = [{ value: "rating", label: "Rating" }];

const StudyCard = ({ item, index }: { item: StudySpot; index: number }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = computeCombinedReviewStats(
    item.rating,
    item.reviews,
    undefined,
  );

  const getNoiseIcon = (noise: string) => {
    return noise === "Silent" ? (
      <VolumeX className="w-4 h-4" />
    ) : (
      <Volume2 className="w-4 h-4" />
    );
  };

  return (
    <Link to={`/study/${item.id}`} className="block">
      <div
        ref={cardRef}
        className={`group h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
          isVisible ? "opacity-100" : "opacity-0"
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
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {item.type.map((t) => (
              <Badge key={t} className="bg-primary text-xs">
                {t}
              </Badge>
            ))}
          </div>
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
          <h3 className="min-h-[3.5rem] line-clamp-2 font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors capitalize">
            {item.name}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="line-clamp-1">{item.distance}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="line-clamp-1">{item.timing}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                {getNoiseIcon(item.noise)}
                <span className="text-muted-foreground">{item.noise}</span>
              </div>
              {item.has_wifi && (
                <div className="flex items-center gap-1 text-sm text-green-500">
                  <Wifi className="w-4 h-4" />
                  <span>WiFi</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            <p className="line-clamp-3">
              {item.address || "Address unavailable"}
            </p>
          </div>

          <div className="mt-auto border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="hidden text-xs text-muted-foreground">
                Google • {formatCompactCount(stats.totalReviews)} ratings
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {item.noise}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/study/${item.id}`);
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

const StudyDetails = () => {
  const { items: studySpots, loading } = useStudySpots();
  const [filters, setFilters] = useState<FilterState>({ type: "all" });
  const [sort, setSort] = useState("rating");

  const filteredItems = useMemo(() => {
    let result = studySpots.filter((item) => {
      const typeVal = filters.type as string;
      if (typeVal !== "all" && !item.type.includes(typeVal)) return false;

      return true;
    });

    result = [...result].sort((a, b) => b.rating - a.rating);

    return result;
  }, [studySpots, filters, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200"
            alt="Study Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 dark:from-blue-700/70 dark:to-cyan-800/70" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Study Zones
              </h1>
              <p className="text-white/90 mt-2">
                Find the perfect spot to focus and learn
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <FilterSortBar
              filterGroups={STUDY_FILTER_GROUPS}
              sortOptions={STUDY_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          {loading ? (
            <SkeletonGrid
              count={6}
              gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <StudyCardSkeleton />
            </SkeletonGrid>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <StudyCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudyDetails;

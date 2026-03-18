import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Search, Star, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  id: string;
  name: string;
  category: string;
  type: string | null;
  sub_type: string | null;
  address: string | null;
  rating: number;
  rating_count: number;
  primary_photo_url: string | null;
  distance_from_campus: string | null;
  price_display: string | null;
  is_on_campus: boolean;
}

function resultLink(item: SearchResult): string {
  if (item.is_on_campus || item.category === "campus" || item.category === "oncampus") {
    return `/campus/${item.id}`;
  }
  if (item.category === "food") return `/food/${item.id}`;
  if (item.category === "accommodation") return `/accommodation/${item.id}`;
  if (item.category === "study") return `/study/${item.id}`;
  if (item.category === "explore" || item.category === "hangout") return `/explore/${item.id}`;
  return `/essentials/${item.id}`;
}

function resultImage(item: SearchResult): string {
  if (item.primary_photo_url) return item.primary_photo_url;
  return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400";
}

function categoryBadgeLabel(item: SearchResult): string {
  if (item.is_on_campus || item.category === "campus" || item.category === "oncampus") {
    return "On Campus";
  }
  const labels: Record<string, string> = {
    food: "Food & Dining",
    accommodation: "Accommodation",
    study: "Study Spots",
    explore: "Explore Nearby",
    hangout: "Explore Nearby",
    health: "Health & Fitness",
    fitness: "Health & Fitness",
    services: "Essentials",
    essentials: "Essentials",
    transport: "Essentials",
  };
  return labels[item.category] || item.category.charAt(0).toUpperCase() + item.category.slice(1);
}

type CategorySection =
  | "Food & Dining"
  | "Accommodation"
  | "Study Spots"
  | "Explore Nearby"
  | "Health & Fitness"
  | "Essentials";

function sectionForResult(item: SearchResult): CategorySection {
  if (item.category === "food") return "Food & Dining";
  if (item.category === "accommodation") return "Accommodation";
  if (item.category === "study") return "Study Spots";
  if (item.category === "explore" || item.category === "hangout") return "Explore Nearby";
  if (item.category === "health" || item.category === "fitness") return "Health & Fitness";
  return "Essentials";
}

function Stars({ rating }: { rating: number }) {
  const safe = Number.isFinite(rating) ? rating : 0;
  const full = Math.max(0, Math.min(5, Math.round(safe)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={[
            "h-4 w-4",
            i < full ? "fill-primary text-primary" : "text-muted-foreground/40",
          ].join(" ")}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{safe > 0 ? safe.toFixed(1) : "—"}</span>
    </div>
  );
}

const ResultCard = ({ item }: { item: SearchResult }) => (
  <Link
    to={resultLink(item)}
    className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30"
  >
    <div className="relative h-40 overflow-hidden">
      <img
        src={resultImage(item)}
        alt={item.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Badge className="absolute top-3 left-3 bg-primary text-xs">
        {categoryBadgeLabel(item)}
      </Badge>
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {item.name}
      </h3>
      <div className="flex items-center justify-between gap-3 mb-2">
        <Stars rating={item.rating} />
        {item.price_display ? (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span className="truncate">{item.price_display}</span>
          </div>
        ) : null}
      </div>

      {item.distance_from_campus ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{item.distance_from_campus}</span>
        </div>
      ) : null}

      {item.address ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.address}</p>
      ) : null}
    </div>
  </Link>
);

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paramQuery = new URLSearchParams(location.search).get("q") || "";
  const [query, setQuery] = useState(paramQuery);

  useEffect(() => {
    setQuery(paramQuery);
  }, [paramQuery]);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["search", paramQuery],
    queryFn: async () => {
      const q = paramQuery.trim();
      if (!q) return [];

      const selectCols =
        "id, name, category, type, sub_type, address, rating, rating_count, primary_photo_url, distance_from_campus, price_display, is_on_campus";

      const [ftsRes, ilikeRes] = await Promise.all([
        supabase
          .from("places")
          .select(selectCols)
          .textSearch("fts", q, { type: "websearch", config: "simple" })
          .limit(30),
        supabase
          .from("places")
          .select(selectCols)
          .or(`name.ilike.%${q}%,address.ilike.%${q}%,type.ilike.%${q}%`)
          .limit(20),
      ]);

      const merged = new Map<string, SearchResult>();
      for (const row of (ftsRes.data ?? []) as SearchResult[]) merged.set(row.id, row);
      for (const row of (ilikeRes.data ?? []) as SearchResult[]) merged.set(row.id, row);

      return Array.from(merged.values());
    },
    enabled: paramQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const grouped = useMemo(() => {
    if (!results) return {};
    const groups: Partial<Record<CategorySection, SearchResult[]>> = {};
    for (const item of results) {
      const section = sectionForResult(item);
      if (!groups[section]) groups[section] = [];
      groups[section]!.push(item);
    }
    return groups;
  }, [results]);

  const totalResults = results?.length ?? 0;
  const hasQuery = paramQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-10">
        <section className="container mx-auto px-4 md:px-6">
          <div className="bg-card/80 border border-border rounded-2xl p-4 md:p-6 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Search Across All Modules
            </h1>
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = query.trim();
                if (!trimmed) return;
                navigate(`/search?q=${encodeURIComponent(trimmed)}`);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for food, hostels, places..."
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground outline-none focus:border-primary/50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>
            {hasQuery && !isLoading && (
              <p className="mt-3 text-sm text-muted-foreground">
                {totalResults} result{totalResults === 1 ? "" : "s"} for "{paramQuery}"
              </p>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-8 space-y-10">
          {!hasQuery && (
            <div className="text-muted-foreground">
              Enter a search term to find results across Food, Accommodation, Explore, Study, and Essentials.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasQuery && !isLoading && totalResults === 0 && (
            <div className="text-muted-foreground">
              No results found for "{paramQuery}"
            </div>
          )}

          {(
            [
              "Food & Dining",
              "Accommodation",
              "Study Spots",
              "Explore Nearby",
              "Health & Fitness",
              "Essentials",
            ] as const
          )
            .filter((section) => (grouped[section]?.length ?? 0) > 0)
            .map((section) => (
              <div key={section}>
                <h2 className="text-xl font-semibold text-foreground mb-4">{section}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {(grouped[section] ?? []).map((item) => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;

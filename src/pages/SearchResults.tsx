import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { placePhotoUrl } from "@/hooks/usePlaceDetail";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface SearchResult {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
  type: string | null;
  address: string | null;
  rating: number;
  image_url: string | null;
  photo_refs: string[] | null;
  is_on_campus: boolean;
}

function resultLink(item: SearchResult): string {
  const cat = item.category;
  if (cat === "food") return `/food/${item.id}`;
  if (cat === "accommodation") return `/accommodation/${item.id}`;
  if (cat === "study") return `/study/${item.id}`;
  if (cat === "explore" || cat === "hangout") return `/explore/${item.id}`;
  if (cat === "campus" || cat === "oncampus") return `/campus/${item.id}`;
  return `/essentials/${item.id}`;
}

function resultImage(item: SearchResult): string {
  if (item.photo_refs && item.photo_refs.length > 0) {
    return placePhotoUrl(item.id, 0);
  }
  if (item.image_url) return item.image_url;
  return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400";
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    food: "Food & Eating",
    accommodation: "Accommodation",
    study: "Study Zones",
    explore: "Explore",
    hangout: "Explore",
    campus: "On Campus",
    oncampus: "On Campus",
    essentials: "Essentials",
    health: "Essentials",
    services: "Essentials",
    transport: "Essentials",
  };
  return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
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
      <Badge className="absolute top-3 left-3 bg-primary text-xs">{categoryLabel(item.category)}</Badge>
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {item.name}
      </h3>
      {item.sub_type && (
        <p className="text-xs text-muted-foreground mb-1">{item.sub_type}</p>
      )}
      {item.address && (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.address}</p>
      )}
    </div>
  </Link>
);

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const paramQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(paramQuery);

  useEffect(() => {
    setQuery(paramQuery);
  }, [paramQuery]);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["search", paramQuery],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/places/search?q=${encodeURIComponent(paramQuery)}&limit=30`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: paramQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const grouped = useMemo(() => {
    if (!results) return {};
    const groups: Record<string, SearchResult[]> = {};
    for (const item of results) {
      const label = categoryLabel(item.category);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
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
                setParams({ q: trimmed });
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {hasQuery && !isLoading && totalResults === 0 && (
            <div className="text-muted-foreground">
              No results found. Try a different keyword.
            </div>
          )}

          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <h2 className="text-xl font-semibold text-foreground mb-4">{label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {items.map((item) => (
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

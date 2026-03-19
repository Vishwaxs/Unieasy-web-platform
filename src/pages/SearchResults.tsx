import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Search, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { shortAddress } from "@/lib/utils";
import RatingBadge from "@/components/RatingBadge";

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
  photo_refs: unknown[] | null;
  distance_from_campus: string | null;
  price_display: string | null;
  is_on_campus: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

const FALLBACKS: Record<string, string[]> = {
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400",
  ],
  accommodation: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
  ],
  study: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
  ],
  campus: [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=400",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400",
    "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400",
  ],
  explore: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400",
    "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=400",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400",
  ],
  default: [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=400",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400",
    "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400",
  ],
};

// Type/name-based image overrides — checked before category fallback
const TYPE_IMAGE_RULES: Array<{ keywords: string[]; images: string[] }> = [
  {
    keywords: ["swimming", "pool", "aquatic"],
    images: [
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400",
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400",
      "https://images.unsplash.com/photo-1560090995-01632a28895b?w=400",
    ],
  },
  {
    keywords: ["barber", "salon", "hair", "beauty", "grooming", "spa"],
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400",
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
    ],
  },
  {
    keywords: ["gym", "fitness", "workout", "sports complex", "badminton", "cricket", "basketball", "football", "tennis", "volleyball"],
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400",
    ],
  },
  {
    keywords: ["medical", "health", "clinic", "hospital", "pharmacy", "dispensary", "infirmary"],
    images: [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
      "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400",
    ],
  },
  {
    keywords: ["bank", "atm", "finance", "cash"],
    images: [
      "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    ],
  },
  {
    keywords: ["library", "reading", "books"],
    images: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    ],
  },
  {
    keywords: ["canteen", "cafeteria", "mess", "dining hall", "food court"],
    images: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    ],
  },
  {
    keywords: ["auditorium", "hall", "seminar", "conference", "theatre", "theater"],
    images: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    ],
  },
  {
    keywords: ["stationery", "bookshop", "bookstore", "shop", "store", "xerox", "photocopy", "print"],
    images: [
      "https://images.unsplash.com/photo-1568667256549-094345857637?w=400",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
      "https://images.unsplash.com/photo-1509266272358-7701da638078?w=400",
    ],
  },
  {
    keywords: ["hostel", "dormitory", "dorm", "residence"],
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    ],
  },
];

function resultImage(item: SearchResult): string {
  if (Array.isArray(item.photo_refs) && item.photo_refs.length > 0) {
    return `${API_BASE}/api/places/${item.id}/photo/0`;
  }
  if (item.primary_photo_url) return item.primary_photo_url;

  // Check type/name keywords for a more relevant image
  const searchStr = [item.name, item.type, item.sub_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const rule of TYPE_IMAGE_RULES) {
    if (rule.keywords.some((k) => searchStr.includes(k))) {
      const idx = (item.id?.charCodeAt(0) ?? 0) % rule.images.length;
      return rule.images[idx];
    }
  }

  // Fall back to category pool
  const catKey =
    item.is_on_campus || item.category === "oncampus" ? "campus" : item.category;
  const pool = FALLBACKS[catKey] ?? FALLBACKS.default;
  const idx = (item.id?.charCodeAt(0) ?? 0) % pool.length;
  return pool[idx];
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
      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors capitalize">
        {item.name}
      </h3>
      <div className="flex items-center justify-between gap-3 mb-2">
        <RatingBadge rating={item.rating} ratingCount={item.rating_count} size="sm" source="google" />
        {item.price_display ? (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span className="truncate">{item.price_display}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <MapPin className="h-3.5 w-3.5" />
        <span className="truncate">
          {item.distance_from_campus
            ? `${item.distance_from_campus} from campus`
            : shortAddress(item.address)}
        </span>
      </div>
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
        "id, name, category, type, sub_type, address, rating, rating_count, primary_photo_url, photo_refs, distance_from_campus, price_display, is_on_campus";

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

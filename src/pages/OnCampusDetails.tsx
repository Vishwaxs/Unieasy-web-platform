import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  Layers,
  Store,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BlockFilter =
  | "all"
  | "Central Block"
  | "Opp. to Central Block"
  | "Near Block 2"
  | "Near Basketball";

type CampusShop = {
  id: string;
  name: string;
  block: string;
  floor: string;
  category: string;
  image: string;
  comment: string;
};

const CampusCard = ({ item, index }: { item: CampusShop; index: number }) => {
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

  return (
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
        />
        <Badge className="absolute top-3 left-3 bg-primary">
          {item.category}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <MapPin className="w-3 h-3" />
          <span>{item.block}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Layers className="w-3 h-3" />
          <span>{item.floor}</span>
        </div>
        <p className="text-muted-foreground text-xs italic">"{item.comment}"</p>
      </div>
    </div>
  );
};

const OnCampusDetails = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [shops, setShops] = useState<CampusShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BlockFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadShops = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/campus/shops`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = await res.json();
        if (!isMounted) return;
        setShops(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch on-campus shops",
        );
        setShops([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadShops();
    return () => {
      isMounted = false;
    };
  }, [API_BASE]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = shops
    .filter((item) => filter === "all" || item.block === filter)
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.block.toLowerCase().includes(normalizedQuery) ||
        item.floor.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.comment.toLowerCase().includes(normalizedQuery)
      );
    });

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
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                On Christ Central Campus
              </h1>
              <p className="text-white/90 mt-2">
                Find on-campus shops and services by block
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-muted-foreground text-sm">
              {loading
                ? "Loading places..."
                : `${filteredItems.length} places found`}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="hidden md:flex items-center gap-3 w-full">
              <div className="flex flex-wrap gap-2 items-center">
                {(
                  [
                    "all",
                    "Central Block",
                    "Opp. to Central Block",
                    "Near Block 2",
                    "Near Basketball",
                  ] as BlockFilter[]
                ).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All Blocks" : f}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">Search:</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Quick search"
                  className="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden bg-card rounded-xl p-4 mb-6 border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "all",
                    "Central Block",
                    "Opp. to Central Block",
                    "Near Block 2",
                    "Near Basketball",
                  ] as BlockFilter[]
                ).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All Blocks" : f}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground mb-2 block">
                  Search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Quick search"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Could not load places from API: {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <CampusCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {!loading && !error && filteredItems.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              No matching places found.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OnCampusDetails;

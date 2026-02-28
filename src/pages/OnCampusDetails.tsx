import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Layers, Store, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BlockFilter = "all" | "Central Block" | "Opp. to Central Block" | "Near Block 2" | "Near Basketball";

type CampusShop = {
  id: string;
  name: string;
  block: BlockFilter extends "all" ? string : BlockFilter;
  floor: string;
  category: string;
  image: string;
  comment: string;
};

const mockShops: CampusShop[] = [
  { id: "1", name: "Mingos", block: "Central Block", floor: "Gourmet, Birdspark", category: "Cafe", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400", comment: "Located in Central Block near Gourmet and Birdspark." },
  { id: "2", name: "Michael", block: "Central Block", floor: "Gourmet", category: "Cafe", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400", comment: "Located in Central Block at Gourmet." },
  { id: "3", name: "Nandini", block: "Opp. to Central Block", floor: "Ground Level", category: "Cafe", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400", comment: "Located opposite to Central Block." },
  { id: "4", name: "Fresteria", block: "Opp. to Central Block", floor: "Ground Level", category: "Cafe", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", comment: "Located opposite to Central Block." },
  { id: "5", name: "Kiosk", block: "Near Block 2", floor: "Ground Level", category: "Cafe", image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400", comment: "Located near Block 2." },
  { id: "6", name: "JustBake", block: "Near Basketball", floor: "Ground Level", category: "Cake Shop", image: "https://images.unsplash.com/photo-1559622214-f8a9850965bb?w=400", comment: "Cake shop located near the basketball court." },
  { id: "7", name: "Punjabi Bites", block: "Central Block", floor: "Ground Level", category: "Food", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", comment: "Punjabi food outlet in Central Block." },
];

const CampusCard = ({ item, index }: { item: CampusShop; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
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
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <Badge className="absolute top-3 left-3 bg-primary">{item.category}</Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
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
  const [filter, setFilter] = useState<BlockFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = mockShops
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
          <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200" alt="On Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/80 to-slate-900/80" />
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">On Christ Central Campus</h1>
              <p className="text-white/90 mt-2">Find on-campus shops and services by block</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-muted-foreground text-sm">{filteredItems.length} places found</span>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
              <SlidersHorizontal className="w-4 h-4 mr-2" />Filters
            </Button>

            <div className="hidden md:flex items-center gap-3 w-full">
              <div className="flex flex-wrap gap-2 items-center">
                {(["all", "Central Block", "Opp. to Central Block", "Near Block 2", "Near Basketball"] as BlockFilter[]).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
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
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Central Block", "Opp. to Central Block", "Near Block 2", "Near Basketball"] as BlockFilter[]).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f === "all" ? "All Blocks" : f}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground mb-2 block">Search</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <CampusCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OnCampusDetails;

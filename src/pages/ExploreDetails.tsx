import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useExplorePlaces, type ExplorePlace } from "@/hooks/useExplorePlaces";

type TypeFilter = "all" | "Park" | "Cafe" | "Mall" | "Scenic" | "Sports" | "Culture";

const PlaceCard = ({ item, index }: { item: ExplorePlace; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

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
    <div
      ref={cardRef}
      className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <Badge className="absolute top-3 left-3 bg-primary">{item.type}</Badge>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm">{item.rating}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-3 h-3" />
            <span>{item.distance}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-3 h-3" />
            <span>{item.timing}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-3 h-3 text-muted-foreground" />
            <Badge className={`${getCrowdColor(item.crowd)} text-white text-xs`}>{item.crowd} Crowd</Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground text-xs italic">"{item.comment}"</p>
      </div>
    </div>
  );
};

const ExploreDetails = () => {
  const { items: places, loading } = useExplorePlaces();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = places.filter((item) => filter === "all" || item.type === filter);

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
          <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200" alt="Explore Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/80 to-teal-600/80" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" /><span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Explore Nearby</h1>
              <p className="text-white/90 mt-2">Discover amazing places around your campus</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-muted-foreground text-sm">{filteredItems.length} places found</span>
            
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
              <SlidersHorizontal className="w-4 h-4 mr-2" />Filters
            </Button>

            <div className="hidden md:flex flex-wrap gap-2">
              {(["all", "Park", "Cafe", "Mall", "Scenic", "Sports", "Culture"] as TypeFilter[]).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f}
                </Button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden bg-card rounded-xl p-4 mb-6 border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Park", "Cafe", "Mall", "Scenic", "Sports", "Culture"] as TypeFilter[]).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <PlaceCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreDetails;

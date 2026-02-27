import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Leaf,
  Drumstick,
  SlidersHorizontal,
  X,
  Loader2,
  Bike,
  Clock3,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFoodItems, type FoodItem } from "@/hooks/useFoodItems";

type FilterType = "all" | "veg" | "nonveg";
type SortType = "default" | "price-low" | "price-high" | "rating";

const getCardMeta = (item: FoodItem) => {
  const index = Math.max(0, (Number.parseInt(item.id, 10) || 1) - 1);
  const distances = ["0.4 km", "0.6 km", "0.8 km", "1.1 km"];
  const etas = ["12-18 min", "15-22 min", "20-28 min", "10-16 min"];
  const offers = ["10% off", "Free delivery", "Student combo", "Buy 1 side"];

  return {
    distance: distances[index % distances.length],
    eta: etas[index % etas.length],
    offer: offers[index % offers.length],
  };
};

const FoodCard = ({ item, index }: { item: FoodItem; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const meta = getCardMeta(item);

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

  return (
    <Link
      to={`/food/${item.id}`}
      ref={cardRef}
      className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 block ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge className={`absolute top-3 left-3 ${item.is_veg ? "bg-green-500" : "bg-red-500"} text-white border-0`}>
          {item.is_veg ? <Leaf className="w-3 h-3 mr-1" /> : <Drumstick className="w-3 h-3 mr-1" />}
          {item.is_veg ? "Veg" : "Non-Veg"}
        </Badge>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm font-medium">{item.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {item.restaurant}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">{item.name}</p>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {meta.distance}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <Clock3 className="w-3 h-3" />
            {meta.eta}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
            <Bike className="w-3 h-3" />
            {meta.offer}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
          <MessageSquare className="w-3 h-3" />
          <span className="italic">"{item.comment}"</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Rs. {item.price}</span>
          <span className="text-xs text-muted-foreground">{item.reviews} reviews</span>
        </div>
      </div>
    </Link>
  );
};

const FoodDetails = () => {
  const navigate = useNavigate();
  const { items: foodItems, loading } = useFoodItems();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const totalVeg = foodItems.filter((item) => item.is_veg).length;
  const avgRating =
    foodItems.length > 0
      ? (foodItems.reduce((sum, item) => sum + item.rating, 0) / foodItems.length).toFixed(1)
      : "0.0";
  const avgPrice =
    foodItems.length > 0
      ? Math.round(foodItems.reduce((sum, item) => sum + item.price, 0) / foodItems.length)
      : 0;

  const filteredItems = foodItems
    .filter((item) => {
      if (filter === "veg") return item.is_veg;
      if (filter === "nonveg") return !item.is_veg;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    })
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.restaurant.toLowerCase().includes(normalizedQuery) ||
        item.comment.toLowerCase().includes(normalizedQuery)
      );
    });

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
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
            alt="Food Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-red-600/80" />
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Food and Eating</h1>
              <p className="text-white/90 mt-2">Discover top places around campus with prices, delivery time, and student offers</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground mt-1">{avgRating}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Price</p>
              <p className="text-2xl font-bold text-foreground mt-1">Rs. {avgPrice}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Veg Friendly</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalVeg} places</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{filteredItems.length} items found</span>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Type:</span>
                <div className="flex gap-1">
                  {(["all", "veg", "nonveg"] as FilterType[]).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(f)}
                      className="capitalize"
                    >
                      {f === "nonveg" ? "Non-Veg" : f === "all" ? "All" : "Veg"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <div className="flex gap-1">
                  <Button variant={sort === "price-low" ? "default" : "outline"} size="sm" onClick={() => setSort("price-low")}>
                    Price: Low to High
                  </Button>
                  <Button variant={sort === "price-high" ? "default" : "outline"} size="sm" onClick={() => setSort("price-high")}>
                    Price: High to Low
                  </Button>
                  <Button variant={sort === "rating" ? "default" : "outline"} size="sm" onClick={() => setSort("rating")}>
                    Top Rated
                  </Button>
                </div>
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
                <h3 className="font-semibold text-foreground">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Type</span>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "veg", "nonveg"] as FilterType[]).map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize"
                      >
                        {f === "nonveg" ? "Non-Veg" : f === "all" ? "All" : "Veg"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Sort by</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={sort === "price-low" ? "default" : "outline"} size="sm" onClick={() => setSort("price-low")}>
                      Price up
                    </Button>
                    <Button variant={sort === "price-high" ? "default" : "outline"} size="sm" onClick={() => setSort("price-high")}>
                      Price down
                    </Button>
                    <Button variant={sort === "rating" ? "default" : "outline"} size="sm" onClick={() => setSort("rating")}>
                      Rating
                    </Button>
                  </div>
                </div>
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

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <FoodCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-lg font-semibold text-foreground">No matching items found</p>
              <p className="text-sm text-muted-foreground mt-1">Try changing filters or search keywords.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FoodDetails;

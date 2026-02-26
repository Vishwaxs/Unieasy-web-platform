import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Shield, Tag, Calendar, Briefcase, Users, ShoppingBag, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEssentials, type EssentialItem } from "@/hooks/useEssentials";

const categories = [
  { id: "essentials", name: "Student Essentials", icon: ShoppingBag, color: "from-pink-500 to-rose-500" },
  { id: "safety", name: "Safety & Emergency", icon: Shield, color: "from-red-500 to-orange-500" },
  { id: "discounts", name: "Student Discounts & Deals", icon: Tag, color: "from-green-500 to-emerald-500" },
  { id: "events", name: "Events & Community", icon: Calendar, color: "from-purple-500 to-indigo-500" },
  { id: "career", name: "Career & Skill Support", icon: Briefcase, color: "from-blue-500 to-cyan-500" },
];

const ItemCard = ({ item, index }: { item: EssentialItem; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true); }, { threshold: 0.1 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const category = categories.find(c => c.id === item.category);

  return (
    <div
      ref={cardRef}
      className={`group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-40 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className={`absolute inset-0 bg-gradient-to-t ${category?.color} opacity-20`} />
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm">{item.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {category && <category.icon className="w-4 h-4 text-primary" />}
          <span className="text-xs text-muted-foreground">{category?.name}</span>
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <MapPin className="w-3 h-3" /><span>{item.distance}</span>
        </div>
        <p className="text-muted-foreground text-xs italic">"{item.comment}"</p>
      </div>
    </div>
  );
};

const EssentialsDetails = () => {
  const { items: essentialItems, loading } = useEssentials();
  const [filter, setFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = essentialItems.filter((item) => filter === "all" || item.category === filter);

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
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200" alt="Essentials Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/80 to-rose-600/80" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link to="/home" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" /><span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Essentials & More</h1>
              <p className="text-white/90 mt-2">Everything you need as a student</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={filter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(cat.id)}
                className="rounded-full gap-2"
              >
                <cat.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EssentialsDetails;

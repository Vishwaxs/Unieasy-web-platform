import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Shield, Tag, Calendar, Briefcase, ShoppingBag, Loader2, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEssentials, type EssentialItem } from "@/hooks/useEssentials";
import { useAuth } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

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
  const { userId } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", String(item.id))
        .eq("item_type", "essentials")
        .maybeSingle();

      if (data) setIsBookmarked(true);
    };

    checkBookmark();
  }, [userId, item.id]);

  useEffect(() => {
    const checkReaction = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("item_reactions")
        .select("reaction_type")
        .eq("user_id", userId)
        .eq("item_id", String(item.id))
        .eq("item_type", "essentials")
        .maybeSingle();

      if (data?.reaction_type === "like" || data?.reaction_type === "dislike") {
        setReaction(data.reaction_type);
      }
    };

    checkReaction();
  }, [userId, item.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Please sign in to bookmark items!");
      return;
    }

    setLoading(true);

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", String(item.id))
        .eq("item_type", "essentials");

      if (!error) setIsBookmarked(false);
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert([
          {
            user_id: userId,
            item_id: String(item.id),
            item_type: "essentials",
          },
        ]);

      if (!error) setIsBookmarked(true);
    }

    setLoading(false);
  };

  const handleReaction = async (e: React.MouseEvent<HTMLButtonElement>, nextReaction: "like" | "dislike") => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Please sign in to react to items!");
      return;
    }

    setReactionLoading(true);

    if (reaction === nextReaction) {
      const { error } = await supabase
        .from("item_reactions")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", String(item.id))
        .eq("item_type", "essentials");

      if (!error) setReaction(null);
    } else {
      const { error } = await supabase
        .from("item_reactions")
        .upsert(
          {
            user_id: userId,
            item_id: String(item.id),
            item_type: "essentials",
            reaction_type: nextReaction,
          },
          { onConflict: "user_id,item_id,item_type" }
        );

      if (!error) setReaction(nextReaction);
    }

    setReactionLoading(false);
  };

  const category = categories.find((c) => c.id === item.category);

  return (
    <div
      ref={cardRef}
      className={`group h-full bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 flex flex-col ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-40 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className={`absolute inset-0 bg-gradient-to-t ${category?.color} opacity-20`} />
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 z-10">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm">{item.rating}</span>
        </div>
      </div>

      <div className="p-4 relative flex flex-1 flex-col">
        <button
          onClick={toggleBookmark}
          disabled={loading}
          className="absolute -top-5 right-4 p-2.5 bg-background shadow-md border border-border rounded-full hover:bg-secondary transition-all z-10"
          title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isBookmarked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
        </button>

        <div className="flex items-center gap-2 mb-2 pr-10">
          {category && <category.icon className="w-4 h-4 text-primary" />}
          <span className="text-xs text-muted-foreground">{category?.name}</span>
        </div>

        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <MapPin className="w-3 h-3" />
          <span>{item.distance}</span>
        </div>
        <p className="text-muted-foreground text-xs italic mb-3">"{item.comment}"</p>

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-end">
            <span className="text-xs text-muted-foreground">{item.reviews} reviews</span>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={(e) => handleReaction(e, "like")}
              aria-label="Like"
              title="Like"
              aria-pressed={reaction === "like"}
              disabled={reactionLoading}
              className={`inline-flex items-center transition-opacity ${reaction === "like" ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <ThumbsUp className={`w-5 h-5 ${reaction === "like" ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground fill-transparent"}`} />
            </button>
            <button
              type="button"
              onClick={(e) => handleReaction(e, "dislike")}
              aria-label="Dislike"
              title="Dislike"
              aria-pressed={reaction === "dislike"}
              disabled={reactionLoading}
              className={`inline-flex items-center transition-opacity ${reaction === "dislike" ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <ThumbsDown className={`w-5 h-5 ${reaction === "dislike" ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground fill-transparent"}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EssentialsDetails = () => {
  const { items: essentialItems, loading } = useEssentials();
  const [filter, setFilter] = useState<string>("all");

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
              <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Essentials & More</h1>
              <p className="text-white/90 mt-2">Everything you need as a student</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
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
                <span className="sm:hidden">{cat.name.split(" ")[0]}</span>
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

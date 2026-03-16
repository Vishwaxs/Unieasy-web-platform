import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Wifi, Volume2, VolumeX, SlidersHorizontal, X, Loader2, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useStudySpots, type StudySpot } from "@/hooks/useStudySpots";
import { useAuth } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

type TypeFilter = "all" | "Library" | "Cafe" | "Coworking" | "Outdoor" | "Lab";

const StudyCard = ({ item, index }: { item: StudySpot; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  // Read the saved bookmark state for this user from Supabase.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Read the saved like or dislike reaction for this user from Supabase.
  useEffect(() => {
    const checkBookmark = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", String(item.id))
        .eq("item_type", "study")
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
        .eq("item_type", "study")
        .maybeSingle();

      if (data?.reaction_type === "like" || data?.reaction_type === "dislike") {
        setReaction(data.reaction_type);
      }
    };

    checkReaction();
  }, [userId, item.id]);

  // Write bookmark add or remove changes to Supabase.
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
        .eq("item_type", "study");

      if (!error) setIsBookmarked(false);
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert([
          {
            user_id: userId,
            item_id: String(item.id),
            item_type: "study",
          },
        ]);

      if (!error) setIsBookmarked(true);
    }

    setLoading(false);
  };

  // Write like or dislike changes to Supabase using one row per user and item.
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
        .eq("item_type", "study");

      if (!error) setReaction(null);
    } else {
      const { error } = await supabase
        .from("item_reactions")
        .upsert(
          {
            user_id: userId,
            item_id: String(item.id),
            item_type: "study",
            reaction_type: nextReaction,
          },
          { onConflict: "user_id,item_id,item_type" }
        );

      if (!error) setReaction(nextReaction);
    }

    setReactionLoading(false);
  };

  const getNoiseIcon = (noise: string) => {
    return noise === "Silent" ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />;
  };

  return (
    <div
      ref={cardRef}
      className={`group h-full bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 flex flex-col ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <Badge className="absolute top-3 left-3 bg-primary">{item.type}</Badge>
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

        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors pr-10">{item.name}</h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-3 h-3" />
            <span>{item.distance}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-3 h-3" />
            <span>{item.timing}</span>
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

const StudyDetails = () => {
  const { items: studySpots, loading } = useStudySpots();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = studySpots.filter((item) => filter === "all" || item.type === filter);

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
          <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200" alt="Study Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-cyan-600/80" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Study Zones</h1>
              <p className="text-white/90 mt-2">Find the perfect spot to focus and learn</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-muted-foreground text-sm">{filteredItems.length} spots found</span>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="hidden md:flex flex-wrap gap-2">
              {(["all", "Library", "Cafe", "Coworking", "Outdoor", "Lab"] as TypeFilter[]).map((f) => (
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
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Library", "Cafe", "Coworking", "Outdoor", "Lab"] as TypeFilter[]).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <StudyCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudyDetails;

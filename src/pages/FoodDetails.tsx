import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MessageSquare, Leaf, Drumstick, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFoodItems, type FoodItem } from "@/hooks/useFoodItems";

type FilterType = "all" | "veg" | "nonveg";
type SortType = "default" | "price-low" | "price-high" | "rating";
type VisitType = "dine-in" | "takeaway" | "delivery" | "quick-bite";
type UserReview = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  visitType: VisitType;
};

const ratingOptions: Array<{ value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }> = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😋", label: "Great" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

const FoodCard = ({ item, index, onReview }: { item: FoodItem; index: number; onReview: (item: FoodItem) => void }) => {
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

  return (
    <div
      ref={cardRef}
      className={`group h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer-when-downgrade"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent dark:from-background/70 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge
          className={`absolute top-3 left-3 ${item.is_veg ? "bg-green-500" : "bg-red-500"} text-white border-0`}
        >
          {item.is_veg ? <Leaf className="w-3 h-3 mr-1" /> : <Drumstick className="w-3 h-3 mr-1" />}
          {item.is_veg ? "Veg" : "Non-Veg"}
        </Badge>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm font-medium">{item.rating}</span>
        </div>
      </div>

      <div className="p-4 flex flex-1 flex-col">
        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">{item.restaurant}</p>

        {item.comment && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
            <MessageSquare className="w-3 h-3" />
            <span className="italic">"{item.comment}"</span>
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">₹{item.price}</span>
            <span className="text-xs text-muted-foreground">{item.reviews} reviews</span>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onReview(item)}>
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

const FoodDetails = () => {
  const { openSignIn } = useClerk();
  const { isSignedIn, user } = useUser();
  const { items: foodItems, loading } = useFoodItems();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<FoodItem | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [visitType, setVisitType] = useState<VisitType | "">("");
  const [reviewsByItem, setReviewsByItem] = useState<Record<string, UserReview[]>>({});

  const openReviewDialog = (item: FoodItem) => {
    setActiveItem(item);
    setReviewText("");
    setReviewRating(null);
    setVisitType("");
    setReviewOpen(true);
  };

  const submitReview = () => {
    if (!activeItem || !isSignedIn) return;
    const text = reviewText.trim();
    if (!text || !reviewRating || !visitType) return;

    const newReview: UserReview = {
      id: `${activeItem.id}-${Date.now()}`,
      text,
      createdAt: new Date().toLocaleString(),
      author: user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "User",
      rating: reviewRating,
      visitType,
    };

    setReviewsByItem((prev) => ({
      ...prev,
      [activeItem.id]: [newReview, ...(prev[activeItem.id] || [])],
    }));
    setReviewText("");
    setReviewRating(null);
    setVisitType("");
  };

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
        {/* Hero Banner */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
            alt="Food Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-red-600/80 dark:from-orange-700/70 dark:to-red-800/70" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link to="/home" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Food & Eating</h1>
              <p className="text-white/90 mt-2">Discover the best food spots around campus</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{filteredItems.length} items found</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <div className="flex gap-1">
                  <Button
                    variant={sort === "price-low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("price-low")}
                  >
                    Price: Low to High
                  </Button>
                  <Button
                    variant={sort === "price-high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("price-high")}
                  >
                    Price: High to Low
                  </Button>
                  <Button
                    variant={sort === "rating" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("rating")}
                  >
                    Top Rated
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Panel */}
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
                    <Button
                      variant={sort === "price-low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("price-low")}
                    >
                      Price ↑
                    </Button>
                    <Button
                      variant={sort === "price-high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("price-high")}
                    >
                      Price ↓
                    </Button>
                    <Button
                      variant={sort === "rating" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSort("rating")}
                    >
                      Rating
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Food Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <FoodCard key={item.id} item={item} index={index} onReview={openReviewDialog} />
            ))}
          </div>

          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="sm:max-w-lg [&>button]:hidden">
              <DialogHeader>
                <DialogTitle>Reviews{activeItem ? ` - ${activeItem.name}` : ""}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {activeItem && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground font-medium">Listing review stats</p>
                      <Badge variant="secondary">{activeItem.reviews} reviews</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Showing current listing count; user-posted reviews appear below.
                    </p>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                  {activeItem && (reviewsByItem[activeItem.id] || []).length > 0 ? (
                    (reviewsByItem[activeItem.id] || []).map((review) => (
                      <div key={review.id} className="rounded-lg border border-border p-3">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="text-sm">
                            {ratingOptions.find((r) => r.value === review.rating)?.emoji} {ratingOptions.find((r) => r.value === review.rating)?.label}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">{review.visitType.replace("-", " ")}</span>
                        </div>
                        <p className="text-sm text-foreground">{review.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {review.author} · {review.createdAt}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No user-posted reviews yet.</p>
                  )}
                </div>

                <SignedIn>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">Your rating (required)</p>
                      <div className="grid grid-cols-5 gap-2">
                        {ratingOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setReviewRating(option.value)}
                            className={`rounded-md border px-2 py-2 text-center transition-colors ${
                              reviewRating === option.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <div className="text-lg leading-none">{option.emoji}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="visitType" className="mb-2 block text-sm font-medium text-foreground">
                        Visit type (required)
                      </label>
                      <select
                        id="visitType"
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value as VisitType | "")}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                      >
                        <option value="">Select visit type</option>
                        <option value="dine-in">Dine-in</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                        <option value="quick-bite">Quick bite</option>
                      </select>
                    </div>

                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                    <div className="flex justify-end">
                      <Button onClick={submitReview} disabled={!reviewText.trim() || !reviewRating || !visitType}>
                        Post Review
                      </Button>
                    </div>
                  </div>
                </SignedIn>

                <SignedOut>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    You need to sign in to post a review.
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewOpen(false);
                          window.setTimeout(() => openSignIn(), 0);
                        }}
                      >
                        Sign in to Post Review
                      </Button>
                    </div>
                  </div>
                </SignedOut>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FoodDetails;

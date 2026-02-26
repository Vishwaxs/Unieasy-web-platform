import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Utensils, Home, MapPin, BookOpen, MoreHorizontal, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "Food & Eating", icon: Utensils, to: "/food", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { label: "Accommodation", icon: Home, to: "/accommodation", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { label: "Explore Nearby", icon: MapPin, to: "/explore", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { label: "Study Zones", icon: BookOpen, to: "/study", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { label: "Essentials", icon: MoreHorizontal, to: "/essentials", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
];

const trendingSearches = ["Biryani near campus", "Affordable PG", "24h study room", "Weekend hangouts"];

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingIdx, setTrendingIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate trending placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingIdx((p) => (p + 1) % trendingSearches.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLinks = query.trim()
    ? quickLinks.filter((l) =>
      l.label.toLowerCase().includes(query.toLowerCase())
    )
    : quickLinks;

  const scrollToCards = () => {
    const cardsSection = document.getElementById("category-cards");
    if (cardsSection) {
      cardsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-14">
      {/* Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        {/* Animated floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center pt-14">
        {/* Trending badge */}
        <div className="flex justify-center mb-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>{trendingSearches[trendingIdx]}</span>
            <span className="text-primary/50">is trending</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 md:mb-6 animate-fade-up">
          Discover Your Campus,{" "}
          <span className="text-primary relative">
            Your Way
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
              <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="animate-draw-underline" />
            </svg>
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto animate-fade-up stagger-1">
          Find the best food spots, accommodation, and hidden gems around your university
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto animate-fade-up stagger-2 relative">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 shadow-xl border border-border">
            <div className="flex-1 flex items-center gap-3 px-4 w-full">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={`Try "${trendingSearches[trendingIdx]}"...`}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3 w-full"
              />
            </div>
            <Button size="lg" className="rounded-xl w-full sm:w-auto" onClick={scrollToCards}>
              Search
            </Button>
          </div>

          {/* Live Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl rounded-xl border border-border shadow-2xl p-3 z-50 animate-fade-in">
              <p className="text-xs text-muted-foreground font-medium px-2 mb-2">
                {query ? "Results" : "Quick Access"}
              </p>
              <div className="space-y-1">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${link.color} flex items-center justify-center`}>
                      <link.icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-foreground text-sm font-medium">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
                {query && filteredLinks.length === 0 && (
                  <p className="text-muted-foreground text-sm px-3 py-2">
                    No matching categories. Try browsing below!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick category pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-up stagger-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-sm text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-300"
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToCards}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group transition-all duration-300 hover:translate-y-1"
      >
        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
          Scroll to explore
        </span>
        <div className="w-10 h-14 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center group-hover:border-foreground/70 transition-colors">
          <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce group-hover:text-foreground" />
        </div>
      </button>
    </section>
  );
};

export default HeroSection;

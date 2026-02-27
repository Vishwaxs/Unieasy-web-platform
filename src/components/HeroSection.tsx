import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const scrollToCards = () => {
    const cardsSection = document.getElementById("category-cards");
    if (cardsSection) {
      cardsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const runSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-14">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hero-bg-pan bg-gradient-to-br from-primary/20 via-background to-secondary/30" />
        <div className="absolute inset-0 hero-bg-zoom bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-orbit hero-orbit-one">
          <span className="hero-orbit-dot" />
        </div>
        <div className="hero-orbit hero-orbit-two">
          <span className="hero-orbit-dot" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center pt-14">
        <div className="relative mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10 hero-panel-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 md:mb-6 animate-fade-up">
            Discover Your Campus,{" "}
            <span className="text-primary">Your Way</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto animate-fade-up stagger-1">
            Find the best food spots, accommodation, and hidden gems around your university
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto animate-fade-up stagger-2">
            <form
              className="bg-card/80 backdrop-blur-xl rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 shadow-xl border border-border"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
            >
              <div className="flex-1 flex items-center gap-3 px-4 w-full">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for food, hostels, places..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3 w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="rounded-xl w-full sm:w-auto hero-search-pulse" type="submit">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Scroll indicator - positioned below center */}
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

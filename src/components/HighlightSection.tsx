import { useEffect, useMemo, useRef, useState } from "react";
import highlightFood from "@/assets/highlight-food.jpg";
import highlightHostel from "@/assets/highlight-hostel.jpg";
import highlightExplore from "@/assets/highlight-explore.jpg";
import highlightStudy from "@/assets/highlight-study.jpg";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StaticHighlight = {
  src: string;
  alt: string;
  title: string;
  category: string;
};

type AdSlide = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  target_location: string | null;
  clerk_user_id: string | null;
  impression_count?: number | null;
};

type Slide =
  | ({ kind: "static" } & StaticHighlight)
  | ({ kind: "ad" } & AdSlide);

const staticHighlights: StaticHighlight[] = [
  {
    src: highlightFood,
    alt: "Food court with delicious cuisines",
    title: "Discover Amazing Food",
    category: "Food & Dining",
  },
  {
    src: highlightHostel,
    alt: "Cozy student hostel room",
    title: "Find Your Perfect Stay",
    category: "Accommodation",
  },
  {
    src: highlightExplore,
    alt: "Students exploring scenic viewpoint",
    title: "Explore New Places",
    category: "Adventure",
  },
  {
    src: highlightStudy,
    alt: "Students studying together",
    title: "Perfect Study Spots",
    category: "Study Zones",
  },
];

const HighlightSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ads, setAds] = useState<AdSlide[]>([]);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const impressedAdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const fetchAds = async () => {
      const { data, error } = await supabase
        .from("ads")
        .select(
          "id, title, description, image_url, target_location, clerk_user_id, impression_count, created_at",
        )
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled) return;
      if (error) {
        setAds([]);
        return;
      }
      setAds((data ?? []) as AdSlide[]);
    };

    fetchAds();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides: Slide[] = useMemo(() => {
    const base: Slide[] = staticHighlights.map((s) => ({ kind: "static", ...s }));
    const sponsored: Slide[] = (ads ?? [])
      .filter((a) => a && a.id && a.image_url)
      .map((a) => ({ kind: "ad", ...a }));

    // Mix ads into the highlights (every other slide), keeping all static slides.
    if (sponsored.length === 0) return base;

    const mixed: Slide[] = [];
    let adIdx = 0;
    for (let i = 0; i < base.length; i++) {
      mixed.push(base[i]);
      if (adIdx < sponsored.length) {
        mixed.push(sponsored[adIdx]);
        adIdx += 1;
      }
    }
    // If we still have ads, append them.
    while (adIdx < sponsored.length) {
      mixed.push(sponsored[adIdx]);
      adIdx += 1;
    }
    return mixed;
  }, [ads]);

  useEffect(() => {
    if (currentIndex >= slides.length) setCurrentIndex(0);
  }, [slides.length, currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!currentSlide || currentSlide.kind !== "ad") return;
        if (impressedAdsRef.current.has(currentSlide.id)) return;

        impressedAdsRef.current.add(currentSlide.id);
        const nextCount = (currentSlide.impression_count ?? 0) + 1;
        supabase.from("ads").update({ impression_count: nextCount }).eq("id", currentSlide.id);
      },
      { threshold: 0.6 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [currentSlide]);

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up">
            Featured <span className="text-primary">Highlights</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-up stagger-1">
            See what other students are discovering around their campus
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Main Image */}
          <div
            ref={heroRef}
            className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl"
          >
            <img
              src={currentSlide.kind === "ad" ? currentSlide.image_url || "" : currentSlide.src}
              alt={currentSlide.kind === "ad" ? currentSlide.title || "Sponsored" : currentSlide.alt}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
              }`}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent dark:from-background/90 dark:via-background/30 dark:to-transparent" />

            {currentSlide.kind === "ad" ? (
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 text-white border-0">Sponsored</Badge>
              </div>
            ) : null}
            
            {/* Content */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-12 transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}>
              {currentSlide.kind === "static" ? (
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-4">
                  {currentSlide.category}
                </span>
              ) : null}
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                {currentSlide.kind === "ad"
                  ? currentSlide.title || "Featured"
                  : currentSlide.title}
              </h3>
              {currentSlide.kind === "ad" ? (
                <>
                  {currentSlide.description ? (
                    <p className="mt-3 text-white/85 max-w-2xl">
                      {currentSlide.description}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Button
                      variant="default"
                      className="bg-white text-foreground hover:bg-white/90"
                      onClick={() => {
                        if (!currentSlide.target_location) return;
                        window.open(currentSlide.target_location, "_blank", "noopener,noreferrer");
                      }}
                    >
                      {"Learn More"}
                    </Button>
                    {currentSlide.clerk_user_id ? (
                      <span className="text-xs text-white/70">
                        Sponsored
                      </span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 md:right-12 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsTransitioning(false);
                    }, 300);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-white/40 hover:bg-white/60 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighlightSection;

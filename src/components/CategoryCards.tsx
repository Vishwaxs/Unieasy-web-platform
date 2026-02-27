import { Utensils, Home, MapPin, MoreHorizontal, BookOpen, ArrowRight, Store } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { modulesEnabled, modulesDisabledHint } from "@/lib/featureFlags";

const resolveVideoSrc = (video: string) => {
  if (!video) return video;
  // If it's an absolute URL (or protocol-relative), use as-is.
  if (/^(https?:)?\/\//i.test(video)) return video;
  // Treat non-URL strings as files served from Vite's /public folder.
  // Example: put `5780171.mp4` in `public/` and reference it as "/5780171.mp4".
  return video.startsWith("/") ? video : `/${video}`;
};

const categories = [
  {
    id: 0,
    name: "On Campus",
    description: "Campus essentials right here",
    icon: Store,
    video: "/5780171-uhd_3840_2160_24fps.mp4",
    count: "Shops",
    link: "/campus",
    details: [],
  },
  {
    id: 1,
    name: "Food & Eating",
    description: "Cafes, restaurants & street food",
    icon: Utensils,
    video: "/5780171-uhd_3840_2160_24fps.mp4",
    count: "150+",
    link: "/food",
  },
  {
    id: 2,
    name: "Accommodation",
    description: "Hostels, PGs & rentals",
    icon: Home,
    video: "/11050698-uhd_3840_2160_30fps.mp4",
    count: "80+",
    link: "/accommodation",
  },
  {
    id: 3,
    name: "Explore Nearby",
    description: "Parks & hangout spots",
    icon: MapPin,
    video: "/18733706-uhd_3840_2160_60fps.mp4",
    count: "60+",
    link: "/explore",
  },
  {
    id: 4,
    name: "Essentials",
    description: "Gyms, laundry & more",
    icon: MoreHorizontal,
    video: "/Video Project 3.mp4",
    count: "100+",
    link: "/essentials",
  },
];

const CategoryCard = ({ category, index }: { category: typeof categories[0]; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const videoSrc = resolveVideoSrc(category.video);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Link
      to={category.link}
      aria-disabled={!modulesEnabled}
      title={!modulesEnabled ? modulesDisabledHint : undefined}
      onClick={(e) => {
        if (modulesEnabled) return;
        e.preventDefault();
        e.stopPropagation();
        // Non-blocking cue; safe to remove later.
        console.info(modulesDisabledHint);
      }}
    >
      <div
        ref={cardRef}
        className={`group relative flex-shrink-0 w-72 sm:w-80 cursor-pointer snap-start transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card with video background */}
        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          // Keep hover effects on the card (video shouldn't capture the mouse).
          className={`pointer-events-none absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${category} opacity-60 mix-blend-multiply transition-opacity duration-500`} />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-300 ${isHovered ? "from-black/90 via-black/50" : ""}`} />
        
        {/* Subtle darkening overlay on hover */}
        <div className={`absolute inset-0 bg-black/0 transition-all duration-300 ${isHovered ? "bg-black/20" : ""}`} />
        
        {/* Animated border glow */}
        <div className={`absolute inset-0 rounded-3xl border-2 transition-all duration-500 ${isHovered ? "border-white/40 shadow-[inset_0_0_30px_rgba(255,255,255,0.1)]" : "border-white/0"}`} />
        
        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute w-2 h-2 bg-white/30 rounded-full top-1/4 left-1/4 transition-all duration-1000 ${isHovered ? "animate-float-slow" : ""}`} />
          <div className={`absolute w-3 h-3 bg-white/20 rounded-full top-1/2 right-1/4 transition-all duration-1000 ${isHovered ? "animate-float-medium" : ""}`} />
          <div className={`absolute w-1.5 h-1.5 bg-white/40 rounded-full bottom-1/3 left-1/3 transition-all duration-1000 ${isHovered ? "animate-float-fast" : ""}`} />
        </div>

        {/* Shimmer effect on load */}
        {!isVisible && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">
          {/* Icon with animation */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-500 ${isHovered ? "scale-110 rotate-3 bg-white/30" : ""}`}>
            <category.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
          </div>

          {/* Text with slide up animation */}
          <div className={`transform transition-all duration-500 ${isHovered ? "-translate-y-2" : ""}`}>
            <span className={`inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold mb-3 shadow-lg transition-all duration-300 ${isHovered ? "bg-white/30" : ""}`}>
              {category.count} Places
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {category.name}
            </h3>
            <p className="text-white/90 text-sm drop-shadow-md">
              {category.description}
            </p>

            
            {/* Explore button that appears on hover */}
            <div className={`mt-4 flex items-center gap-2 text-white font-medium transition-all duration-500 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span>Explore</span>
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCards = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <section id="category-cards" className="py-12 md:py-16 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 animate-fade-up">
              Explore Categories
            </h2>
            <p className="text-muted-foreground text-sm md:text-base animate-fade-up stagger-1">
              Everything you need around campus
            </p>
          </div>
          <button
            type="button"
            onClick={scrollNext}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Scroll categories"
          >
            <span className="text-sm">Scroll</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal scrollable container */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex gap-4 md:gap-6 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 overscroll-x-contain"
        >
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;

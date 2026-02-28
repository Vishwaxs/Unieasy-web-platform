import { useState, useEffect } from "react";
import highlightFood from "@/assets/highlight-food.jpg";
import highlightHostel from "@/assets/highlight-hostel.jpg";
import highlightExplore from "@/assets/highlight-explore.jpg";
import highlightStudy from "@/assets/highlight-study.jpg";

const images = [
  {
    src: highlightFood,
    alt: "Food court with delicious cuisines",
    title: "Promote Your Food Deals",
    category: "Sponsored Ad",
  },
  {
    src: highlightHostel,
    alt: "Cozy student hostel room",
    title: "Get More Stay Bookings",
    category: "Sponsored Ad",
  },
  {
    src: highlightExplore,
    alt: "Students exploring scenic viewpoint",
    title: "Reach Students Nearby",
    category: "Sponsored Ad",
  },
  {
    src: highlightStudy,
    alt: "Students studying together",
    title: "Advertise to Campus Audience",
    category: "Sponsored Ad",
  },
];

const HighlightSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const currentImage = images[currentIndex];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up">
            Featured <span className="text-primary">Advertisements</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-up stagger-1">
            Showcase your brand, offers, and services to students across campus
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Main Image */}
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
              }`}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Content */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-12 transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-4">
                {currentImage.category}
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                {currentImage.title}
              </h3>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 md:right-12 flex gap-2">
              {images.map((_, index) => (
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

import { Shield, Clock, ThumbsUp, Users, Sparkles, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: Shield,
    title: "Verified Listings",
    description: "Every listing is verified by our team for authenticity and quality",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Get live updates on availability, prices, and reviews",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ThumbsUp,
    title: "Student Reviews",
    description: "Honest reviews from fellow students who've been there",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by students, for students - we understand your needs",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Sparkles,
    title: "Curated Recommendations",
    description: "AI-powered suggestions based on your preferences",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: MapPin,
    title: "Nearby Discovery",
    description: "Find hidden gems within walking distance from campus",
    color: "from-green-500 to-emerald-500",
  },
];

const getEntranceTypeClass = (index: number) => {
  return "animate-card-in-zoom";
};

const FeatureCard = ({ feature, index, isVisible }: { feature: typeof features[0]; index: number; isVisible: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const entranceTypeClass = getEntranceTypeClass(index);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-card rounded-2xl p-5 md:p-6 shadow-sm border border-border overflow-hidden transition-all duration-700 ${
        isVisible ? `opacity-100 ${entranceTypeClass}` : "opacity-0"
      } ${isHovered ? "shadow-2xl -translate-y-3 scale-[1.03] border-primary/50" : ""}`}
      style={{
        animationDelay: `${index * 140}ms`,
      }}
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 ${isHovered ? "opacity-10" : ""}`} />

      {/* Glow ring */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"} shadow-[inset_0_0_0_1px_rgba(16,185,129,0.45),0_0_35px_rgba(16,185,129,0.25)]`} />
      
      {/* Shimmer effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 ${isHovered ? "translate-x-full" : "-translate-x-full"}`} />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 transition-all duration-500 ${isHovered ? "scale-115 rotate-6 shadow-xl" : ""}`}>
          <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
        
        {/* Content */}
        <h3 className={`text-base md:text-lg font-semibold text-foreground mb-2 transition-colors duration-300 ${isHovered ? "text-primary" : ""}`}>
          {feature.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {feature.description}
        </p>
        
        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r ${feature.color} rounded-full transition-all duration-500 ${isHovered ? "w-full opacity-100" : "w-10 opacity-70"}`} />
      </div>
    </div>
  );
};

const WhyUsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-secondary/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`text-center mb-10 md:mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose <span className="text-primary">UniEasy</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            We're not just another listing platform. We're your campus companion that understands student life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;

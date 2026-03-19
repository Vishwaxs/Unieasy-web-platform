import { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface Testimonial {
    name: string;
    avatar: string;
    text: string;
    rating: number;
    category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    food: "Food & Dining",
    accommodation: "Accommodation",
    study: "Study Zones",
    hangout: "Explore",
    campus: "On Campus",
    services: "Essentials",
    health: "Essentials",
    fitness: "Essentials",
    safety: "Essentials",
    essentials: "Essentials",
};

const TestimonialCard = ({
    testimonial,
}: {
    testimonial: Testimonial;
}) => (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 flex flex-col h-full relative overflow-hidden group">
        {/* Decorative quote */}
        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

        {/* Stars */}
        <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                />
            ))}
        </div>

        {/* Category badge */}
        <span className="inline-flex self-start px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            {testimonial.category}
        </span>

        {/* Text */}
        <p className="text-foreground/90 text-sm md:text-base leading-relaxed flex-1 mb-6 italic">
            &ldquo;{testimonial.text}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/60">
            <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full bg-muted"
                loading="lazy"
            />
            <div>
                <p className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                </p>
            </div>
        </div>
    </div>
);

const TestimonialSkeleton = () => (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 flex flex-col h-full">
        <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-full" />
            ))}
        </div>
        <Skeleton className="w-20 h-6 rounded-full mb-3" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-3/4 h-4 mb-6" />
        <div className="flex items-center gap-3 pt-4 border-t border-border/60">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-24 h-4" />
        </div>
    </div>
);

const TestimonialsSection = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Responsive: show 1 on mobile, 2 on tablet, 3 on desktop
    const [perPage, setPerPage] = useState(3);

    useEffect(() => {
        const updatePerPage = () => {
            if (window.innerWidth < 640) setPerPage(1);
            else if (window.innerWidth < 1024) setPerPage(2);
            else setPerPage(3);
        };
        updatePerPage();
        window.addEventListener("resize", updatePerPage);
        return () => window.removeEventListener("resize", updatePerPage);
    }, []);

    // Fetch top-rated reviews from Supabase
    useEffect(() => {
        const fetchTestimonials = async () => {
            const { data } = await supabase
                .from("reviews")
                .select("body, rating, is_anonymous, app_users!inner(full_name), places!inner(category)")
                .eq("status", "active")
                .gte("rating", 4)
                .order("created_at", { ascending: false })
                .limit(9);

            if (data && data.length > 0) {
                const mapped: Testimonial[] = data.map((r: any) => {
                    const isAnon = r.is_anonymous;
                    const fullName = isAnon ? "Anonymous Student" : (r.app_users?.full_name || "Student");
                    const placeCategory = r.places?.category || "";
                    return {
                        name: fullName,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
                        text: r.body,
                        rating: r.rating,
                        category: CATEGORY_LABELS[placeCategory] || placeCategory,
                    };
                });
                setTestimonials(mapped);
            }
            setLoading(false);
        };
        fetchTestimonials();
    }, []);

    const totalPages = Math.max(1, Math.ceil(testimonials.length / perPage));

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage((page + totalPages) % totalPages);
        },
        [totalPages]
    );

    // Auto-play
    useEffect(() => {
        if (testimonials.length <= perPage) return;
        autoPlayRef.current = setInterval(() => {
            goToPage(currentPage + 1);
        }, 6000);
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [currentPage, goToPage, testimonials.length, perPage]);

    // Intersection observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const visibleTestimonials = testimonials.slice(
        currentPage * perPage,
        currentPage * perPage + perPage
    );

    // Don't render section if no reviews at all (after loading)
    if (!loading && testimonials.length === 0) {
      return (
        <section className="py-16 md:py-20 bg-secondary/30" aria-hidden="true">
          <div className="container mx-auto px-4 md:px-6 min-h-[200px]" />
        </section>
      );
    }

    return (
        <section
            ref={sectionRef}
            className="py-16 md:py-20 bg-secondary/30 relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.05),transparent_50%)]" />

            <div
                className={`container mx-auto px-4 md:px-6 relative z-10 transition-all duration-1000 ${
                    isVisible
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
            >
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                        What <span className="text-primary">Students</span> Say
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                        Real experiences from your fellow campus explorers
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
                    {loading
                        ? Array.from({ length: perPage }).map((_, i) => (
                            <TestimonialSkeleton key={i} />
                        ))
                        : visibleTestimonials.map((t, i) => (
                            <TestimonialCard key={`${t.name}-${i}`} testimonial={t} />
                        ))
                    }
                </div>

                {/* Carousel Controls */}
                {testimonials.length > perPage && (
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToPage(i)}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentPage
                                            ? "bg-primary w-6"
                                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;

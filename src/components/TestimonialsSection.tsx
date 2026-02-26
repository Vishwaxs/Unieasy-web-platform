import { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Aarav Sharma",
        role: "BCA 2nd Year",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
        text: "UniEasy helped me find an affordable PG within walking distance of campus. The verified listings saved me from so many scams!",
        rating: 5,
        category: "Accommodation",
    },
    {
        name: "Priya Menon",
        role: "MCA 1st Year",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        text: "Best food recommendations ever! I discovered this amazing South Indian place through UniEasy that's now my go-to spot.",
        rating: 5,
        category: "Food & Dining",
    },
    {
        name: "Rohan Gupta",
        role: "BBA 3rd Year",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
        text: "The study zone finder is incredible. Found a quiet library I never knew existed just 5 minutes from my hostel.",
        rating: 4,
        category: "Study Zones",
    },
    {
        name: "Anisha Patel",
        role: "BCom 2nd Year",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anisha",
        text: "As a merchant, I love how easy it is to reach students. My café got 40% more footfall after listing on UniEasy!",
        rating: 5,
        category: "Merchant",
    },
    {
        name: "Vikram Das",
        role: "MCA 2nd Year",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
        text: "The explore section led me to some amazing hidden spots around Hosur Road. Perfect weekend hangouts!",
        rating: 5,
        category: "Explore",
    },
];

const TestimonialCard = ({
    testimonial,
}: {
    testimonial: (typeof testimonials)[0];
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
            "{testimonial.text}"
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
                <p className="text-muted-foreground text-xs">{testimonial.role}</p>
            </div>
        </div>
    </div>
);

const TestimonialsSection = () => {
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

    const totalPages = Math.ceil(testimonials.length / perPage);

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage((page + totalPages) % totalPages);
        },
        [totalPages]
    );

    // Auto-play
    useEffect(() => {
        autoPlayRef.current = setInterval(() => {
            goToPage(currentPage + 1);
        }, 6000);
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [currentPage, goToPage]);

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

    return (
        <section
            ref={sectionRef}
            className="py-16 md:py-20 bg-secondary/30 relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.05),transparent_50%)]" />

            <div
                className={`container mx-auto px-4 md:px-6 relative z-10 transition-all duration-1000 ${isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-12"
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
                    {visibleTestimonials.map((t) => (
                        <TestimonialCard key={t.name} testimonial={t} />
                    ))}
                </div>

                {/* Carousel Controls */}
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
            </div>
        </section>
    );
};

export default TestimonialsSection;

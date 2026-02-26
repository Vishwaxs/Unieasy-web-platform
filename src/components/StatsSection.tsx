import { useState, useEffect, useRef } from "react";

interface CounterProps {
    end: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
}

const AnimatedCounter = ({
    end,
    duration = 2000,
    suffix = "",
    prefix = "",
}: CounterProps) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease-out cubic for a snappy feel
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isVisible, end, duration]);

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}
            {count.toLocaleString()}
            {suffix}
        </span>
    );
};

const stats = [
    { label: "Active Students", value: 2500, suffix: "+", color: "from-blue-500 to-cyan-500" },
    { label: "Verified Listings", value: 430, suffix: "+", color: "from-emerald-500 to-teal-500" },
    { label: "Reviews Posted", value: 8100, suffix: "+", color: "from-orange-500 to-amber-500" },
    { label: "Campuses", value: 1, suffix: "", color: "from-violet-500 to-purple-500" },
];

const StatsSection = () => {
    return (
        <section className="py-16 md:py-20 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_50%)]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                        Trusted by <span className="text-primary">Students</span>
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                        Growing every day with real students from Christ University – Central Campus
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="group relative bg-card rounded-2xl p-5 md:p-6 border border-border hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl text-center overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div
                                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />

                            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-2">
                                <AnimatedCounter
                                    end={stat.value}
                                    suffix={stat.suffix}
                                    duration={2200 + i * 200}
                                />
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;

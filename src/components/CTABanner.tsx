import { Link } from "react-router-dom";
import { Megaphone, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTABanner = () => {
    return (
        <section className="py-16 md:py-20 px-4 md:px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="relative rounded-3xl overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

                    {/* Floating decorative shapes */}
                    <div className="absolute top-6 right-12 w-20 h-20 rounded-full border-2 border-white/10 animate-pulse" />
                    <div className="absolute bottom-8 left-16 w-12 h-12 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-white/20" />

                    <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-8">
                        {/* Left: Content */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                For Local Businesses
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                                Reach Thousands of Students With Your Ads
                            </h2>
                            <p className="text-white/80 text-sm md:text-base max-w-lg mb-6 lg:mb-0">
                                List your restaurant, PG, or business on UniEasy and connect directly with Christ University students.
                                Affordable, targeted, and effective advertising.
                            </p>
                        </div>

                        {/* Right: CTA */}
                        <div className="flex flex-col items-center gap-3 flex-shrink-0">
                            <Link to="/merchant">
                                <Button
                                    size="xl"
                                    className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 gap-2 group"
                                >
                                    <Megaphone className="w-5 h-5" />
                                    Start Advertising
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <span className="text-white/60 text-xs">
                                Free to list · No hidden fees
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTABanner;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { Megaphone, User, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

import lightLogoHref from "@/assets/Light_Logo.png";
import darkLogoHref from "@/assets/Dark_Logo.png";
import christLogoHref from "@/assets/Christ-logo.png";

const Index = () => {
  const { theme } = useTheme();

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Hero Section - Full Screen */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="University Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/50 to-background/90 dark:from-black/60 dark:via-black/35 dark:to-black/70" />
        </div>

        {/* Fixed Glassmorphism Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <Link to="/profile">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-background/60 backdrop-blur-md border-border/60 hover:bg-accent/15 w-10 h-10 transition-all duration-300"
                >
                  <User className="w-5 h-5 text-foreground" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-6 pt-20">
          <div className="text-center max-w-2xl mx-auto rounded-3xl bg-background/75 dark:bg-background/35 backdrop-blur-xl border border-border/60 shadow-lg px-6 py-10 md:px-10 md:py-12">
            <div className="flex justify-center mb-6 animate-fade-up">
              <img
                src={theme === "dark" ? darkLogoHref : lightLogoHref}
                alt="UniEasy"
                className="h-14 md:h-16 w-auto"
                loading="eager"
                decoding="async"
              />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-up">
              Discover Christ University – Central Campus
            </h1>
            <p className="text-base md:text-lg text-foreground/80 dark:text-foreground/85 mb-10 animate-fade-up stagger-1 leading-relaxed">
              Food spots, accommodation, study zones, and places nearby – curated for students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-2">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Get Started
                </Button>
              </Link>
              <Link to="/home">
                <Button
                  variant="outline"
                  size="xl"
                  className="bg-background/50 backdrop-blur-sm border-border/60 text-foreground hover:bg-accent/10"
                >
                  Explore as Guest
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-sm text-muted-foreground animate-fade-up stagger-3">
              Already have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </main>

        {/* Scroll indicator */}
        <button 
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group transition-all duration-300 hover:translate-y-1 z-20"
        >
          <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
            Scroll down
          </span>
          <div className="w-10 h-14 rounded-full border-2 border-border/60 flex items-center justify-center group-hover:border-border transition-colors">
            <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce group-hover:text-foreground" />
          </div>
        </button>
      </div>

      {/* Institutional affiliation (Christ University – Central Campus) */}
      <section className="relative z-10 bg-muted/30 dark:bg-background border-y border-border/60">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex items-center justify-center rounded-2xl bg-card border border-border/60 px-6 py-4 shadow-sm">
              <img
                src={christLogoHref}
                alt="Christ University"
                className="h-12 md:h-14 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                For Christ University – Central Campus
              </h2>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                UniEasy is an independent student-focused platform. The Christ University logo is used here only to indicate campus affiliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Run Your Advertisement - Bottom Right above Footer */}
      <div className="relative z-10 flex justify-end px-4 md:px-6 py-8 bg-background">
        <Link to="/merchant">
          <Button variant="default" size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Megaphone className="w-5 h-5" />
            Run Your Advertisement
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryCards from "@/components/CategoryCards";
import WhyUsSection from "@/components/WhyUsSection";
import HighlightSection from "@/components/HighlightSection";
import Footer from "@/components/Footer";

const Home = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 30 });

  useEffect(() => {
    const updateScrollProgress = () => {
      const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = maxScrollable > 0 ? (window.scrollY / maxScrollable) * 100 : 0;
      setScrollProgress(Math.max(0, Math.min(100, nextProgress)));
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        ticking = false;
      });
    };

    const onPointerMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setPointer({ x, y });
    };

    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onPointerMove);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onPointerMove);
    };
  }, []);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-1 bg-transparent">
        <div
          className="h-full home-progress-bar transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="home-grid-overlay" />
        <div className="home-aurora home-aurora-one" />
        <div className="home-aurora home-aurora-two" />
        <div className="home-aurora home-aurora-three" />
        <div
          className="home-pointer-glow"
          style={{
            left: `${pointer.x}%`,
            top: `${pointer.y}%`,
          }}
        />
      </div>
      <Header />
      <main className="relative z-10 pt-16 md:pt-20">
        <HeroSection />
        <CategoryCards />
        <HighlightSection />
        <WhyUsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;


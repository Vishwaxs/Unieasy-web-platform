import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryCards from "@/components/CategoryCards";
import StatsSection from "@/components/StatsSection";
import WhyUsSection from "@/components/WhyUsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import HighlightSection from "@/components/HighlightSection";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <CategoryCards />
        <StatsSection />
        <WhyUsSection />
        <TestimonialsSection />
        <HighlightSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Home;

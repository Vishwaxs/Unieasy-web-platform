import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryCards from "@/components/CategoryCards";
import WhyUsSection from "@/components/WhyUsSection";
import HighlightSection from "@/components/HighlightSection";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <CategoryCards />
        <WhyUsSection />
        <HighlightSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;


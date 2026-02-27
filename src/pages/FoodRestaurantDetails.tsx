import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Phone, Clock, Leaf, Drumstick, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFoodItems } from "@/hooks/useFoodItems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FoodRestaurantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useFoodItems();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold text-foreground">Restaurant not found</h1>
              <p className="text-muted-foreground mt-2">Please go back and select another restaurant.</p>
              <Link to="/food" className="text-primary mt-4 inline-block hover:underline">
                Go to Food
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-10">
        {/* Hero */}
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={item.image} alt={item.restaurant} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 md:px-6 pb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                {item.restaurant}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-white/90">
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                  <span className="text-xs text-white/70">({item.reviews} reviews)</span>
                </div>
                <Badge className={item.is_veg ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {item.is_veg ? (
                    <>
                      <Leaf className="w-3 h-3 mr-1" /> Veg
                    </>
                  ) : (
                    <>
                      <Drumstick className="w-3 h-3 mr-1" /> Non-Veg
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Featured Dish</h2>
              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full sm:w-56 h-40 sm:h-40 object-cover rounded-xl"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <p className="text-muted-foreground mt-1">
                    Signature item from {item.restaurant}
                  </p>
                  <div className="mt-3 text-primary text-2xl font-bold">₹{item.price}</div>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span className="italic">"{item.comment}"</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {item.restaurant} serves student‑friendly meals with consistent quality and quick service. Explore popular picks, budget‑friendly options, and daily specials curated for campus life.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Info</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Near Central Campus
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  10:00 AM – 10:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  +91 9XXXX XXXXX
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Similar Picks</h3>
              <p className="text-muted-foreground text-sm">
                Discover more restaurants in the Food module for quick bites and budget meals.
              </p>
              <Link to="/food" className="inline-flex mt-4 text-primary hover:underline">
                Browse Food
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FoodRestaurantDetails;

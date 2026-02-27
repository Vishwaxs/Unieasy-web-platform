import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock3,
  MessageSquare,
  Bike,
  Wallet,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFoodItems } from "@/hooks/useFoodItems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RestaurantProfile = {
  distance: string;
  eta: string;
  openHours: string;
  priceForTwo: string;
  phone: string;
  cuisines: string[];
  bestFor: string[];
  amenities: string[];
  popularDishes: string[];
  peakHours: Array<{ time: string; level: number }>;
};

type MenuItem = {
  name: string;
  price: number;
  isVeg: boolean;
  description: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MenuFilter = "all" | "veg" | "nonveg";

const restaurantProfiles: RestaurantProfile[] = [
  {
    distance: "0.4 km",
    eta: "12-18 min",
    openHours: "10:00 AM - 10:30 PM",
    priceForTwo: "Rs. 450",
    phone: "+91 98765 43210",
    cuisines: ["Indian", "North Indian", "Street Food"],
    bestFor: ["Budget Meals", "Quick Lunch", "Dinner with Friends"],
    amenities: ["Takeaway", "Dine-in", "Card Payment", "Student Discounts"],
    popularDishes: ["Paneer Butter Masala", "Tandoori Roti", "Jeera Rice", "Chicken Tikka"],
    peakHours: [
      { time: "12 PM", level: 70 },
      { time: "3 PM", level: 40 },
      { time: "6 PM", level: 60 },
      { time: "9 PM", level: 85 },
    ],
  },
  {
    distance: "0.9 km",
    eta: "20-28 min",
    openHours: "11:00 AM - 11:30 PM",
    priceForTwo: "Rs. 600",
    phone: "+91 91234 56789",
    cuisines: ["Italian", "Continental", "Cafe"],
    bestFor: ["Group Hangouts", "Date Night", "Weekend Treat"],
    amenities: ["Takeaway", "Outdoor Seating", "UPI", "WiFi"],
    popularDishes: ["Farmhouse Pizza", "White Sauce Pasta", "Garlic Bread", "Cold Coffee"],
    peakHours: [
      { time: "12 PM", level: 45 },
      { time: "3 PM", level: 55 },
      { time: "6 PM", level: 78 },
      { time: "9 PM", level: 88 },
    ],
  },
  {
    distance: "0.6 km",
    eta: "15-22 min",
    openHours: "9:30 AM - 10:00 PM",
    priceForTwo: "Rs. 380",
    phone: "+91 99887 77665",
    cuisines: ["South Indian", "Chinese", "Snacks"],
    bestFor: ["Breakfast", "Late Evening Cravings", "Value Meals"],
    amenities: ["Takeaway", "Fast Service", "UPI", "Family Seating"],
    popularDishes: ["Masala Dosa", "Veg Fried Rice", "Noodles", "Filter Coffee"],
    peakHours: [
      { time: "12 PM", level: 68 },
      { time: "3 PM", level: 50 },
      { time: "6 PM", level: 73 },
      { time: "9 PM", level: 58 },
    ],
  },
];

const getProfile = (id: string): RestaurantProfile => {
  const idx = Math.max(0, (Number.parseInt(id, 10) || 1) - 1) % restaurantProfiles.length;
  return restaurantProfiles[idx];
};

const fullMenus: MenuSection[][] = [
  [
    {
      title: "Starters",
      items: [
        { name: "Paneer Tikka", price: 220, isVeg: true, description: "Chargrilled paneer cubes with mint chutney." },
        { name: "Chicken Malai Kebab", price: 280, isVeg: false, description: "Creamy skewers, mildly spiced." },
        { name: "Crispy Corn", price: 170, isVeg: true, description: "Sweet corn tossed with peppers and spice." },
      ],
    },
    {
      title: "Main Course",
      items: [
        { name: "Paneer Butter Masala", price: 260, isVeg: true, description: "Rich tomato gravy with soft paneer." },
        { name: "Butter Chicken", price: 320, isVeg: false, description: "Classic creamy curry with tender chicken." },
        { name: "Jeera Rice", price: 140, isVeg: true, description: "Fragrant basmati with roasted cumin." },
      ],
    },
    {
      title: "Breads and Sides",
      items: [
        { name: "Butter Naan", price: 55, isVeg: true, description: "Soft tandoor bread finished with butter." },
        { name: "Tandoori Roti", price: 35, isVeg: true, description: "Whole wheat roti from clay oven." },
        { name: "Green Salad", price: 95, isVeg: true, description: "Fresh cucumber, onion, tomato, lemon." },
      ],
    },
  ],
  [
    {
      title: "Pizzas",
      items: [
        { name: "Farmhouse Pizza", price: 349, isVeg: true, description: "Onion, capsicum, mushroom and olives." },
        { name: "BBQ Chicken Pizza", price: 399, isVeg: false, description: "Smoky barbecue glaze with chicken." },
        { name: "Margherita Pizza", price: 249, isVeg: true, description: "Classic cheese and tomato base." },
      ],
    },
    {
      title: "Pasta and Bowls",
      items: [
        { name: "White Sauce Pasta", price: 279, isVeg: true, description: "Creamy alfredo with herbs." },
        { name: "Spicy Chicken Pasta", price: 319, isVeg: false, description: "Red sauce pasta with grilled chicken." },
        { name: "Veg Rice Bowl", price: 189, isVeg: true, description: "Sauteed veggies over seasoned rice." },
      ],
    },
    {
      title: "Beverages",
      items: [
        { name: "Cold Coffee", price: 149, isVeg: true, description: "Chilled coffee with thick foam." },
        { name: "Lemon Iced Tea", price: 119, isVeg: true, description: "Fresh brewed tea, lemon and mint." },
        { name: "Chocolate Shake", price: 169, isVeg: true, description: "Dense shake with cocoa drizzle." },
      ],
    },
  ],
  [
    {
      title: "Breakfast",
      items: [
        { name: "Masala Dosa", price: 120, isVeg: true, description: "Crispy dosa with potato masala." },
        { name: "Idli Vada Combo", price: 110, isVeg: true, description: "Soft idlis, vada and sambar." },
        { name: "Egg Bhurji Pav", price: 145, isVeg: false, description: "Spiced scrambled egg with toasted pav." },
      ],
    },
    {
      title: "Lunch and Dinner",
      items: [
        { name: "Veg Fried Rice", price: 170, isVeg: true, description: "Wok tossed rice and vegetables." },
        { name: "Chicken Noodles", price: 210, isVeg: false, description: "Street style noodles with chicken." },
        { name: "Mini Meals Thali", price: 190, isVeg: true, description: "Rice, curry, dal, poriyal and papad." },
      ],
    },
    {
      title: "Snacks",
      items: [
        { name: "Samosa Plate", price: 70, isVeg: true, description: "Two crispy samosas with chutneys." },
        { name: "Pani Puri", price: 60, isVeg: true, description: "Crunchy puris with spicy tangy water." },
        { name: "Chicken Roll", price: 140, isVeg: false, description: "Layered paratha stuffed with chicken." },
      ],
    },
  ],
];

const getFullMenu = (id: string): MenuSection[] => {
  const idx = Math.max(0, (Number.parseInt(id, 10) || 1) - 1) % fullMenus.length;
  return fullMenus[idx];
};

const FoodRestaurantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useFoodItems();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);
  const profile = useMemo(() => getProfile(item?.id ?? "1"), [item?.id]);
  const menuSections = useMemo(() => getFullMenu(item?.id ?? "1"), [item?.id]);
  const [menuFilter, setMenuFilter] = useState<MenuFilter>("all");
  const filteredMenuSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter((menuItem) => {
            if (menuFilter === "veg") return menuItem.isVeg;
            if (menuFilter === "nonveg") return !menuItem.isVeg;
            return true;
          }),
        }))
        .filter((section) => section.items.length > 0),
    [menuSections, menuFilter]
  );

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
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={item.image} alt={item.restaurant} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-950/85 via-black/60 to-black/40" />
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{item.restaurant}</h1>
              <p className="text-white/85 mt-2 max-w-2xl">
                Student favorite for quick and reliable meals near campus.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/90">
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                  <span className="text-xs text-white/70">({item.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                  <Bike className="w-4 h-4" />
                  <span>{profile.eta}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.distance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-orange-200/50 dark:border-orange-900/60 bg-gradient-to-br from-orange-50/70 to-background dark:from-orange-950/30 dark:to-background p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold text-foreground">Featured Dish</h2>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-0 dark:bg-orange-900/40 dark:text-orange-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Ordered
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <img src={item.image} alt={item.name} className="w-full sm:w-56 h-40 sm:h-40 object-cover rounded-xl" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <p className="text-muted-foreground mt-1">
                    Signature preparation from {item.restaurant} with fresh ingredients and balanced flavors.
                  </p>
                  <div className="mt-3 text-primary text-2xl font-bold">Rs. {item.price}</div>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span className="italic">"{item.comment}"</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.cuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="outline">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-semibold text-foreground">Menu Highlights</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.popularDishes.map((dish) => (
                    <div key={dish} className="rounded-xl border border-border p-3 bg-background/60">
                      <p className="font-medium text-foreground">{dish}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {item.restaurant} serves student-friendly meals with consistent quality and quick service. This place is known for practical portions, fair pricing, and reliable taste for both quick bites and proper meals.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {profile.bestFor.map((label) => (
                    <div key={label} className="rounded-xl bg-muted/50 border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">Menu</h2>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={menuFilter === "veg" ? "default" : "outline"}
                    onClick={() => setMenuFilter((prev) => (prev === "veg" ? "all" : "veg"))}
                  >
                    Veg
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={menuFilter === "nonveg" ? "default" : "outline"}
                    onClick={() => setMenuFilter((prev) => (prev === "nonveg" ? "all" : "nonveg"))}
                  >
                    Non-Veg
                  </Button>
                </div>
              </div>
              <div className="space-y-6">
                {filteredMenuSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{section.title}</h3>
                    <div className="space-y-3">
                      {section.items.map((menuItem) => (
                        <div
                          key={menuItem.name}
                          className="rounded-xl border border-border bg-background/60 p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className={menuItem.isVeg ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                                {menuItem.isVeg ? "Veg" : "Non-Veg"}
                              </Badge>
                              <p className="font-medium text-foreground">{menuItem.name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{menuItem.description}</p>
                          </div>
                          <p className="text-sm font-semibold text-primary whitespace-nowrap">Rs. {menuItem.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredMenuSections.length === 0 && (
                  <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                    No menu items found for this filter.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Info</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {profile.distance} from Central Campus
                </li>
                <li className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-primary" />
                  {profile.openHours}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  {profile.phone}
                </li>
                <li className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-primary" />
                  Delivery in {profile.eta}
                </li>
                <li className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Average cost for two: {profile.priceForTwo}
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {profile.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="bg-muted/70">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Popular Hours</h3>
              <div className="space-y-3">
                {profile.peakHours.map((slot) => (
                  <div key={slot.time}>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{slot.time}</span>
                      <span>{slot.level}% busy</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/80 rounded-full" style={{ width: `${slot.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/food" className="inline-flex mt-5 text-primary hover:underline">
                Browse more food options
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

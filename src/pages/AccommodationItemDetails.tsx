import { Link, useNavigate, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Car,
  Shield,
  UtensilsCrossed,
  Shirt,
  Dumbbell,
  Snowflake,
  Phone,
  Clock3,
  CheckCircle2,
  Building2,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAccommodations } from "@/hooks/useAccommodations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StayProfile = {
  ownerName: string;
  phone: string;
  visitHours: string;
  deposit: string;
  availableFrom: string;
  roomTypes: Array<{ label: string; monthly: number; notes: string }>;
  rentIncludes: string[];
  rules: string[];
};

const stayProfiles: StayProfile[] = [
  {
    ownerName: "Anil Kumar",
    phone: "+91 99887 11223",
    visitHours: "10:00 AM - 7:00 PM",
    deposit: "Rs. 20,000",
    availableFrom: "Immediate",
    roomTypes: [
      { label: "Shared Room (3 Sharing)", monthly: 8000, notes: "Best for budget-conscious students." },
      { label: "Shared Room (2 Sharing)", monthly: 9800, notes: "Balanced privacy and affordability." },
      { label: "Single Room", monthly: 13000, notes: "For maximum privacy and focus." },
    ],
    rentIncludes: ["WiFi", "Housekeeping", "Security", "Electricity (fair use)"],
    rules: ["No loud music after 10 PM", "Visitors till 8 PM", "ID verification mandatory"],
  },
  {
    ownerName: "Priya Menon",
    phone: "+91 91234 99876",
    visitHours: "9:30 AM - 8:00 PM",
    deposit: "Rs. 25,000",
    availableFrom: "From next month",
    roomTypes: [
      { label: "Twin Sharing", monthly: 12000, notes: "Includes meals and laundry." },
      { label: "Single Occupancy", monthly: 16500, notes: "Premium room with attached bath." },
    ],
    rentIncludes: ["WiFi", "Meals", "Laundry", "Daily Cleaning"],
    rules: ["Gate closes at 11 PM", "No smoking indoors", "Mess timings are fixed"],
  },
  {
    ownerName: "Raghav Sharma",
    phone: "+91 90909 12121",
    visitHours: "11:00 AM - 6:30 PM",
    deposit: "Rs. 30,000",
    availableFrom: "Within 2 weeks",
    roomTypes: [
      { label: "Studio Unit", monthly: 15000, notes: "Ideal for students needing quiet space." },
      { label: "2BHK Shared", monthly: 18500, notes: "Split with roommate, includes common lounge." },
    ],
    rentIncludes: ["WiFi", "Parking", "Gym Access", "24x7 Security"],
    rules: ["No pets", "Maintenance requests via warden", "Separate guest policy"],
  },
];

const getProfile = (id: string): StayProfile => {
  const idx = Math.max(0, (Number.parseInt(id, 10) || 1) - 1) % stayProfiles.length;
  return stayProfiles[idx];
};

const amenityMeta: Record<string, { icon: ReactNode; label: string }> = {
  wifi: { icon: <Wifi className="w-4 h-4" />, label: "High-Speed WiFi" },
  parking: { icon: <Car className="w-4 h-4" />, label: "Parking" },
  security: { icon: <Shield className="w-4 h-4" />, label: "24x7 Security" },
  meals: { icon: <UtensilsCrossed className="w-4 h-4" />, label: "Meals Included" },
  laundry: { icon: <Shirt className="w-4 h-4" />, label: "Laundry" },
  gym: { icon: <Dumbbell className="w-4 h-4" />, label: "Gym" },
  ac: { icon: <Snowflake className="w-4 h-4" />, label: "Air Conditioning" },
};

const AccommodationItemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useAccommodations();

  const item = items.find((x) => x.id === id);
  const profile = getProfile(item?.id ?? "1");

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
              <h1 className="text-2xl font-semibold text-foreground">Accommodation not found</h1>
              <p className="text-muted-foreground mt-2">Please go back and choose another accommodation option.</p>
              <Link to="/accommodation" className="inline-block mt-4 text-primary hover:underline">
                Go to Accommodation
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
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-950/85 via-black/60 to-black/40" />
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{item.name}</h1>
              <p className="text-white/85 mt-2 max-w-2xl">
                Detailed accommodation insights to help you choose confidently.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/90">
                <Badge className="bg-primary text-primary-foreground">{item.type}</Badge>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                  <span className="text-xs text-white/70">({item.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{item.distance} from campus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {item.comment} This stay is popular among students looking for a practical monthly setup near campus with essential facilities and reliable management.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.rentIncludes.map((inc) => (
                  <div key={inc} className="rounded-xl border border-border bg-background/60 p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Room Options</h2>
              <div className="space-y-3">
                {profile.roomTypes.map((room) => (
                  <div key={room.label} className="rounded-xl border border-border p-4 bg-background/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{room.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{room.notes}</p>
                      </div>
                      <p className="text-primary font-bold whitespace-nowrap">Rs. {room.monthly.toLocaleString()}/month</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.amenities.map((amenity) => {
                  const meta = amenityMeta[amenity] ?? { icon: <Building2 className="w-4 h-4" />, label: amenity };
                  return (
                    <div key={amenity} className="rounded-xl border border-border p-3 bg-background/60 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">{meta.icon}</div>
                      <span className="text-sm font-medium text-foreground capitalize">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Facts</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Type: {item.type}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {item.distance} from campus
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Deposit: {profile.deposit}
                </li>
                <li className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-primary" />
                  Visit hours: {profile.visitHours}
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Rules</h3>
              <div className="space-y-2">
                {profile.rules.map((rule) => (
                  <div key={rule} className="rounded-lg bg-muted/60 border border-border px-3 py-2 text-sm text-foreground">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Contact</h3>
              <p className="text-sm text-muted-foreground">Owner/Manager: {profile.ownerName}</p>
              <p className="text-sm text-muted-foreground mt-2">Available from: {profile.availableFrom}</p>
              <Button className="w-full mt-4">
                <Phone className="w-4 h-4 mr-2" />
                Call {profile.phone}
              </Button>
              <Link to="/accommodation" className="inline-flex mt-4 text-primary hover:underline text-sm">
                Browse more options
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccommodationItemDetails;

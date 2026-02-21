import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, LogOut, Edit2, Camera, Settings, Bell, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();

  const menuItems = [
    { icon: Bell, label: "Notifications", href: "#" },
    { icon: Shield, label: "Privacy & Security", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 md:pt-24 pb-12 md:pb-16 px-4 md:px-6">
        <div className="container max-w-2xl mx-auto">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Profile Header Card */}
          <div className="bg-card rounded-3xl shadow-md overflow-hidden animate-fade-up">
            {/* Cover Image */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-primary/80 to-mint relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            </div>
            
            {/* Avatar & Info */}
            <div className="px-5 sm:px-6 pb-6 -mt-12 sm:-mt-14">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName ?? "User"} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 sm:w-14 sm:h-14 text-primary" />
                    )}
                  </div>
                  <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Name & Role */}
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{user?.fullName ?? "User"}</h1>
                  <p className="text-muted-foreground text-sm sm:text-base capitalize">{role ?? "student"}</p>
                </div>
                
                {/* Edit Button */}
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold text-primary">12</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Reviews</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold text-primary">28</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Saved</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold text-primary">5</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Visited</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground truncate">{user?.primaryPhoneNumber?.phoneNumber ?? "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium text-foreground truncate capitalize">{role ?? "student"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="mt-6 bg-card rounded-2xl shadow-sm overflow-hidden animate-fade-up stagger-1">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </a>
            ))}
          </div>

          {/* Sign Out */}
          <div className="mt-6 animate-fade-up stagger-2">
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              onClick={() => signOut({ redirectUrl: "/" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  LogOut,
  Edit2,
  Camera,
  Settings,
  Bell,
  Shield,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getUserReviewCount } from "@/lib/reviewStats";

interface ProfileData {
  phone: string;
  student_id: string;
  programme: string;
  year_of_study: string;
  bio: string;
}

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setReviewCount(0);
      return;
    }

    setReviewCount(getUserReviewCount(user.id));
  }, [user?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    phone: "",
    student_id: "",
    programme: "",
    year_of_study: "",
    bio: "",
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("phone, student_id, programme, year_of_study, bio")
          .eq("clerk_user_id", user.id)
          .single();

        if (error) {
          console.error("[Profile] Fetch error:", error.message);
        } else if (data) {
          const fetched: ProfileData = {
            phone: data.phone ?? "",
            student_id: data.student_id ?? "",
            programme: data.programme ?? "",
            year_of_study: data.year_of_study ?? "",
            bio: data.bio ?? "",
          };
          setProfileData(fetched);
          setEditData(fetched);
        }
      } catch (err) {
        console.error("[Profile] Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("app_users")
        .update({
          phone: editData.phone || null,
          student_id: editData.student_id || null,
          programme: editData.programme || null,
          year_of_study: editData.year_of_study || null,
          bio: editData.bio || null,
        })
        .eq("clerk_user_id", user.id);

      if (error) {
        toast.error("Failed to save profile: " + error.message);
        return;
      }

      setProfileData(editData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error("[Profile] Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleAvatarUpload = async () => {
    if (!user) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await user.setProfileImage({ file });
        toast.success("Profile photo updated!");
      } catch (err) {
        toast.error("Failed to update photo");
        console.error("[Profile] Avatar upload error:", err);
      }
    };
    input.click();
  };

  const menuItems = [
    {
      icon: Bell,
      label: "Notifications",
      action: () => toast.info("Notifications coming soon!"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      action: () => toast.info("Privacy settings coming soon!"),
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => toast.info("Settings coming soon!"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 pb-12 md:pb-14 px-4 md:px-6">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.info("Profile editing coming soon!")}
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-7">
            <section className="lg:col-span-2 space-y-6 md:space-y-7">
              <div className="bg-card rounded-3xl shadow-md overflow-hidden animate-fade-up">
                <div className="h-24 sm:h-28 bg-gradient-to-r from-primary via-primary/80 to-mint relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                </div>

                <div className="px-5 sm:px-7 pt-4 pb-6 md:pb-7">
                  <div className="flex items-center gap-4 sm:gap-5 mb-5">
                    <div className="relative -mt-12 sm:-mt-14">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.fullName ?? "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        )}
                      </div>
                      <button
                        onClick={() => toast.info("Photo upload coming soon!")}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1 pt-1">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight text-foreground break-words">
                        {user?.fullName ?? "User"}
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base capitalize">
                        {role ?? "student"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        {reviewCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reviews
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        28
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saved
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        5
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Visited
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-up stagger-1">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Account Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.primaryEmailAddress?.emailAddress ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.primaryPhoneNumber?.phoneNumber ?? "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Member Since
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-IN",
                              { month: "long", year: "numeric" },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {role ?? "student"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="h-fit space-y-4 md:space-y-5">
              <div className="bg-card rounded-2xl shadow-sm overflow-hidden animate-fade-up">
                <div className="px-5 py-3.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                  </h2>
                </div>
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center gap-3 px-5 py-3.5 w-full text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

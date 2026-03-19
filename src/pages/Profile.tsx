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
  Bell,
  Shield,
  ChevronRight,
  Calendar,
  Bookmark,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProfileData {
  full_name: string;
  phone: string;
  student_id: string;
  programme: string;
  year_of_study: string;
  bio: string;
  avatar_url: string;
}

type SavedPlace = {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
  address: string | null;
  rating: number | null;
  rating_count: number | null;
  photo_refs: string[] | null;
};

type SavedReactionRow = {
  places: SavedPlace[] | null;
};

type ReviewPlace = {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
};

type UserReviewRow = {
  id: string;
  place_id: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  places: ReviewPlace[] | null;
};

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();
  const [reviewCount, setReviewCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);

  // Saved places panel
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<UserReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadSavedPlaces = async () => {
    if (!user?.id) return;
    setSavedLoading(true);
    const { data } = await supabase
      .from("user_reactions")
      .select(
        "places(id, name, category, sub_type, address, rating, rating_count, photo_refs)",
      )
      .eq("clerk_user_id", user.id)
      .eq("reaction", "bookmark")
      .order("created_at", { ascending: false });
    const rows = (data as SavedReactionRow[] | null) ?? [];
    const places = rows.flatMap((row) => row.places ?? []);
    setSavedPlaces(places);
    setSavedLoading(false);
  };

  const toggleSaved = () => {
    if (!savedOpen) loadSavedPlaces();
    setSavedOpen((v) => !v);
  };

  const loadMyReviews = async () => {
    if (!user?.id) return;
    setReviewsLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, place_id, rating, body, status, created_at, places(id, name, category, sub_type)")
      .eq("clerk_user_id", user.id)
      .order("created_at", { ascending: false });
    setUserReviews((data as UserReviewRow[] | null) ?? []);
    setReviewsLoading(false);
  };

  const toggleMyReviews = () => {
    if (!reviewsOpen) loadMyReviews();
    setReviewsOpen((v) => !v);
  };

  useEffect(() => {
    if (!user?.id) {
      setReviewCount(0);
      setSavedCount(0);
      setLikedCount(0);
      return;
    }

    const fetchStats = async () => {
      const [reviewRes, bookmarkRes, likeRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("clerk_user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("user_reactions")
          .select("id", { count: "exact", head: true })
          .eq("clerk_user_id", user.id)
          .eq("reaction", "bookmark"),
        supabase
          .from("user_reactions")
          .select("id", { count: "exact", head: true })
          .eq("clerk_user_id", user.id)
          .eq("reaction", "like"),
      ]);
      setReviewCount(reviewRes.count ?? 0);
      setSavedCount(bookmarkRes.count ?? 0);
      setLikedCount(likeRes.count ?? 0);
    };

    fetchStats();
  }, [user?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    phone: "",
    student_id: "",
    programme: "",
    year_of_study: "",
    bio: "",
    avatar_url: "",
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select(
            "phone, bio, student_id, programme, year_of_study, full_name, avatar_url",
          )
          .eq("clerk_user_id", user.id)
          .single();

        if (error) {
          console.error("[Profile] Fetch error:", error.message);
        } else if (data) {
          const fetched: ProfileData = {
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            student_id: data.student_id ?? "",
            programme: data.programme ?? "",
            year_of_study: data.year_of_study ?? "",
            bio: data.bio ?? "",
            avatar_url: data.avatar_url ?? "",
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

    const normalizedPhone = editData.phone.replace(/\s+/g, "").trim();
    if (normalizedPhone && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    const normalizedBio = editData.bio.trim();
    if (normalizedBio.length > 200) {
      toast.error("Bio must be 200 characters or less");
      return;
    }

    setIsSaving(true);
    try {
      const full_name = editData.full_name.trim();
      const phone = normalizedPhone;
      const bio = normalizedBio;
      const student_id = editData.student_id.trim();
      const programme = editData.programme.trim();
      const year_of_study = editData.year_of_study;

      const { error } = await supabase
        .from("app_users")
        .update({
          phone,
          bio,
          full_name,
          programme,
          year_of_study,
          student_id,
        })
        .eq("clerk_user_id", user.id);

      if (error) {
        toast.error("Failed to save profile: " + error.message);
        return;
      }

      if (full_name) {
        const [firstName, ...rest] = full_name.split(/\s+/);
        const lastName = rest.join(" ");
        await user.update({ firstName, lastName });
      }

      setProfileData({
        ...editData,
        full_name,
        phone,
        bio,
        student_id,
        programme,
        year_of_study,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
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
      label: "My Reviews",
      action: toggleMyReviews,
    },
    {
      icon: Shield,
      label: "Contact Support",
      action: () => window.location.assign("/contact"),
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
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditData(profileData);
                  setIsEditing(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
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
                        onClick={handleAvatarUpload}
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
                    <button
                      type="button"
                      onClick={toggleSaved}
                      className={`text-center p-3 sm:p-4 rounded-xl transition-colors ${savedOpen ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/50 hover:bg-muted/80"}`}
                    >
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        {savedCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                        <Bookmark className="w-3 h-3" /> Saved
                      </p>
                    </button>
                    <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-xl">
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        {likedCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Liked
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved Places Panel */}
              {savedOpen && (
                <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-primary" /> Saved Places
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSavedOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {savedLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 bg-muted/40 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : savedPlaces.length === 0 ? (
                    <div className="text-center py-10">
                      <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No saved places yet.
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Bookmark places to find them here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedPlaces.map((place) => {
                        const section =
                          place.category === "accommodation"
                            ? "accommodation"
                            : place.category === "campus"
                              ? "campus"
                              : place.category === "study"
                                ? "study"
                                : place.category === "essentials"
                                  ? "essentials"
                                  : place.category === "explore"
                                    ? "explore"
                                    : "food";
                        return (
                          <Link
                            key={place.id}
                            to={`/${section}/${place.id}`}
                            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors group"
                          >
                            {place.photo_refs?.length ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/places/${place.id}/photo/0`}
                                alt={place.name}
                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bookmark className="w-5 h-5 text-primary/40" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate capitalize">
                                {place.name}
                              </p>
                              {place.sub_type && (
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                  {place.sub_type}
                                </p>
                              )}
                              {place.address && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {place.address}
                                </p>
                              )}
                              {place.rating != null && place.rating > 0 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {place.rating.toFixed(1)}
                                  {place.rating_count
                                    ? ` (${place.rating_count})`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* My Reviews Panel */}
              {reviewsOpen && (
                <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" /> My Reviews
                    </h2>
                    <button
                      type="button"
                      onClick={() => setReviewsOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {reviewsLoading ? (
                    <div className="grid grid-cols-1 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : userReviews.length === 0 ? (
                    <div className="text-center py-10">
                      <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">You have not posted any reviews yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {userReviews.map((review) => {
                        const place = review.places?.[0] ?? null;
                        const section = place?.category === "accommodation" ? "accommodation"
                          : place?.category === "campus" ? "campus"
                          : place?.category === "study" ? "study"
                          : place?.category === "essentials" ? "essentials"
                          : place?.category === "explore" ? "explore"
                          : "food";
                        const destination = place ? `/${section}/${place.id}` : "/home";

                        return (
                          <Link
                            key={review.id}
                            to={destination}
                            className="block p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {place?.name ?? "Reviewed place"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(review.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={n}
                                    className={`w-3.5 h-3.5 ${n <= Math.round(review.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{review.body}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
                        {profileData.phone ||
                          user?.primaryPhoneNumber?.phoneNumber ||
                          "Not set"}
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

              {isEditing ? (
                <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-up stagger-1">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Edit Profile
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Full Name
                      </label>
                      <Input
                        value={editData.full_name}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Asha Kumar"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Phone
                      </label>
                      <Input
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
                        }
                        placeholder="10-digit mobile (e.g. 9876543210)"
                        inputMode="numeric"
                        pattern="^[6-9]\d{9}$"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Student ID
                      </label>
                      <Input
                        value={editData.student_id}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            student_id: e.target.value,
                          })
                        }
                        placeholder="e.g. 2312456"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Programme
                      </label>
                      <Input
                        value={editData.programme}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            programme: e.target.value,
                          })
                        }
                        placeholder='e.g. "B.Com Computer Applications"'
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Year of Study
                      </label>
                      <Select
                        value={editData.year_of_study}
                        onValueChange={(value) =>
                          setEditData({ ...editData, year_of_study: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Bio
                      </label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) =>
                          setEditData({ ...editData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself..."
                        rows={3}
                        maxLength={200}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {editData.bio.length}/200
                      </p>
                    </div>
                  </div>
                </div>
              ) : profileData.bio ||
                profileData.programme ||
                profileData.student_id ? (
                <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-up stagger-1">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Profile Info
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profileData.programme && (
                      <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Programme
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {profileData.programme}
                          </p>
                        </div>
                      </div>
                    )}
                    {profileData.year_of_study && (
                      <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Year of Study
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {profileData.year_of_study}
                          </p>
                        </div>
                      </div>
                    )}
                    {profileData.student_id && (
                      <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl min-h-[76px]">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Student ID
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {profileData.student_id}
                          </p>
                        </div>
                      </div>
                    )}
                    {profileData.bio && (
                      <div className="sm:col-span-2 p-3.5 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">
                          Bio
                        </p>
                        <p className="text-sm text-foreground">
                          {profileData.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
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

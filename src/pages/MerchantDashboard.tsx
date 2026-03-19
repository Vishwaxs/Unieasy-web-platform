import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload,
  Image,
  Eye,
  CheckCircle,
  Clock,
  X,
  LogOut,
  Loader2,
  BarChart3,
  Megaphone,
  TrendingUp,
  Bell,
  Trash2,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import {
  uploadAdImage,
  createAd,
  fetchMyAds,
  apiFetch,
  deleteMyAd,
  requestMerchantUpgrade,
  fetchMerchantUpgradeStatus,
} from "@/lib/adminApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  target_location: string | null;
  duration_days: number;
  status: "pending" | "active" | "rejected" | "expired" | string;
  impression_count?: number | null;
  click_count?: number | null;
  rejected_reason?: string | null;
  link_url?: string | null;
  button_text?: string | null;
  category_target?: string | null;
  created_at: string;
}

interface MerchantAnalytics {
  ads: { total: number; active: number; impressions: number };
}

type UpgradeRequestStatus = "none" | "pending" | "approved" | "rejected";

type MerchantUpgradeRequest = {
  status: UpgradeRequestStatus;
  review_note?: string | null;
  created_at?: string | null;
};

type NotificationRow = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  is_read: boolean | null;
  created_at: string;
};

const MerchantDashboard = () => {
  const role = useUserRole();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [categoryTarget, setCategoryTarget] = useState("home");
  const [durationDays, setDurationDays] = useState(7);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<"my-ads" | "submit-ad" | "notifications" | "account">("my-ads");
  const [resubmitSourceAd, setResubmitSourceAd] = useState<Ad | null>(null);

  // Upgrade request (students)
  const [upgradeStatus, setUpgradeStatus] = useState<MerchantUpgradeRequest | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  // Fetch user's existing ads via server endpoint
  useEffect(() => {
    if (!user || role !== "merchant") {
      setMyAds([]);
      setLoadingAds(false);
      return;
    }
    const loadAds = async () => {
      setLoadingAds(true);
      try {
        const data = await fetchMyAds(getToken);
        setMyAds(data as Ad[]);
      } catch {
        // Silently fail — ads list is non-critical
      } finally {
        setLoadingAds(false);
      }
    };
    loadAds();
  }, [user, submitted, getToken, role]);

  // Fetch analytics
  useEffect(() => {
    if (!user || role !== "merchant") {
      setAnalytics(null);
      return;
    }
    const loadAnalytics = async () => {
      try {
        const data = await apiFetch(getToken, "/merchant/analytics");
        setAnalytics(data);
      } catch {
        // Non-critical
      }
    };
    loadAnalytics();
  }, [user, getToken, role]);

  // Fetch merchant upgrade request status (students)
  useEffect(() => {
    if (!user || role !== "student") {
      setUpgradeStatus(null);
      return;
    }
    const loadStatus = async () => {
      setUpgradeLoading(true);
      try {
        const data = await fetchMerchantUpgradeStatus(getToken);
        setUpgradeStatus(data as MerchantUpgradeRequest);
      } catch {
        setUpgradeStatus({ status: "none" });
      } finally {
        setUpgradeLoading(false);
      }
    };
    loadStatus();
  }, [user, getToken, role]);

  // Fetch notifications (all signed-in users)
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const loadNotifications = async () => {
      setLoadingNotifications(true);
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, type, is_read, created_at")
        .eq("clerk_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data ?? []) as NotificationRow[]);
      setLoadingNotifications(false);
    };
    loadNotifications();
  }, [user?.id]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !user) return;
    setIsSubmitting(true);

    try {
      // 1. Upload image via server endpoint
      const { imageUrl } = await uploadAdImage(getToken, imageFile);

      // 2. Create ad record via server endpoint
      await createAd(getToken, {
        title: adTitle.trim(),
        description: adDescription.trim(),
        imageUrl,
        targetLocation: targetLocation.trim(),
        linkUrl: linkUrl.trim(),
        buttonText: buttonText.trim(),
        categoryTarget,
        durationDays,
      });

      toast.success("Advertisement submitted for review!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageFile(null);
  };

  const handleNewAd = () => {
    setUploadedImage(null);
    setImageFile(null);
    setAdTitle("");
    setAdDescription("");
    setTargetLocation("");
    setLinkUrl("");
    setButtonText("");
    setCategoryTarget("home");
    setDurationDays(7);
    setSubmitted(false);
    setResubmitSourceAd(null);
  };

  const titleLimit = 60;
  const descLimit = 200;
  const buttonTextLimit = 20;
  const websiteLimit = 120;
  const businessDescLimit = 400;

  const statusBadge = (ad: Ad) => {
    const s = ad.status;
    if (s === "pending")
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Awaiting review
        </span>
      );
    if (s === "active")
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      );
    if (s === "rejected")
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Rejected
        </span>
      );
    if (s === "expired")
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
          Expired
        </span>
      );
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{s}</span>
    );
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await deleteMyAd(getToken, adId);
      toast.success("Ad deleted");
      setSubmitted((v) => !v);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ad");
    }
  };

  const handleResubmit = (ad: Ad) => {
    setResubmitSourceAd(ad);
    setSubmitted(false);
    setUploadedImage(ad.image_url || null);
    setImageFile(null);
    setAdTitle(ad.title || "");
    setAdDescription(ad.description || "");
    setTargetLocation(ad.target_location || "");
    setLinkUrl(ad.link_url || "");
    setButtonText(ad.button_text || "");
    setCategoryTarget(ad.category_target || "home");
    setDurationDays(ad.duration_days || 7);
    setActiveTab("submit-ad");
  };

  const submitUpgradeRequest = async () => {
    if (!user) return;
    if (!businessName.trim() || !businessType || !contactNumber.trim() || !businessDescription.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setUpgradeSubmitting(true);
    try {
      await requestMerchantUpgrade(getToken, {
        business_name: businessName.trim(),
        business_type: businessType,
        contact_number: contactNumber.trim(),
        description: businessDescription.trim(),
        website: businessWebsite.trim() || undefined,
      });
      toast.success("Request submitted! You'll receive an email once reviewed.");
      setUpgradeStatus({ status: "pending" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setUpgradeSubmitting(false);
    }
  };

  const markNotificationRead = async (n: NotificationRow) => {
    if (!user?.id) return;
    if (n.is_read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 pb-8 md:pb-12 px-4 md:px-6">
        <div className="container max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12 animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Advertisement Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Create and manage your advertisements for UniEasy
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="my-ads">My Ads</TabsTrigger>
              <TabsTrigger value="submit-ad">Submit Ad</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                Notifications
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs">
                    {unreadCount}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* My Ads */}
            <TabsContent value="my-ads" className="mt-6">
              {role !== "merchant" ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
                  Switch to a merchant account to manage ads.
                </div>
              ) : loadingAds ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : myAds.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                  No ads yet. Submit your first ad from the “Submit Ad” tab.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myAds.map((ad) => (
                    <div key={ad.id} className="bg-card rounded-xl border border-border overflow-hidden">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-36 object-cover" />
                      ) : null}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium text-foreground truncate">{ad.title}</h4>
                            {ad.description ? (
                              <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                            ) : null}
                          </div>
                          {statusBadge(ad)}
                        </div>

                        {ad.status === "active" ? (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" /> {ad.impression_count ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" /> {ad.click_count ?? 0}
                            </span>
                          </div>
                        ) : null}

                        {ad.status === "rejected" && ad.rejected_reason ? (
                          <div className="text-xs text-red-500">
                            {ad.rejected_reason}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 pt-1">
                          {ad.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleDeleteAd(ad.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
                          {ad.status === "rejected" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleResubmit(ad)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              Resubmit
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Submit Ad */}
            <TabsContent value="submit-ad" className="mt-6">
              {submitted ? (
                <div className="bg-card rounded-2xl border border-border p-8 md:p-12 text-center animate-scale-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 mb-6">
                    <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    Advertisement Submitted!
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm md:text-base">
                    Your advertisement has been submitted for review. We'll notify you once it's approved and live on UniEasy.
                  </p>

                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">Review time: 24-48 hours</span>
                    </div>
                  </div>

                  {uploadedImage && (
                    <div className="mb-8">
                      <p className="text-sm text-muted-foreground mb-3">Submitted Advertisement:</p>
                      <div className="relative inline-block rounded-xl overflow-hidden border border-border">
                        <img
                          src={uploadedImage}
                          alt="Submitted ad"
                          className="max-w-full md:max-w-md max-h-64 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={handleNewAd} size="lg">
                    Create Another Advertisement
                  </Button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Upload Section */}
                  <div className="bg-card rounded-2xl border border-border p-6 md:p-8 animate-fade-up">
                    <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      Upload Advertisement Image
                    </h2>

                    {uploadedImage ? (
                      <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden border border-border">
                          <img
                            src={uploadedImage}
                            alt="Uploaded preview"
                            className="w-full h-48 md:h-64 object-cover"
                          />
                          <button
                            onClick={handleRemoveImage}
                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            type="button"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Click the X to remove and upload a different image
                        </p>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-border rounded-xl p-8 md:p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-all">
                          <Upload className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-foreground font-medium mb-2">Drop your image here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                          <p className="text-xs text-muted-foreground">
                            Recommended: 1200x628px • JPG, PNG • Max 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Preview */}
                    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
                      <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Preview
                      </div>
                      <div className="rounded-xl overflow-hidden border border-border bg-background">
                        <div
                          className="h-36 bg-cover bg-center"
                          style={{
                            backgroundImage: uploadedImage ? `url(${uploadedImage})` : "none",
                          }}
                        />
                        <div className="p-3">
                          <div className="text-sm font-semibold text-foreground line-clamp-1">
                            {adTitle || "Your ad title"}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {adDescription || "Your description will appear here."}
                          </div>
                          <div className="mt-3">
                            <span className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                              {buttonText || "Learn More"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="bg-card rounded-2xl border border-border p-6 md:p-8 animate-fade-up stagger-1">
                    <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6">
                      Advertisement Details
                      {resubmitSourceAd ? (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (Resubmitting)
                        </span>
                      ) : null}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Ad Title</label>
                          <span className="text-xs text-muted-foreground">
                            {adTitle.length}/{titleLimit}
                          </span>
                        </div>
                        <Input
                          type="text"
                          placeholder="e.g., 50% Off on All Pizzas!"
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value.slice(0, titleLimit))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Description</label>
                          <span className="text-xs text-muted-foreground">
                            {adDescription.length}/{descLimit}
                          </span>
                        </div>
                        <textarea
                          placeholder="Brief description of your offer..."
                          value={adDescription}
                          onChange={(e) => setAdDescription(e.target.value.slice(0, descLimit))}
                          className="w-full min-h-20 md:min-h-24 px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Link URL</label>
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">CTA Button Text</label>
                          <span className="text-xs text-muted-foreground">
                            {buttonText.length}/{buttonTextLimit}
                          </span>
                        </div>
                        <Input
                          type="text"
                          placeholder="e.g., Order Now"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value.slice(0, buttonTextLimit))}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Category Target</label>
                        <select
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={categoryTarget}
                          onChange={(e) => setCategoryTarget(e.target.value)}
                        >
                          <option value="home">Home</option>
                          <option value="food">Food</option>
                          <option value="accommodation">Accommodation</option>
                          <option value="study">Study</option>
                          <option value="hangout">Explore</option>
                          <option value="essentials">Essentials</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Target Location</label>
                        <Input
                          type="text"
                          placeholder="e.g., Near campus"
                          value={targetLocation}
                          onChange={(e) => setTargetLocation(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Duration</label>
                        <select
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={durationDays}
                          onChange={(e) => setDurationDays(Number(e.target.value))}
                        >
                          <option value="7">7 Days</option>
                          <option value="14">14 Days</option>
                          <option value="30">30 Days</option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={!uploadedImage || !adTitle || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Submit for Review"
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By submitting, you agree to our advertising guidelines and terms of service.
                      </p>
                    </form>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="mt-6">
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </h2>
                </div>

                {loadingNotifications ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markNotificationRead(n)}
                        className={[
                          "w-full text-left rounded-xl border border-border p-4 transition-colors",
                          n.is_read ? "bg-background/60" : "bg-primary/5 hover:bg-primary/10",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {n.title || "Notification"}
                              </span>
                              {!n.is_read ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                  New
                                </span>
                              ) : null}
                            </div>
                            {n.body ? (
                              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {n.body}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(n.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Account */}
            <TabsContent value="account" className="mt-6 space-y-6">
              {role === "student" ? (
                <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Become a Merchant
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submit your business details to request a merchant upgrade.
                      </p>
                    </div>
                    {upgradeStatus?.status && upgradeStatus.status !== "none" ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {upgradeStatus.status}
                      </span>
                    ) : null}
                  </div>

                  {upgradeLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : upgradeStatus?.status === "pending" ? (
                    <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-foreground">
                      Request submitted! You'll receive an email once reviewed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Business Name</label>
                        <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Business Type</label>
                        <select
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                        >
                          <option value="">Select type</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Cafe">Cafe</option>
                          <option value="Accommodation">Accommodation</option>
                          <option value="Services">Services</option>
                          <option value="Retail">Retail</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Contact Number</label>
                        <Input
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="+91..."
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Website</label>
                          <span className="text-xs text-muted-foreground">
                            {businessWebsite.length}/{websiteLimit}
                          </span>
                        </div>
                        <Input
                          value={businessWebsite}
                          onChange={(e) => setBusinessWebsite(e.target.value.slice(0, websiteLimit))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Description</label>
                          <span className="text-xs text-muted-foreground">
                            {businessDescription.length}/{businessDescLimit}
                          </span>
                        </div>
                        <textarea
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value.slice(0, businessDescLimit))}
                          className="w-full min-h-24 px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          placeholder="Tell us about your business..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button onClick={submitUpgradeRequest} disabled={upgradeSubmitting} className="w-full">
                          {upgradeSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {analytics && role === "merchant" ? (
                <div className="animate-fade-up">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Performance Analytics
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Ads</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-foreground">{analytics.ads.total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analytics.ads.active} active</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ad Impressions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-foreground">{analytics.ads.impressions.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total views across all ads</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Impressions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-foreground">
                            {analytics.ads.total > 0 ? Math.round(analytics.ads.impressions / analytics.ads.total).toLocaleString() : 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Per advertisement</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : null}

              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => navigate("/home")}>
                    Go to Home
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => signOut({ redirectUrl: "/" })}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantDashboard;

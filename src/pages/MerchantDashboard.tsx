import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Image, Eye, CheckCircle, Clock, X, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { uploadAdImage, createAd, fetchMyAds } from "@/lib/adminApi";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_location: string;
  duration_days: number;
  status: string;
  created_at: string;
}

const MerchantDashboard = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  // Fetch user's existing ads via server endpoint
  useEffect(() => {
    if (!user) return;
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
  }, [user, submitted, getToken]);

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
        title: adTitle,
        description: adDescription,
        imageUrl,
        targetLocation,
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
    setDurationDays(7);
    setSubmitted(false);
  };

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Logo />
            <Link
              to="/merchant"
              className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portal
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 px-4 md:px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12 animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Advertisement Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Create and manage your advertisements for UniEasy
            </p>
          </div>

          {submitted ? (
            /* Success State */
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
            /* Upload Form */
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
                      <p className="text-foreground font-medium mb-2">
                        Drop your image here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse
                      </p>
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
              </div>

              {/* Details Section */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 animate-fade-up stagger-1">
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6">
                  Advertisement Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Ad Title
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 50% Off on All Pizzas!"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Brief description of your offer..."
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      className="w-full min-h-20 md:min-h-24 px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Target Location
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Near VIT University, Vellore"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Duration
                    </label>
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

          {/* Tips Section */}
          {!submitted && (
            <div className="mt-8 md:mt-12 bg-muted/30 rounded-2xl p-6 md:p-8 animate-fade-up stagger-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Tips for Effective Advertisements
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
                <div className="group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all">
                    <Eye className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">Clear Visuals</h4>
                  <p className="text-sm text-muted-foreground">
                    Use high-quality images that clearly show your product or offer.
                  </p>
                </div>
                <div className="group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all">
                    <CheckCircle className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">Strong CTA</h4>
                  <p className="text-sm text-muted-foreground">
                    Include a clear call-to-action like "Visit Now" or "Order Today".
                  </p>
                </div>
                <div className="group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all">
                    <Clock className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">Limited Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Create urgency with time-limited offers to drive action.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* My Ads Section */}
          <div className="mt-8 md:mt-12 animate-fade-up stagger-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">My Advertisements</h3>
            {loadingAds ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : myAds.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No advertisements yet. Create your first one above!
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myAds.map((ad) => (
                  <div key={ad.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    {ad.image_url && (
                      <img src={ad.image_url} alt={ad.title} className="w-full h-36 object-cover" />
                    )}
                    <div className="p-4">
                      <h4 className="font-medium text-foreground mb-1">{ad.title}</h4>
                      {ad.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ad.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          ad.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {ad.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{ad.duration_days} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantDashboard;

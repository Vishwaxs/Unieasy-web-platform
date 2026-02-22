import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";

interface PendingAd {
  id: string;
  clerk_user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_location: string | null;
  duration_days: number;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPendingAds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/ads/pending");
      setAds(data);
    } catch (err: any) {
      console.error("[AdminDashboard] Error fetching ads:", err);
      toast.error("Failed to load pending ads: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPendingAds();
  }, [fetchPendingAds]);

  const handleApprove = async (adId: string) => {
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}/approve`, { method: "POST" });
      toast.success("Ad approved successfully");
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (err: any) {
      toast.error("Failed to approve: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (adId: string) => {
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason }),
      });
      toast.success("Ad rejected");
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error("Failed to reject: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Logo />
            <Link
              to="/home"
              className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 px-4 md:px-6">
        <div className="container max-w-5xl mx-auto">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Review and manage pending advertisements
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingAds}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty */}
          {!loading && ads.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  All caught up!
                </h2>
                <p className="text-muted-foreground">
                  No pending ads to review at the moment.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ad List */}
          {!loading && ads.length > 0 && (
            <div className="space-y-4">
              {ads.map((ad) => (
                <Card key={ad.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-56 h-40 md:h-auto bg-muted flex-shrink-0">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">
                            {ad.title}
                          </h3>
                          {ad.description && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {ad.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 flex-shrink-0 ml-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {ad.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <span>
                          Merchant: <code className="text-xs">{ad.clerk_user_id}</code>
                        </span>
                        {ad.target_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ad.target_location}
                          </span>
                        )}
                        <span>{ad.duration_days} days</span>
                        <span>
                          {new Date(ad.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions */}
                      {rejectingId === ad.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)..."
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(ad.id)}
                              disabled={actionLoading === ad.id}
                            >
                              {actionLoading === ad.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Confirm Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(ad.id)}
                            disabled={actionLoading === ad.id}
                            className="gap-1"
                          >
                            {actionLoading === ad.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingId(ad.id)}
                            disabled={actionLoading === ad.id}
                            className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

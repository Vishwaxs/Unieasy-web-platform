import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Image as ImageIcon,
  MapPin,
  Flag,
  Trash2,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface MerchantRequest {
  id: string;
  clerk_user_id: string;
  business_name: string;
  business_type: string;
  contact_number: string | null;
  description: string | null;
  status: string;
  created_at: string;
  app_users?: { email: string; full_name: string | null };
}

interface ReviewRow {
  id: string;
  clerk_user_id: string;
  rating: number;
  body: string;
  status: string;
  verified_student: boolean;
  created_at: string;
  places?: { name: string; category: string };
}

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
  rating: number;
  rating_count: number;
  verified: boolean;
  data_source: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Pending Ads
// ═══════════════════════════════════════════════════════════════════════════════
const PendingAdsTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/ads/pending");
      setAds(data);
    } catch (err: any) {
      toast.error("Failed to load pending ads: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleApprove = async (adId: string) => {
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}/approve`, { method: "POST" });
      toast.success("Ad approved");
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
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
      setAds((prev) => prev.filter((a) => a.id !== adId));
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (ads.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">All caught up!</h2>
          <p className="text-muted-foreground">No pending ads to review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <Card key={ad.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-56 h-40 md:h-auto bg-muted flex-shrink-0">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{ad.title}</h3>
                  {ad.description && <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{ad.description}</p>}
                </div>
                <Badge variant="outline" className="flex-shrink-0 ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {ad.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span>Merchant: <code className="text-xs">{ad.clerk_user_id.slice(0, 12)}...</code></span>
                {ad.target_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ad.target_location}</span>}
                <span>{ad.duration_days} days</span>
                <span>{new Date(ad.created_at).toLocaleDateString()}</span>
              </div>
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
                    <Button size="sm" variant="destructive" onClick={() => handleReject(ad.id)} disabled={actionLoading === ad.id}>
                      {actionLoading === ad.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(ad.id)} disabled={actionLoading === ad.id} className="gap-1">
                    {actionLoading === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(ad.id)} disabled={actionLoading === ad.id} className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground">
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
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Merchant Upgrade Requests
// ═══════════════════════════════════════════════════════════════════════════════
const MerchantRequestsTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [requests, setRequests] = useState<MerchantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/merchant-requests");
      setRequests(data);
    } catch (err: any) {
      toast.error("Failed to load merchant requests: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminFetch(getToken, `/merchant-requests/${id}/approve`, { method: "POST" });
      toast.success("Merchant approved");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminFetch(getToken, `/merchant-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason }),
      });
      toast.success("Request rejected");
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const pending = requests.filter((r) => r.status === "pending");

  if (pending.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No pending requests</h2>
          <p className="text-muted-foreground">All merchant upgrade requests have been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((req) => (
        <Card key={req.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{req.business_name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {req.app_users?.email || req.clerk_user_id.slice(0, 12) + "..."}
                  {req.app_users?.full_name && ` (${req.app_users.full_name})`}
                </p>
              </div>
              <Badge variant="outline">{req.business_type}</Badge>
            </div>
            {req.description && <p className="text-sm text-muted-foreground mb-3">{req.description}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
              {req.contact_number && <span>Phone: {req.contact_number}</span>}
              <span>{new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            {rejectingId === req.id ? (
              <div className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={actionLoading === req.id}>
                    {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                    Confirm Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id} className="gap-1">
                  {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectingId(req.id)} disabled={actionLoading === req.id} className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Review Moderation
// ═══════════════════════════════════════════════════════════════════════════════
const ReviewModerationTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("active");
  const limit = 20;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = `?page=${page}&limit=${limit}&status=${statusFilter}`;
      const result = await adminFetch(getToken, `/reviews${params}`);
      setReviews(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      toast.error("Failed to load reviews: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, statusFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleFlag = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminFetch(getToken, `/reviews/${reviewId}/flag`, { method: "PATCH" });
      toast.success("Review flagged");
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, status: "flagged" } : r));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminFetch(getToken, `/reviews/${reviewId}`, { method: "DELETE" });
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {["active", "flagged", "deleted_by_admin"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="capitalize"
          >
            {s.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No reviews found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{review.places?.name || "Unknown Place"}</span>
                        <Badge variant="outline" className="text-xs">{review.places?.category}</Badge>
                        {review.verified_student && <Badge className="bg-green-500 text-white border-0 text-xs">Verified</Badge>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={review.status === "flagged" ? "border-amber-500 text-amber-500" : review.status === "active" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}
                    >
                      {review.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{review.body}</p>
                  <div className="flex gap-2">
                    {review.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => handleFlag(review.id)} disabled={actionLoading === review.id} className="gap-1">
                        <Flag className="w-3 h-3" /> Flag
                      </Button>
                    )}
                    {review.status !== "deleted_by_admin" && (
                      <Button size="sm" variant="outline" onClick={() => handleDelete(review.id)} disabled={actionLoading === review.id} className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Content Management (Places CRUD)
// ═══════════════════════════════════════════════════════════════════════════════
const ContentManagementTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const limit = 20;

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      let params = `?page=${page}&limit=${limit}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      const result = await adminFetch(getToken, `/places${params}`);
      setPlaces(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      toast.error("Failed to load places: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleEdit = (place: PlaceRow) => {
    setEditingId(place.id);
    setEditValues({ name: place.name, category: place.category, sub_type: place.sub_type || "" });
  };

  const handleSaveEdit = async (placeId: string) => {
    setActionLoading(placeId);
    try {
      await adminFetch(getToken, `/places/${placeId}`, {
        method: "PATCH",
        body: JSON.stringify(editValues),
      });
      toast.success("Place updated");
      setEditingId(null);
      fetchPlaces();
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerified = async (placeId: string, currentVerified: boolean) => {
    setActionLoading(placeId);
    try {
      await adminFetch(getToken, `/places/${placeId}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: !currentVerified }),
      });
      toast.success(currentVerified ? "Verification removed" : "Place verified");
      setPlaces((prev) => prev.map((p) => p.id === placeId ? { ...p, verified: !currentVerified } : p));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    setActionLoading(placeId);
    try {
      await adminFetch(getToken, `/places/${placeId}`, { method: "DELETE" });
      toast.success("Place deleted");
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search places by name..."
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No places found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {places.map((place) => (
              <Card key={place.id}>
                <CardContent className="py-4">
                  {editingId === place.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editValues.name || ""}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        placeholder="Name"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={editValues.category || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, category: e.target.value }))}
                          placeholder="Category"
                        />
                        <Input
                          value={editValues.sub_type || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, sub_type: e.target.value }))}
                          placeholder="Sub-type"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(place.id)} disabled={actionLoading === place.id}>
                          {actionLoading === place.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-sm truncate">{place.name}</span>
                          <Badge variant="outline" className="text-xs">{place.category}</Badge>
                          {place.sub_type && <Badge variant="secondary" className="text-xs">{place.sub_type}</Badge>}
                          {place.verified && <Badge className="bg-green-500 text-white text-xs border-0">Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{place.rating} ({place.rating_count})</span>
                          <span>{place.data_source}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(place)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleVerified(place.id, place.verified)}
                          disabled={actionLoading === place.id}
                          title={place.verified ? "Remove verification" : "Verify"}
                        >
                          <CheckCircle className={`w-4 h-4 ${place.verified ? "text-green-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlace(place.id)}
                          disabled={actionLoading === place.id}
                          title="Delete"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { getToken } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Logo />
            <Link to="/home" className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pt-16 md:pt-20 pb-8 md:pb-12 px-4 md:px-6">
        <div className="container max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage ads, merchants, reviews, and content</p>
          </div>

          <Tabs defaultValue="ads" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ads">Pending Ads</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="ads">
              <PendingAdsTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="merchants">
              <MerchantRequestsTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewModerationTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="content">
              <ContentManagementTab getToken={getToken} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

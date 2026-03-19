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
  ArrowLeft,
  Eye,
  Pause,
  Play,
  Users,
  ShieldAlert,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ad {
  id: string;
  clerk_user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_location: string | null;
  link_url: string | null;
  duration_days: number;
  status: string;
  impressions?: number;
  clicks?: number;
  created_at: string;
  expires_at?: string | null;
  app_users?: { full_name: string | null; email: string };
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

interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_active_at: string | null;
  is_suspended: boolean;
}

interface Review {
  id: string;
  clerk_user_id: string;
  rating: number;
  body: string;
  status: string;
  verified_student: boolean;
  created_at: string;
  updated_at: string;
  places?: { name: string; category: string };
  app_users?: { full_name: string | null; email: string };
}

interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

type GetTokenFn = () => Promise<string | null>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Pending Ads
// ═══════════════════════════════════════════════════════════════════════════════
const PendingAdsTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [imageModal, setImageModal] = useState<{ url: string; title: string } | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/ads/pending");
      setAds(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load pending ads: " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <>
      <div className="space-y-4">
        {ads.map((ad) => (
          <Card key={ad.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div
                className="w-full md:w-56 h-40 md:h-auto bg-muted flex-shrink-0 cursor-pointer relative group"
                onClick={() => ad.image_url && setImageModal({ url: ad.image_url, title: ad.title })}
              >
                {ad.image_url ? (
                  <>
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </>
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
                    {ad.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{ad.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 ml-2 border-amber-500 text-amber-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {ad.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span>
                    Merchant: <span className="text-foreground">{ad.app_users?.full_name || ad.app_users?.email || ad.clerk_user_id.slice(0, 12) + "..."}</span>
                  </span>
                  {ad.target_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ad.target_location}
                    </span>
                  )}
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
                      <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(ad.id)} disabled={actionLoading === ad.id} className="gap-1">
                      {actionLoading === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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

      {/* Image Modal */}
      <Dialog open={!!imageModal} onOpenChange={() => setImageModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imageModal?.title}</DialogTitle>
          </DialogHeader>
          {imageModal && (
            <img src={imageModal.url} alt={imageModal.title} className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — All Ads
// ═══════════════════════════════════════════════════════════════════════════════
const AllAdsTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params = `?page=${page}&limit=${limit}&status=${statusFilter}`;
      const result = await adminFetch(getToken, `/ads${params}`);
      setAds(result.data || []);
      setTotal(result.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load ads: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, statusFilter]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handlePause = async (adId: string) => {
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}/pause`, { method: "POST" });
      toast.success("Ad paused");
      setAds((prev) => prev.map((a) => a.id === adId ? { ...a, status: "paused" } : a));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (adId: string) => {
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}/resume`, { method: "POST" });
      toast.success("Ad resumed");
      setAds((prev) => prev.map((a) => a.id === adId ? { ...a, status: "active" } : a));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this ad? This cannot be undone.")) return;
    setActionLoading(adId);
    try {
      await adminFetch(getToken, `/ads/${adId}`, { method: "DELETE" });
      toast.success("Ad deleted");
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/30",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      rejected: "bg-red-500/10 text-red-500 border-red-500/30",
      expired: "bg-gray-500/10 text-gray-500 border-gray-500/30",
      paused: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    };
    return <Badge variant="outline" className={styles[status] || ""}>{status}</Badge>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "active", "rejected", "expired", "paused"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No ads found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Merchant</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Impressions</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Clicks</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Expires</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{ad.title}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {ad.app_users?.full_name || ad.app_users?.email || "-"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ad.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{ad.impressions ?? 0}</td>
                    <td className="py-3 px-4 text-muted-foreground">{ad.clicks ?? 0}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {ad.expires_at ? new Date(ad.expires_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ad.status === "active" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePause(ad.id)}
                            disabled={actionLoading === ad.id}
                            title="Pause"
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {ad.status === "paused" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResume(ad.id)}
                            disabled={actionLoading === ad.id}
                            title="Resume"
                            className="text-green-500 hover:bg-green-500/10"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(ad.id)}
                          disabled={actionLoading === ad.id}
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
// Tab 3 — Merchant Requests
// ═══════════════════════════════════════════════════════════════════════════════
const MerchantRequestsTab = ({ getToken }: { getToken: GetTokenFn }) => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load merchant requests: " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applicant</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Business Name</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((req) => (
            <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-3 px-4 font-medium text-foreground">
                {req.app_users?.full_name || "-"}
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {req.app_users?.email || "-"}
              </td>
              <td className="py-3 px-4 text-foreground">{req.business_name}</td>
              <td className="py-3 px-4">
                <Badge variant="outline">{req.business_type}</Badge>
              </td>
              <td className="py-3 px-4 text-muted-foreground">{req.contact_number || "-"}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                {rejectingId === req.id ? (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="text-xs"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={actionLoading === req.id}>
                        {actionLoading === req.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id} className="gap-1">
                      {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(req.id)}
                      disabled={actionLoading === req.id}
                      className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <XCircle className="w-3 h-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Users
// ═══════════════════════════════════════════════════════════════════════════════
const UsersTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let params = `?page=${page}&limit=${limit}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      const result = await adminFetch(getToken, `/users${params}`);
      setUsers(result.data || []);
      setTotal(result.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load users: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSuspend = async (clerkId: string, isSuspended: boolean) => {
    setActionLoading(clerkId);
    try {
      const endpoint = isSuspended ? `/users/${clerkId}/unsuspend` : `/users/${clerkId}/suspend`;
      await adminFetch(getToken, endpoint, { method: "POST" });
      toast.success(isSuspended ? "User unsuspended" : "User suspended");
      setUsers((prev) => prev.map((u) => u.clerk_user_id === clerkId ? { ...u, is_suspended: !isSuspended } : u));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (clerkId: string, newRole: string) => {
    setActionLoading(clerkId);
    try {
      await adminFetch(getToken, `/users/${clerkId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`Role changed to ${newRole}`);
      setUsers((prev) => prev.map((u) => u.clerk_user_id === clerkId ? { ...u, role: newRole } : u));
      setRoleChanging(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      student: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      merchant: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      admin: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      superadmin: "bg-red-500/10 text-red-500 border-red-500/30",
    };
    return <Badge variant="outline" className={styles[role] || ""}>{role}</Badge>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Active</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">
                      {user.full_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      {roleChanging === user.clerk_user_id ? (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleRoleChange(user.clerk_user_id, value)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
                            <SelectItem value="merchant">merchant</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => setRoleChanging(user.clerk_user_id)}
                          title="Click to change role"
                        >
                          {getRoleBadge(user.role)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_suspended ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSuspend(user.clerk_user_id, user.is_suspended)}
                        disabled={actionLoading === user.clerk_user_id}
                        className={user.is_suspended ? "text-green-500 hover:bg-green-500/10" : "text-destructive hover:bg-destructive/10"}
                      >
                        {actionLoading === user.clerk_user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.is_suspended ? (
                          <><ShieldCheck className="w-4 h-4 mr-1" /> Unsuspend</>
                        ) : (
                          <><ShieldAlert className="w-4 h-4 mr-1" /> Suspend</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
// Tab 5 — Reviews Moderation
// ═══════════════════════════════════════════════════════════════════════════════
const ReviewsModerationTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/reviews/flagged");
      setReviews(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load flagged reviews: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminFetch(getToken, `/reviews/${reviewId}/approve`, { method: "POST" });
      toast.success("Review approved");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminFetch(getToken, `/reviews/${reviewId}/delete`, { method: "POST" });
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No flagged reviews</h2>
          <p className="text-muted-foreground">All reviews are looking good!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{review.places?.name || "Unknown Place"}</span>
                  <Badge variant="outline" className="text-xs">{review.places?.category}</Badge>
                  <Badge variant="outline" className="border-amber-500 text-amber-500">
                    <Flag className="w-3 h-3 mr-1" />
                    Flagged
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>by {review.app_users?.full_name || review.app_users?.email || "Unknown"}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <span>•</span>
                  <span>{new Date(review.updated_at || review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 bg-muted/50 p-3 rounded-lg">
              "{review.body}"
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove(review.id)} disabled={actionLoading === review.id} className="gap-1">
                {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Keep Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(review.id)}
                disabled={actionLoading === review.id}
                className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 6 — Audit Logs
// ═══════════════════════════════════════════════════════════════════════════════
const AuditLogsTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("__all__");
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      let params = `?page=${currentPage}&limit=${limit}`;
      if (actionFilter && actionFilter !== "__all__") params += `&action=${encodeURIComponent(actionFilter)}`;
      const result = await adminFetch(getToken, `/audit-logs${params}`);

      if (reset) {
        setLogs(result.data || []);
        setPage(1);
      } else {
        setLogs((prev) => [...prev, ...(result.data || [])]);
      }
      setTotal(result.total || 0);
      setHasMore((result.data?.length || 0) === limit);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load audit logs: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, actionFilter]);

  useEffect(() => { fetchLogs(true); }, [actionFilter, getToken]);

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchLogs(false);
  }, [page]);

  const actionTypes = [
    "__all__",
    "approve_ad",
    "reject_ad",
    "pause_ad",
    "delete_ad",
    "approve_merchant",
    "reject_merchant",
    "change_role",
    "suspend_user",
    "unsuspend_user",
    "flag_review",
    "approve_review",
    "delete_review",
  ];

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      approve: "bg-green-500/10 text-green-500",
      reject: "bg-red-500/10 text-red-500",
      delete: "bg-red-500/10 text-red-500",
      suspend: "bg-amber-500/10 text-amber-500",
      unsuspend: "bg-green-500/10 text-green-500",
      pause: "bg-blue-500/10 text-blue-500",
      flag: "bg-amber-500/10 text-amber-500",
      change: "bg-purple-500/10 text-purple-500",
    };
    const prefix = action.split("_")[0];
    return (
      <Badge variant="outline" className={colors[prefix] || ""}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((action) => (
              <SelectItem key={action || "all"} value={action}>
                {action === "__all__" ? "All actions" : action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{total} total entries</span>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No audit logs found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Target</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.actor_id.slice(0, 12)}...</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{log.actor_role}</Badge>
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="text-xs">{log.target_type}:</span>{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.target_id.slice(0, 12)}...</code>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {Object.keys(log.details || {}).length > 0 ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {JSON.stringify(log.details).slice(0, 50)}...
                        </code>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Load More
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
            <Link
              to="/home"
              className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pt-8 md:pt-12 pb-8 md:pb-12 px-4 md:px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage ads, merchants, users, reviews, and view audit logs
            </p>
          </div>

          <Tabs defaultValue="pending-ads" className="space-y-6">
            <TabsList className="flex flex-nowrap overflow-x-auto h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="pending-ads" className="flex-1 min-w-[100px]">
                Pending Ads
              </TabsTrigger>
              <TabsTrigger value="all-ads" className="flex-1 min-w-[100px]">
                All Ads
              </TabsTrigger>
              <TabsTrigger value="merchants" className="flex-1 min-w-[100px]">
                Merchant Requests
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 min-w-[100px]">
                Users
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 min-w-[100px]">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex-1 min-w-[100px]">
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending-ads">
              <PendingAdsTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="all-ads">
              <AllAdsTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="merchants">
              <MerchantRequestsTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewsModerationTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="audit">
              <AuditLogsTab getToken={getToken} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

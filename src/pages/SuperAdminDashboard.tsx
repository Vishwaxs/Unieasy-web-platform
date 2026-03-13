import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  ShoppingBag,
  GraduationCap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Ban,
  CheckCircle,
  MapPin,
  Star as StarIcon,
  MessageSquare,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { adminFetch } from "@/lib/adminApi";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_suspended: boolean;
  last_active_at: string | null;
  created_at: string;
}

interface OverviewStats {
  totalUsers: number;
  students: number;
  merchants: number;
  admins: number;
  totalPlaces: number;
  totalReviews: number;
  activeAds: number;
  signupsToday: number;
  reviewsToday: number;
}

interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

const ROLE_OPTIONS = ["student", "merchant", "admin", "superadmin"] as const;

const roleConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  student: { icon: GraduationCap, color: "text-blue-500", label: "Student" },
  merchant: { icon: ShoppingBag, color: "text-green-500", label: "Merchant" },
  admin: { icon: Shield, color: "text-orange-500", label: "Admin" },
  superadmin: { icon: ShieldCheck, color: "text-red-500", label: "Super Admin" },
};

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Overview (Real-Time Counters)
// ═══════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminFetch(getToken, "/analytics/overview");
      setStats(data);
    } catch (err: any) {
      toast.error("Failed to load overview: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Real-time subscription to auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel("superadmin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_users" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!stats) return null;

  const counters = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Students", value: stats.students, icon: GraduationCap, color: "text-indigo-500" },
    { label: "Merchants", value: stats.merchants, icon: ShoppingBag, color: "text-green-500" },
    { label: "Admins", value: stats.admins, icon: Shield, color: "text-orange-500" },
    { label: "Places", value: stats.totalPlaces, icon: MapPin, color: "text-cyan-500" },
    { label: "Reviews", value: stats.totalReviews, icon: MessageSquare, color: "text-purple-500" },
    { label: "Active Ads", value: stats.activeAds, icon: Megaphone, color: "text-amber-500" },
    { label: "Signups Today", value: stats.signupsToday, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Reviews Today", value: stats.reviewsToday, icon: StarIcon, color: "text-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
      {counters.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-6 h-6 ${c.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Users
// ═══════════════════════════════════════════════════════════════════════════════
const UsersTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/users");
      setUsers(data);
    } catch (err: any) {
      toast.error("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (clerkUserId: string, newRole: string) => {
    setActionLoading(clerkUserId);
    setOpenDropdown(null);
    try {
      await adminFetch(getToken, "/users/role", {
        method: "POST",
        body: JSON.stringify({ clerkUserId, newRole }),
      });
      toast.success(`Role changed to ${newRole}`);
      setUsers((prev) => prev.map((u) => u.clerk_user_id === clerkUserId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (clerkUserId: string, suspend: boolean) => {
    setActionLoading(clerkUserId);
    try {
      await adminFetch(getToken, `/users/${clerkUserId}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ suspend }),
      });
      toast.success(suspend ? "User suspended" : "User unsuspended");
      setUsers((prev) => prev.map((u) => u.clerk_user_id === clerkUserId ? { ...u, is_suspended: suspend } : u));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openDropdown]);

  const filteredUsers = users
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (u.email?.toLowerCase().includes(s)) || (u.full_name?.toLowerCase().includes(s));
    });

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {["all", ...ROLE_OPTIONS].map((r) => (
            <Button key={r} size="sm" variant={roleFilter === r ? "default" : "outline"} onClick={() => setRoleFilter(r)} className="capitalize text-xs">
              {r === "all" ? "All" : roleConfig[r]?.label || r}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Email</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Joined</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Last Active</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const cfg = roleConfig[u.role] || roleConfig.student;
                const Icon = cfg.icon;
                return (
                  <tr key={u.clerk_user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">{u.full_name || "—"}</p>
                        {u.is_suspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground md:hidden">{u.email}</p>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={actionLoading === u.clerk_user_id}
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === u.clerk_user_id ? null : u.clerk_user_id); }}>
                            {actionLoading === u.clerk_user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ChevronDown className="w-3 h-3" /></>}
                          </Button>
                          {openDropdown === u.clerk_user_id && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                              {ROLE_OPTIONS.map((role) => {
                                const rCfg = roleConfig[role];
                                const RIcon = rCfg.icon;
                                return (
                                  <button key={role} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${u.role === role ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={u.role === role} onClick={() => handleRoleChange(u.clerk_user_id, role)}>
                                    <RIcon className={`w-4 h-4 ${rCfg.color}`} />{rCfg.label}
                                    {u.role === role && <span className="text-xs text-muted-foreground ml-auto">current</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" title={u.is_suspended ? "Unsuspend" : "Suspend"} disabled={actionLoading === u.clerk_user_id}
                          onClick={() => handleSuspend(u.clerk_user_id, !u.is_suspended)}
                          className={u.is_suspended ? "text-green-500 hover:bg-green-500/10" : "text-destructive hover:bg-destructive/10"}>
                          {u.is_suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground text-center">{filteredUsers.length} of {users.length} users shown</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Admins
// ═══════════════════════════════════════════════════════════════════════════════
const AdminsTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/users");
      setUsers(data.filter((u: AppUser) => u.role === "admin" || u.role === "superadmin"));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRevokeAdmin = async (clerkUserId: string) => {
    setActionLoading(clerkUserId);
    try {
      await adminFetch(getToken, "/users/role", {
        method: "POST",
        body: JSON.stringify({ clerkUserId, newRole: "student" }),
      });
      toast.success("Admin role revoked");
      setUsers((prev) => prev.filter((u) => u.clerk_user_id !== clerkUserId));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {users.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">No admin accounts found.</p></CardContent></Card>
      ) : users.map((u) => {
        const cfg = roleConfig[u.role] || roleConfig.admin;
        const Icon = cfg.icon;
        return (
          <Card key={u.clerk_user_id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{u.full_name || u.email}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
              </div>
              {u.role === "admin" && (
                <Button size="sm" variant="outline" onClick={() => handleRevokeAdmin(u.clerk_user_id)} disabled={actionLoading === u.clerk_user_id}
                  className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs">
                  {actionLoading === u.clerk_user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                  Revoke
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Merchants
// ═══════════════════════════════════════════════════════════════════════════════
const MerchantsTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/users");
      setUsers(data.filter((u: AppUser) => u.role === "merchant"));
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {users.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">No merchant accounts found.</p></CardContent></Card>
      ) : users.map((u) => (
        <Card key={u.clerk_user_id}>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-foreground text-sm">{u.full_name || u.email}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
              <p className="text-xs text-muted-foreground">Joined: {new Date(u.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500">Merchant</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 5 — Analytics (Charts)
// ═══════════════════════════════════════════════════════════════════════════════
const AnalyticsTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);
  const [reviewsByModule, setReviewsByModule] = useState<{ category: string; count: number }[]>([]);
  const [sentiment, setSentiment] = useState<{ sentiment: string; count: number }[]>([]);
  const [topLiked, setTopLiked] = useState<{ name: string; like_count: number }[]>([]);
  const [adsStatus, setAdsStatus] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ugRes, rbmRes, sentRes, tlRes, asRes] = await Promise.all([
          adminFetch(getToken, "/analytics/user-growth"),
          adminFetch(getToken, "/analytics/reviews-by-module"),
          adminFetch(getToken, "/analytics/sentiment"),
          adminFetch(getToken, "/analytics/top-liked"),
          adminFetch(getToken, "/analytics/ads-status"),
        ]);
        setUserGrowth(ugRes.data || []);
        setReviewsByModule(rbmRes.data || []);
        setSentiment(sentRes.data || []);
        setTopLiked(tlRes.data || []);
        setAdsStatus(asRes.data || []);
      } catch (err: any) {
        toast.error("Failed to load analytics: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [getToken]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm">User Growth (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Signups" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
        </CardContent>
      </Card>

      {/* Reviews by Module */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Reviews by Module</CardTitle></CardHeader>
        <CardContent>
          {reviewsByModule.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reviewsByModule}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No reviews yet</p>}
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Sentiment Distribution</CardTitle></CardHeader>
        <CardContent>
          {sentiment.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sentiment} dataKey="count" nameKey="sentiment" cx="50%" cy="50%" outerRadius={80} label={(entry: { sentiment: string }) => entry.sentiment}>
                  {sentiment.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No sentiment data yet</p>}
        </CardContent>
      </Card>

      {/* Top 10 Liked */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 Most Liked Places</CardTitle></CardHeader>
        <CardContent>
          {topLiked.length > 0 && topLiked.some(p => p.like_count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topLiked.filter(p => p.like_count > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="like_count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Likes" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No likes yet</p>}
        </CardContent>
      </Card>

      {/* Ads by Status */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ads by Status</CardTitle></CardHeader>
        <CardContent>
          {adsStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={adsStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label={(entry: { status: string; count: number }) => `${entry.status} (${entry.count})`}>
                  {adsStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No ads yet</p>}
        </CardContent>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 6 — Audit Log
// ═══════════════════════════════════════════════════════════════════════════════
const AuditLogTab = ({ getToken }: { getToken: () => Promise<string | null> }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminFetch(getToken, `/audit-logs?page=${page}&limit=${limit}`);
      setLogs(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      toast.error("Failed to load audit logs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">No audit log entries yet.</p></CardContent></Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Action</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Actor</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Target</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3"><Badge variant="outline" className="text-xs">{log.action}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                        <code>{log.actor_id?.slice(0, 12)}...</code>
                        <span className="ml-1 text-xs">({log.actor_role})</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                        {log.target_type}: <code>{log.target_id?.slice(0, 12)}...</code>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main SuperAdminDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
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
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-1"><Shield className="w-4 h-4" /><span className="hidden sm:inline">Admin Panel</span></Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 px-4 md:px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-red-500" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Full platform monitoring, analytics, and user management</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewTab getToken={getToken} /></TabsContent>
            <TabsContent value="users"><UsersTab getToken={getToken} /></TabsContent>
            <TabsContent value="admins"><AdminsTab getToken={getToken} /></TabsContent>
            <TabsContent value="merchants"><MerchantsTab getToken={getToken} /></TabsContent>
            <TabsContent value="analytics"><AnalyticsTab getToken={getToken} /></TabsContent>
            <TabsContent value="audit"><AuditLogTab getToken={getToken} /></TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Building2,
  ShieldCheck,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Loader2,
  Search,
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserMinus,
  UserPlus,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { superadminFetch, adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  total_users: number;
  students: number;
  merchants: number;
  admins: number;
  superadmins?: number;
  suspended_users: number;
  total_places: number;
  total_reviews: number;
  pending_ads: number;
  active_ads: number;
  new_users_7d: number;
  new_reviews_7d: number;
}

interface GrowthData {
  date: string;
  count: number;
}

interface Admin {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  role_updated_at: string | null;
  last_active_at: string | null;
  actions_count: number;
}

interface UserSearchResult {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
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

interface Place {
  id: string;
  google_place_id: string | null;
  name: string;
  category: string;
  address: string | null;
  is_featured: boolean;
  featured_order: number | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

type GetTokenFn = () => Promise<string | null>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Overview (Analytics)
// ═══════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, growthData] = await Promise.all([
        superadminFetch(getToken, "/stats"),
        superadminFetch(getToken, "/growth?days=30"),
      ]);
      setStats(statsData as Stats);
      setGrowth(growthData as GrowthData[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load stats: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between animate-pulse">
                  <div>
                    <div className="h-3 w-16 bg-muted rounded mb-2" />
                    <div className="h-7 w-12 bg-muted rounded" />
                  </div>
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500" },
    { label: "Students", value: stats.students, icon: Users, color: "text-cyan-500" },
    { label: "Merchants", value: stats.merchants, icon: Building2, color: "text-purple-500" },
    { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-amber-500" },
    { label: "Suspended", value: stats.suspended_users, icon: XCircle, color: "text-red-500" },
    { label: "Total Places", value: stats.total_places, icon: MapPin, color: "text-green-500" },
    { label: "Total Reviews", value: stats.total_reviews, icon: Star, color: "text-yellow-500" },
    { label: "Pending Ads", value: stats.pending_ads, icon: Clock, color: "text-orange-500" },
    { label: "Active Ads", value: stats.active_ads, icon: CheckCircle, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={stat.label} className="transition-all duration-500 ease-out" style={{ animationDelay: `${idx * 60}ms` }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums transition-all duration-300">{(stat.value ?? 0).toLocaleString()}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">New Users (7 days)</p>
                <p className="text-3xl font-bold text-foreground">{stats.new_users_7d}</p>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">New Reviews (7 days)</p>
                <p className="text-3xl font-bold text-foreground">{stats.new_reviews_7d}</p>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Growing</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Registrations (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — User Management (All Users with Role Changing)
// ═══════════════════════════════════════════════════════════════════════════════
interface AllUser {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  role_updated_at: string | null;
  last_active_at: string | null;
  is_suspended: boolean;
}

const ROLES = ["student", "merchant", "admin", "superadmin"] as const;

const AdminManagementTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [users, setUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let params = `?page=${page}&limit=${limit}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      const result = await adminFetch(getToken, `/users${params}`) as { data: AllUser[]; total: number };
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

  const handleRoleChange = async (clerkUserId: string, newRole: string) => {
    setActionLoading(clerkUserId);
    try {
      await adminFetch(getToken, `/users/${clerkUserId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`Role changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => u.clerk_user_id === clerkUserId ? { ...u, role: newRole } : u)
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = async (user: AllUser) => {
    setActionLoading(user.clerk_user_id);
    const action = user.is_suspended ? "unsuspend" : "suspend";
    try {
      await adminFetch(getToken, `/users/${user.clerk_user_id}/${action}`, {
        method: "POST",
      });
      toast.success(`User ${action}ed`);
      setUsers((prev) =>
        prev.map((u) => u.clerk_user_id === user.clerk_user_id ? { ...u, is_suspended: !u.is_suspended } : u)
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      student: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      merchant: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      admin: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      superadmin: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    };
    return styles[role] || "";
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Current Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Change Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">{user.full_name || "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getRoleBadgeStyle(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.clerk_user_id, newRole)}
                        disabled={actionLoading === user.clerk_user_id}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
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
                        onClick={() => handleSuspendToggle(user)}
                        disabled={actionLoading === user.clerk_user_id}
                        className={user.is_suspended
                          ? "text-green-500 hover:bg-green-500/10"
                          : "text-red-500 hover:bg-red-500/10"}
                      >
                        {actionLoading === user.clerk_user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.is_suspended ? (
                          <><UserPlus className="w-4 h-4 mr-1" /> Unsuspend</>
                        ) : (
                          <><UserMinus className="w-4 h-4 mr-1" /> Suspend</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
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
// Tab 3 — System (Full Audit Logs)
// ═══════════════════════════════════════════════════════════════════════════════
const SystemTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let params = `?page=${page}&limit=${limit}`;
      if (roleFilter && roleFilter !== "__all__") params += `&role=${roleFilter}`;
      if (actionFilter && actionFilter !== "__all__") params += `&action=${actionFilter}`;
      const result = await superadminFetch(getToken, `/audit-logs${params}`) as { data: AuditLog[]; total: number };
      setLogs(result.data || []);
      setTotal(result.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load audit logs: " + message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, roleFilter, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Timestamp", "Actor ID", "Actor Role", "Action", "Target Type", "Target ID", "Details"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.actor_id,
      log.actor_role,
      log.action,
      log.target_type,
      log.target_id,
      JSON.stringify(log.details),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const roles = ["__all__", "superadmin", "admin", "merchant", "student"];
  const actions = [
    "__all__",
    "approve_ad",
    "reject_ad",
    "pause_ad",
    "delete_ad",
    "approve_merchant",
    "reject_merchant",
    "change_role",
    "promote_to_admin",
    "demote_from_admin",
    "suspend_user",
    "unsuspend_user",
    "flag_review",
    "approve_review",
    "delete_review",
    "feature_place",
    "unfeature_place",
    "verify_place",
    "refresh_place",
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
      promote: "bg-emerald-500/10 text-emerald-500",
      demote: "bg-orange-500/10 text-orange-500",
      feature: "bg-cyan-500/10 text-cyan-500",
      unfeature: "bg-gray-500/10 text-gray-500",
      verify: "bg-blue-500/10 text-blue-500",
      refresh: "bg-teal-500/10 text-teal-500",
    };
    const prefix = action.split("_")[0];
    return (
      <Badge variant="outline" className={colors[prefix] || ""}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role === "__all__" ? "All roles" : role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {action === "__all__" ? "All actions" : action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">{total} total entries</span>

        <Button variant="outline" size="sm" onClick={exportToCSV} className="ml-auto gap-1">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
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
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
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
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
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
// Tab 4 — Places Management
// ═══════════════════════════════════════════════════════════════════════════════
const PlacesManagementTab = ({ getToken }: { getToken: GetTokenFn }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      let params = `?page=${page}&limit=${limit}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      const result = await superadminFetch(getToken, `/places${params}`) as { data: Place[]; total: number };
      setPlaces(result.data || []);
      setTotal(result.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load places: " + message);
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

  const toggleFeatured = async (placeId: string, currentFeatured: boolean, currentOrder: number | null) => {
    setActionLoading(placeId);
    try {
      const newFeatured = !currentFeatured;
      await superadminFetch(getToken, `/places/${placeId}/feature`, {
        method: "POST",
        body: JSON.stringify({
          is_featured: newFeatured,
          featured_order: newFeatured ? (currentOrder || 0) : null,
        }),
      });
      toast.success(newFeatured ? "Place featured" : "Place unfeatured");
      setPlaces((prev) =>
        prev.map((p) => (p.id === placeId ? { ...p, is_featured: newFeatured } : p))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVerified = async (placeId: string, currentVerified: boolean) => {
    setActionLoading(placeId);
    try {
      const newVerified = !currentVerified;
      await superadminFetch(getToken, `/places/${placeId}/verify`, {
        method: "POST",
        body: JSON.stringify({ verified: newVerified }),
      });
      toast.success(newVerified ? "Place verified" : "Place unverified");
      setPlaces((prev) =>
        prev.map((p) => (p.id === placeId ? { ...p, verified: newVerified } : p))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const refreshFromGoogle = async (placeId: string) => {
    setActionLoading(placeId);
    try {
      const result = await superadminFetch(getToken, `/places/${placeId}/refresh`, { method: "POST" }) as { place?: Place };
      toast.success("Place refreshed from Google");
      // Update the place in the list
      if (result.place) {
        setPlaces((prev) =>
          prev.map((p) => (p.id === placeId ? { ...p, ...result.place } : p))
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed: " + message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search places..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No places found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Featured</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Verified</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place) => (
                  <tr key={place.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{place.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{place.address}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{place.category}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={place.is_featured ? "default" : "outline"}
                        onClick={() => toggleFeatured(place.id, place.is_featured, place.featured_order)}
                        disabled={actionLoading === place.id}
                        className="gap-1"
                      >
                        {actionLoading === place.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Sparkles className="w-4 h-4" /> {place.is_featured ? "Yes" : "No"}</>
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-4">
                      {place.is_featured ? (
                        <Input
                          type="number"
                          value={place.featured_order || 0}
                          onChange={async (e) => {
                            const newOrder = parseInt(e.target.value) || 0;
                            setPlaces((prev) =>
                              prev.map((p) => (p.id === place.id ? { ...p, featured_order: newOrder } : p))
                            );
                            try {
                              await superadminFetch(getToken, `/places/${place.id}/feature`, {
                                method: "POST",
                                body: JSON.stringify({ is_featured: true, featured_order: newOrder }),
                              });
                            } catch {
                              // Silent fail, will be fixed on next fetch
                            }
                          }}
                          className="w-16 h-8 text-center"
                          min={0}
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={place.verified ? "default" : "outline"}
                        onClick={() => toggleVerified(place.id, place.verified)}
                        disabled={actionLoading === place.id}
                        className="gap-1"
                      >
                        {actionLoading === place.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><BadgeCheck className="w-4 h-4" /> {place.verified ? "Yes" : "No"}</>
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {place.google_place_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refreshFromGoogle(place.id)}
                          disabled={actionLoading === place.id}
                          className="gap-1"
                        >
                          {actionLoading === place.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <><RefreshCw className="w-4 h-4" /> Refresh</>
                          )}
                        </Button>
                      )}
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
            <Link
              to="/home"
              className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Super Admin
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-8 md:pt-12 pb-8 md:pb-12 px-4 md:px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Full platform control, analytics, and admin management
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex flex-nowrap overflow-x-auto h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="flex-1 min-w-[100px]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex-1 min-w-[100px]">
                Admin Management
              </TabsTrigger>
              <TabsTrigger value="system" className="flex-1 min-w-[100px]">
                System
              </TabsTrigger>
              <TabsTrigger value="places" className="flex-1 min-w-[100px]">
                Places
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="admins">
              <AdminManagementTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="system">
              <SystemTab getToken={getToken} />
            </TabsContent>
            <TabsContent value="places">
              <PlacesManagementTab getToken={getToken} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;

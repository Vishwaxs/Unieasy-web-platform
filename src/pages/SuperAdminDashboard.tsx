import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  ShoppingBag,
  GraduationCap,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface AppUser {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  role_updated_at: string | null;
}

const ROLE_OPTIONS = ["student", "merchant", "admin", "superadmin"] as const;

const roleConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  student: { icon: GraduationCap, color: "text-blue-500", label: "Student" },
  merchant: { icon: ShoppingBag, color: "text-green-500", label: "Merchant" },
  admin: { icon: Shield, color: "text-orange-500", label: "Admin" },
  superadmin: { icon: ShieldCheck, color: "text-red-500", label: "Super Admin" },
};

async function adminFetch(
  getToken: () => Promise<string | null>,
  path: string,
  options: RequestInit = {}
) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

const SuperAdminDashboard = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(getToken, "/users");
      setUsers(data);
    } catch (err: any) {
      console.error("[SuperAdminDashboard] Error fetching users:", err);
      toast.error("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (clerkUserId: string, newRole: string) => {
    setActionLoading(clerkUserId);
    setOpenDropdown(null);
    try {
      await adminFetch(getToken, "/users/role", {
        method: "POST",
        body: JSON.stringify({ clerkUserId, newRole }),
      });
      toast.success(`Role changed to ${newRole}. Ask the user to reload their app to pick up the change.`);
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.clerk_user_id === clerkUserId ? { ...u, role: newRole } : u
        )
      );
    } catch (err: any) {
      toast.error("Failed to change role: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openDropdown]);

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
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 px-4 md:px-6">
        <div className="container max-w-5xl mx-auto">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-red-500" />
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage user roles and platform access
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          {!loading && users.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {ROLE_OPTIONS.map((role) => {
                const count = users.filter((u) => u.role === role).length;
                const cfg = roleConfig[role];
                const Icon = cfg.icon;
                return (
                  <Card key={role}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <div>
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{cfg.label}s</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty */}
          {!loading && users.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found.</p>
              </CardContent>
            </Card>
          )}

          {/* User Table */}
          {!loading && users.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-3 text-xs font-medium text-muted-foreground uppercase">
                        User
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">
                        Email
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground uppercase">
                        Role
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
                        Joined
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const cfg = roleConfig[u.role] || roleConfig.student;
                      const Icon = cfg.icon;
                      return (
                        <tr
                          key={u.clerk_user_id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3">
                            <p className="font-medium text-foreground text-sm">
                              {u.full_name || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {u.email}
                            </p>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                            {u.email}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs"
                                disabled={actionLoading === u.clerk_user_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(
                                    openDropdown === u.clerk_user_id
                                      ? null
                                      : u.clerk_user_id
                                  );
                                }}
                              >
                                {actionLoading === u.clerk_user_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    Change Role
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </Button>

                              {openDropdown === u.clerk_user_id && (
                                <div
                                  className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {ROLE_OPTIONS.map((role) => {
                                    const rCfg = roleConfig[role];
                                    const RIcon = rCfg.icon;
                                    return (
                                      <button
                                        key={role}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                                          u.role === role
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                        disabled={u.role === role}
                                        onClick={() =>
                                          handleRoleChange(u.clerk_user_id, role)
                                        }
                                      >
                                        <RIcon className={`w-4 h-4 ${rCfg.color}`} />
                                        {rCfg.label}
                                        {u.role === role && (
                                          <span className="text-xs text-muted-foreground ml-auto">
                                            current
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> When you change a user's role, they need to
              refresh their app to pick up the new permissions. The role is
              fetched on sign-in and cached client-side.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;

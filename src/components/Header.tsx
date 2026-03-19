import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Menu,
  X,
  Home,
  Mail,
  FileText,
  Shield,
  LogIn,
  Bell,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/adminApi";

// ── Notification type ─────────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Relative time helper ──────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Notification Bell Dropdown ────────────────────────────────────────────────
function NotificationBell() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications(() => getToken(), 5, false);
      setNotifications(res.data || []);
      setUnreadCount(res.unread || 0);
    } catch {
      // silent fail — user may not be fully authed yet
    }
  }, [getToken]);

  // Poll every 30 seconds + initial load
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(() => getToken(), notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* silent */
      }
    }
    setOpen(false);
    if (notif.link) {
      const link = notif.link.startsWith("/place/") ? "/admin" : notif.link;
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(() => getToken());
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  return (
    <div className="relative z-[140]" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full bg-background/60 backdrop-blur-md border-border/60 hover:bg-accent/15 w-10 h-10 transition-all duration-300"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        id="notification-bell"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tabular-nums">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-[160] w-80 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-accent/10 transition-colors border-b border-border/20 last:border-b-0 ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  <div className="pt-1.5 shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        !notif.is_read ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-tight ${!notif.is_read ? "font-semibold" : "font-medium"} text-foreground truncate`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // Show back on every page except the root landing page
  const showBack = location.pathname !== "/";

  // Category listing pages — back should land on home at the category section
  const CATEGORY_PATHS = new Set([
    "/food",
    "/accommodation",
    "/explore",
    "/study",
    "/essentials",
    "/campus",
  ]);

  const handleBack = () => {
    if (CATEGORY_PATHS.has(location.pathname)) {
      navigate("/home", { state: { scrollTo: "category-cards" } });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/home");
  };

  const navLinks = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/contact", label: "Contact", icon: Mail },
    { to: "/terms", label: "Terms", icon: FileText },
    { to: "/privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[120]">
      {/* Mirror glass header */}
      <div className="mirror-header-shell">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mirror-header-overlay" />
          <div className="mirror-header-sheen" />
        </div>
        <div className="relative w-full px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            <SignedIn>
              <NotificationBell />
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Profile"
                    labelIcon={<User className="w-4 h-4" />}
                    href="/profile"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-background/60 backdrop-blur-md border-border/60 hover:bg-accent/15 gap-2 transition-all duration-300"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />

            <SignedIn>
              <NotificationBell />
            </SignedIn>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full w-10 h-10 border border-border/60 bg-background/70 backdrop-blur-md shadow-sm hover:bg-accent/20 hover:shadow-md"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-2 bg-background/90 backdrop-blur-xl border-t border-border/60">
            <SignedIn>
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/15 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Profile</span>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/15 transition-colors w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Sign in</span>
                </button>
              </SignInButton>
            </SignedOut>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/15 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

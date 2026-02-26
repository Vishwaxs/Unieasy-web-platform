import { useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useRoleRefresh } from "@/hooks/useRoleRefresh";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional list of allowed roles. If omitted, any signed-in user is allowed. */
  allowed?: string[];
}

/**
 * Wraps a route so only signed-in Clerk users can access it.
 * If `allowed` is specified, the user's role (from app_users) must be in that list.
 * While Clerk is still loading, renders a spinner.
 * If not signed in, redirects to `/signin`.
 * If role not in `allowed`, shows "Access denied".
 */
const ProtectedRoute = ({ children, allowed }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();
  const role = useUserRole();

  // Auto-refresh role on window focus so admin role changes take effect
  useRoleRefresh((newRole) => {
    if (newRole !== role) {
      window.location.reload();
    }
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/signin" replace />;
  }

  // If role-based protection is requested, wait for role to load
  if (allowed && allowed.length > 0) {
    if (role === null) {
      // Still loading role
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!allowed.includes(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to view this page.
            </p>
            <Link to="/home" className="text-primary hover:underline">
              Go to Home
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

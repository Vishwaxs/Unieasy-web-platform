import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface MerchantRouteProps {
  children: React.ReactNode;
}

/**
 * Protects merchant-only routes.
 * Requires signed-in Clerk user with role === "merchant".
 * Redirects to /merchant if not a merchant, or / if not signed in.
 */
const MerchantRoute = ({ children }: MerchantRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();
  const role = useUserRole();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // While role is still loading (null), show spinner
  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (role !== "merchant") {
    return <Navigate to="/merchant" replace />;
  }

  return <>{children}</>;
};

export default MerchantRoute;

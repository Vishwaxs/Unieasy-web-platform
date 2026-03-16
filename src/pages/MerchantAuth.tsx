import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useClerk, useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { apiFetch } from "@/lib/adminApi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const MerchantAuth = () => {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const role = useUserRole();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);

  // If user is already a merchant, redirect to dashboard
  useEffect(() => {
    if (isSignedIn && role === "merchant") {
      navigate("/merchant/dashboard", { replace: true });
    }
  }, [isSignedIn, role, navigate]);

  if (isSignedIn && role === "merchant") {
    return null;
  }

  const handleRequestMerchant = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      await apiFetch(getToken, "/merchant/upgrade", { method: "POST" });
      toast.success("You're now a merchant! Redirecting to dashboard...");
      // Small delay so the toast is visible
      setTimeout(() => navigate("/merchant/dashboard"), 1200);
    } catch (err: any) {
      toast.error("Failed to upgrade to merchant: " + err.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 pt-16 md:pt-20 pb-8 md:pb-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Icon */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-4">
              <Store className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Merchant Portal
            </h1>
          </div>

          <SignedOut>
            {/* Not signed in — prompt to sign in first */}
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                Sign in to your UniEasy account to access the Merchant Portal.
              </p>
              <SignInButton mode="modal">
                <Button size="lg" className="w-full">
                  Sign in to continue
                </Button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {/* Signed in but not a merchant yet */}
            {role === null ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : role !== "merchant" ? (
              <div className="text-center space-y-6">
                <p className="text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{user?.fullName}</span>!
                  Your current role is <span className="font-medium text-foreground capitalize">{role}</span>.
                </p>
                <p className="text-muted-foreground text-sm">
                  Upgrade to a merchant account to create and manage advertisements on UniEasy.
                </p>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRequestMerchant}
                  disabled={requesting}
                >
                  {requesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    "Become a Merchant"
                  )}
                </Button>

                {/* Benefits */}
                <div className="mt-6 md:mt-8 p-4 bg-muted/50 rounded-xl text-left">
                  <p className="text-sm font-medium text-foreground mb-2">Why advertise with UniEasy?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Reach thousands of university students</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Targeted advertising near campuses</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Affordable and flexible pricing</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </SignedIn>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantAuth;

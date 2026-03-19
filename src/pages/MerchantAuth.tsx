import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  LogOut,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUser,
  useClerk,
  useAuth,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { apiFetch } from "@/lib/adminApi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Restaurant",
  "Cafe",
  "PG / Paying Guest",
  "Shop",
  "Service",
  "Other",
];

type RequestStatus = "none" | "pending" | "approved" | "rejected" | "loading";

const MerchantAuth = () => {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const role = useUserRole();
  const navigate = useNavigate();

  const [requestStatus, setRequestStatus] = useState<RequestStatus>("loading");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [description, setDescription] = useState("");

  // If user is already a merchant or just got approved, redirect to dashboard
  useEffect(() => {
    if (isSignedIn && (role === "merchant" || requestStatus === "approved")) {
      navigate("/merchant/dashboard", { replace: true });
    }
  }, [isSignedIn, role, requestStatus, navigate]);

  // Check existing request status
  useEffect(() => {
    if (!isSignedIn || !user || role === "merchant") return;

    const checkRequest = async () => {
      try {
        const data = (await apiFetch(
          getToken,
          "/merchant/upgrade-request/status",
        )) as { status?: string; review_note?: string };
        if (data.status) {
          setRequestStatus(data.status as RequestStatus);
          if (data.review_note) setReviewNote(data.review_note);
        } else {
          setRequestStatus("none");
        }
      } catch {
        setRequestStatus("none");
      }
    };

    checkRequest();
  }, [isSignedIn, user, role, getToken]);

  if (isSignedIn && role === "merchant") {
    return null;
  }

  // Validation helpers
  const nameValid = businessName.trim().length >= 2;
  const typeValid = businessType.length > 0;
  const phoneClean = contactNumber.replace(/[\s\-]/g, "");
  const phoneValid = /^\+?\d{10,15}$/.test(phoneClean);
  const descValid = description.trim().length >= 10;
  const allValid = nameValid && typeValid && phoneValid && descValid;

  // Track which fields the user has touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmitRequest = async () => {
    // Mark all as touched to show errors
    setTouched({ name: true, type: true, phone: true, desc: true });
    if (!allValid) {
      if (!nameValid) toast.error("Business name must be at least 2 characters");
      else if (!typeValid) toast.error("Please select a business type");
      else if (!phoneValid) toast.error("Enter a valid contact number (10-15 digits)");
      else if (!descValid) toast.error("Description must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(getToken, "/merchant/upgrade-request", {
        method: "POST",
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
          contactNumber: contactNumber.trim(),
          description: description.trim(),
        }),
      });
      toast.success(
        "Merchant upgrade request submitted! An admin will review it shortly.",
      );
      setRequestStatus("pending");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to submit request: " + message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 pt-24 md:pt-28 pb-8 md:pb-12">
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
            {role === null || requestStatus === "loading" ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : requestStatus === "pending" ? (
              /* Pending Request Banner */
              <div className="text-center space-y-6">
                <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                  <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Request Pending
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Your merchant upgrade request is being reviewed by an admin.
                    You'll be notified once it's approved.
                  </p>
                </div>
              </div>
            ) : requestStatus === "rejected" ? (
              /* Rejected Banner */
              <div className="text-center space-y-6">
                <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-2xl">
                  <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Request Rejected
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {reviewNote ||
                      "Your merchant upgrade request was not approved. You may submit a new request."}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setRequestStatus("none")}
                >
                  Submit New Request
                </Button>
              </div>
            ) : requestStatus === "approved" ? (
              /* Approved Banner */
              <div className="text-center space-y-6">
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    You're a Merchant!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Your account has been approved. Head to your dashboard to start managing ads.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate("/merchant/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            ) : role !== "merchant" ? (
              /* Upgrade Request Form */
              <div className="space-y-6">
                <p className="text-muted-foreground text-center">
                  Welcome,{" "}
                  <span className="font-medium text-foreground">
                    {user?.fullName}
                  </span>
                  ! Merchant accounts are verified by admin. Submit your details
                  for review.
                </p>

                {/* Role-specific info banner */}
                {(role === "admin" || role === "superadmin") && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2">
                    <span className="text-amber-500 text-sm flex-shrink-0">ℹ️</span>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      You're currently a <strong>{role}</strong>. You can still apply for a merchant account — an admin will review it.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Business Name *
                    </label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => markTouched("name")}
                      placeholder="Your business name"
                      className={touched.name && !nameValid ? "border-red-500 focus:ring-red-500/20" : ""}
                    />
                    {touched.name && !nameValid && (
                      <p className="text-xs text-red-500 mt-1">Min 2 characters required</p>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Business Type *
                    </label>
                    <Select
                      value={businessType}
                      onValueChange={(v) => { setBusinessType(v); markTouched("type"); }}
                    >
                      <SelectTrigger className={touched.type && !typeValid ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched.type && !typeValid && (
                      <p className="text-xs text-red-500 mt-1">Please select a business type</p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Contact Number *
                    </label>
                    <Input
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      onBlur={() => markTouched("phone")}
                      placeholder="+91 XXXXXXXXXX"
                      className={touched.phone && !phoneValid ? "border-red-500 focus:ring-red-500/20" : ""}
                    />
                    {touched.phone && !phoneValid && (
                      <p className="text-xs text-red-500 mt-1">Enter a valid phone number (10-15 digits)</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Brief Description *
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {description.length}/400
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 400))}
                      onBlur={() => markTouched("desc")}
                      placeholder="Tell us about your business (min 10 characters)..."
                      className={[
                        "w-full min-h-20 px-4 py-3 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-primary resize-none text-sm",
                        touched.desc && !descValid
                          ? "border-red-500 focus:ring-red-500/20"
                          : "border-input focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {touched.desc && !descValid && (
                      <p className="text-xs text-red-500 mt-1">Min 10 characters required</p>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Merchant Request"
                  )}
                </Button>

                {/* Benefits */}
                <div className="p-4 bg-muted/50 rounded-xl text-left">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Why advertise with UniEasy?
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> Reach
                      thousands of university students
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> Targeted
                      advertising near campuses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />{" "}
                      Affordable and flexible pricing
                    </li>
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

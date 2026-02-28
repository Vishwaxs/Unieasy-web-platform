import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useSyncUser } from "@/hooks/useSyncUser";
import ProtectedRoute from "@/components/ProtectedRoute";
import MerchantRoute from "@/components/MerchantRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MerchantAuth from "./pages/MerchantAuth";
import MerchantDashboard from "./pages/MerchantDashboard";
import Contact from "./pages/Contact";
import FoodDetails from "./pages/FoodDetails";
import FoodRestaurantDetails from "./pages/FoodRestaurantDetails";
import AccommodationDetails from "./pages/AccommodationDetails";
import AccommodationItemDetails from "./pages/AccommodationItemDetails";
import ExploreDetails from "./pages/ExploreDetails";
import StudyDetails from "./pages/StudyDetails";
import EssentialsDetails from "./pages/EssentialsDetails";
import SearchResults from "./pages/SearchResults";
import OnCampusDetails from "./pages/OnCampusDetails";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Sync Clerk user → Supabase app_users on sign-in
  useSyncUser();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            {/* Clerk auth UI — fixed top-right, above header */}
            <div className="fixed top-3 right-4 z-[60] flex items-center gap-2">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup/*" element={<SignupPage />} />
              <Route path="/signin/*" element={<SigninPage />} />
              <Route path="/home" element={<Home />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/food" element={<FoodDetails />} />
              <Route path="/food/:id" element={<FoodRestaurantDetails />} />
              <Route path="/accommodation" element={<AccommodationDetails />} />
              <Route path="/accommodation/:id" element={<AccommodationItemDetails />} />
              <Route path="/explore" element={<ExploreDetails />} />
              <Route path="/study" element={<StudyDetails />} />
              <Route path="/essentials" element={<EssentialsDetails />} />
              <Route path="/campus" element={<OnCampusDetails />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/merchant" element={<MerchantAuth />} />
              <Route
                path="/merchant/dashboard"
                element={
                  <MerchantRoute>
                    <MerchantDashboard />
                  </MerchantRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowed={["admin", "superadmin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute allowed={["superadmin"]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

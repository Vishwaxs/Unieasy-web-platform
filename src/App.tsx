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
import ErrorBoundary from "@/components/ErrorBoundary";
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

// ── Item 14: TanStack Query global defaults ─────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 10 * 60 * 1000,  // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Sync Clerk user → Supabase app_users on sign-in
  useSyncUser();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Item 8: React Router v6 future flags */}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />

            <Routes>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/signup/*" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
              <Route path="/signin/*" element={<ErrorBoundary><SigninPage /></ErrorBoundary>} />
              <Route path="/home" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary><Profile /></ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
              <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
              <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
              <Route path="/food" element={<ErrorBoundary><FoodDetails /></ErrorBoundary>} />
              <Route path="/food/:id" element={<ErrorBoundary><FoodRestaurantDetails /></ErrorBoundary>} />
              <Route path="/accommodation" element={<ErrorBoundary><AccommodationDetails /></ErrorBoundary>} />
              <Route path="/accommodation/:id" element={<ErrorBoundary><AccommodationItemDetails /></ErrorBoundary>} />
              <Route path="/explore" element={<ErrorBoundary><ExploreDetails /></ErrorBoundary>} />
              <Route path="/study" element={<ErrorBoundary><StudyDetails /></ErrorBoundary>} />
              <Route path="/essentials" element={<ErrorBoundary><EssentialsDetails /></ErrorBoundary>} />
              <Route path="/campus" element={<ErrorBoundary><OnCampusDetails /></ErrorBoundary>} />
              <Route path="/search" element={<ErrorBoundary><SearchResults /></ErrorBoundary>} />
              <Route path="/merchant" element={<ErrorBoundary><MerchantAuth /></ErrorBoundary>} />
              <Route
                path="/merchant/dashboard"
                element={
                  <MerchantRoute>
                    <ErrorBoundary><MerchantDashboard /></ErrorBoundary>
                  </MerchantRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowed={["admin", "superadmin"]}>
                    <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute allowed={["superadmin"]}>
                    <ErrorBoundary><SuperAdminDashboard /></ErrorBoundary>
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

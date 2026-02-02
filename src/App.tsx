import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import SignupStep1 from "./pages/SignupStep1";
import SignupStep2 from "./pages/SignupStep2";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MerchantAuth from "./pages/MerchantAuth";
import MerchantDashboard from "./pages/MerchantDashboard";
import Contact from "./pages/Contact";
import FoodDetails from "./pages/FoodDetails";
import AccommodationDetails from "./pages/AccommodationDetails";
import ExploreDetails from "./pages/ExploreDetails";
import StudyDetails from "./pages/StudyDetails";
import EssentialsDetails from "./pages/EssentialsDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignupStep1 />} />
            <Route path="/signup-step2" element={<SignupStep2 />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/food" element={<FoodDetails />} />
            <Route path="/accommodation" element={<AccommodationDetails />} />
            <Route path="/explore" element={<ExploreDetails />} />
            <Route path="/study" element={<StudyDetails />} />
            <Route path="/essentials" element={<EssentialsDetails />} />
            <Route path="/merchant" element={<MerchantAuth />} />
            <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

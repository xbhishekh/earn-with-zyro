import { lazy, Suspense, memo, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CommandPalette } from "@/components/CommandPalette";
import { ScrollProgress } from "@/components/ScrollProgress";
import { BackToTop } from "@/components/BackToTop";
import { warmCommonRoutes } from "@/lib/prefetch";

// Lazy load non-critical UI components to reduce initial bundle
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

// Import critical components directly
import SuspensionGuard from "@/components/SuspensionGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import NetworkStatusToast from "@/components/NetworkStatusToast";

// Eager load only the homepage — fastest LCP for landing
import Index from "./pages/Index";

// Lazy load everything else
const Auth = lazy(() => import("./pages/Auth"));

// Lazy load non-critical pages for better initial load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const MySubmissions = lazy(() => import("./pages/MySubmissions"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Balance = lazy(() => import("./pages/Balance"));
const Suspended = lazy(() => import("./pages/Suspended"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceProductDetail = lazy(() => import("./pages/MarketplaceProductDetail"));
const MarketplaceCreate = lazy(() => import("./pages/MarketplaceCreate"));
const MemberPortal = lazy(() => import("./pages/MemberPortal"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Messages = lazy(() => import("./pages/Messages"));
const Support = lazy(() => import("./pages/Support"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Memoized loading fallback component
const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = "PageLoader";

// Optimized QueryClient — sane defaults for scale
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      networkMode: "online",
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

const RoutePrewarmer = () => {
  useEffect(() => {
    warmCommonRoutes();
  }, []);
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={null}>
                <Toaster />
                <Sonner />
              </Suspense>
              <NetworkStatusToast />
              <ScrollProgress />
              <CommandPalette />
              <BackToTop />
              <RoutePrewarmer />
            <Suspense fallback={<PageLoader />}>
              <SuspensionGuard>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<RouteErrorBoundary routeName="Dashboard"><Dashboard /></RouteErrorBoundary>} />
                  <Route path="/campaigns" element={<RouteErrorBoundary routeName="Campaigns"><Campaigns /></RouteErrorBoundary>} />
                  <Route path="/my-submissions" element={<RouteErrorBoundary routeName="My Submissions"><MySubmissions /></RouteErrorBoundary>} />
                  <Route path="/campaigns/:id" element={<RouteErrorBoundary routeName="Campaign"><CampaignDetail /></RouteErrorBoundary>} />
                  <Route path="/c/:slug" element={<RouteErrorBoundary routeName="Campaign"><CampaignDetail /></RouteErrorBoundary>} />
                  <Route path="/balance" element={<RouteErrorBoundary routeName="Balance"><Balance /></RouteErrorBoundary>} />
                  <Route path="/suspended" element={<Suspended />} />
                  <Route path="/affiliate" element={<RouteErrorBoundary routeName="Affiliate"><Affiliate /></RouteErrorBoundary>} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/marketplace" element={<RouteErrorBoundary routeName="Marketplace"><Marketplace /></RouteErrorBoundary>} />
                  <Route path="/marketplace/create" element={<RouteErrorBoundary routeName="Create Product"><MarketplaceCreate /></RouteErrorBoundary>} />
                  <Route path="/marketplace/edit/:id" element={<RouteErrorBoundary routeName="Edit Product"><MarketplaceCreate /></RouteErrorBoundary>} />
                  <Route path="/marketplace/:id" element={<RouteErrorBoundary routeName="Product"><MarketplaceProductDetail /></RouteErrorBoundary>} />
                  <Route path="/member/:productId" element={<RouteErrorBoundary routeName="Member Portal"><MemberPortal /></RouteErrorBoundary>} />
                  <Route path="/gallery" element={<RouteErrorBoundary routeName="Gallery"><Gallery /></RouteErrorBoundary>} />
                  <Route path="/admin" element={<RouteErrorBoundary routeName="Admin"><Admin /></RouteErrorBoundary>} />
                  <Route path="/profile" element={<RouteErrorBoundary routeName="Profile"><Profile /></RouteErrorBoundary>} />
                  <Route path="/u/:username" element={<RouteErrorBoundary routeName="User Profile"><UserProfile /></RouteErrorBoundary>} />
                  <Route path="/messages" element={<RouteErrorBoundary routeName="Messages"><Messages /></RouteErrorBoundary>} />
                  <Route path="/support" element={<RouteErrorBoundary routeName="Support"><Support /></RouteErrorBoundary>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SuspensionGuard>
            </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { ReactNode, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSuspensionCheck } from "@/hooks/useSuspensionCheck";

interface SuspensionGuardProps {
  children: ReactNode;
}

// Memoized public routes set for O(1) lookup
const PUBLIC_ROUTES = new Set(["/", "/auth", "/suspended", "/terms", "/privacy", "/about", "/pricing", "/campaigns", "/marketplace", "/contact", "/careers"]);

const SuspensionGuard = ({ children }: SuspensionGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isGloballySuspended, loading: suspensionLoading } = useSuspensionCheck();
  const location = useLocation();

  // Memoize public route check - includes dynamic routes that start with /c/ or /marketplace/
  const isPublicRoute = useMemo(() => {
    const path = location.pathname;
    return PUBLIC_ROUTES.has(path) || 
           path.startsWith("/c/") || 
           path.startsWith("/marketplace/") ||
           path.startsWith("/u/");
  }, [location.pathname]);

  // Skip check for public routes - render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading only for protected routes AND only while actually loading
  if (authLoading || (user && suspensionLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in - let the page handle its own redirect
  if (!user) {
    return <>{children}</>;
  }

  // User is globally suspended - redirect to suspended page
  if (isGloballySuspended) {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
};

export default SuspensionGuard;

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSuspensionCheck } from "@/hooks/useSuspensionCheck";

interface SuspensionGuardProps {
  children: ReactNode;
}

const SuspensionGuard = ({ children }: SuspensionGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isGloballySuspended, loading: suspensionLoading } = useSuspensionCheck();
  const location = useLocation();

  // Public routes that don't need suspension check
  const publicRoutes = ["/", "/auth", "/suspended", "/terms", "/privacy", "/about", "/pricing"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Skip check for public routes
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Still loading auth or suspension status
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

import { useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback } from "react";
import { User, Session, type EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setRedirectIntent } from "@/lib/redirect-intent";

type AppRole = "creator" | "normal_admin" | "admin" | "super_admin" | "owner" | "founder";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean;
  isFounder: boolean;
  sendOtp: (
    email: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => Promise<{ error: Error | null; otpType?: EmailOtpType; otpLength?: number }>;
  verifyOtp: (email: string, token: string, type?: EmailOtpType) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return;
      }

      if (data) {
        setRole(data.role as AppRole);
      }
    } catch (err) {
      console.error("Error in fetchUserRole:", err);
    }
  };

  const refreshRole = useCallback(async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  }, [user]);

  useEffect(() => {
    const REMEMBER_ME_KEY = "cliperus_remember_me";
    
    // Check if user should be logged out (session-only preference)
    const checkRememberMe = async () => {
      const remembered = localStorage.getItem(REMEMBER_ME_KEY);
      const sessionOnly = sessionStorage.getItem(REMEMBER_ME_KEY);
      
      // If there's no remember flag and no session flag, user closed browser without "remember me"
      if (!remembered && !sessionOnly) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if this is a fresh browser session
          const lastActivity = localStorage.getItem("cliperus_last_activity");
          if (lastActivity) {
            const lastTime = parseInt(lastActivity, 10);
            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            
            // If more than 30 days and no remember me, sign out
            if (now - lastTime > thirtyDays) {
              await supabase.auth.signOut();
            }
          }
        }
      }
    };
    
    checkRememberMe();
    
    // Update last activity timestamp
    localStorage.setItem("cliperus_last_activity", Date.now().toString());
    
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch role after auth state change (deferred to avoid deadlock)
      if (session?.user) {
        // Update last activity on any auth event
        localStorage.setItem("cliperus_last_activity", Date.now().toString());
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      } else {
        setRole(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keep login and signup distinct: login must never create an account.
  const sendOtp = useCallback(async (
    email: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => {
    const isSignup = !!metadata;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isSignup,
        emailRedirectTo: `${window.location.origin}/auth`,
        data: metadata
          ? {
              username: metadata.username,
              displayName: metadata.displayName,
              referredBy: metadata.referredBy,
            }
          : undefined,
      },
    });

    return {
      error: error as Error | null,
      otpType: (isSignup ? "signup" : "email") as EmailOtpType,
      otpLength: 6,
    };
  }, []);

  // Verify OTP code
  const verifyOtp = useCallback(async (email: string, token: string, type?: EmailOtpType) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: (type ?? ("email" as EmailOtpType)) as EmailOtpType,
    });

    return { error: error as Error | null };
  }, []);

  // Sign up with email + password
  const signUpWithPassword = useCallback(async (
    email: string,
    password: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata
          ? {
              username: metadata.username,
              displayName: metadata.displayName,
              referredBy: metadata.referredBy,
            }
          : undefined,
      },
    });

    return { error: error as Error | null };
  }, []);

  // Sign in with email + password
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    if (redirectPath) {
      setRedirectIntent(redirectPath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Always come back to /auth; we then route instantly using redirect intent.
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    return { error: error as Error | null };
  }, []);

  // Send password reset email
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset-password`,
    });

    return { error: error as Error | null };
  }, []);

  // Update password (used after reset link clicked)
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  // Memoized derived admin states to prevent unnecessary re-renders
  const derivedStates = useMemo(() => {
    const isFounder = role === "founder";
    const isOwner = role === "owner";
    const isSuperAdmin = role === "super_admin" || isOwner || isFounder;
    const isAdmin = role === "normal_admin" || role === "admin" || isSuperAdmin;
    return { isFounder, isOwner, isSuperAdmin, isAdmin };
  }, [role]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    role,
    ...derivedStates,
    sendOtp,
    verifyOtp,
    signUpWithPassword,
    signInWithPassword,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    refreshRole,
  }), [user, session, loading, role, derivedStates, sendOtp, verifyOtp, signUpWithPassword, signInWithPassword, signInWithGoogle, resetPassword, updatePassword, signOut, refreshRole]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session, type EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  ) => Promise<{ error: Error | null; otpType?: EmailOtpType }>;
  verifyOtp: (email: string, token: string, type?: EmailOtpType) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
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

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch role after auth state change (deferred to avoid deadlock)
      if (session?.user) {
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

  // Send OTP to email using Supabase's built-in signInWithOtp (sends 6-digit code)
  const sendOtp = async (
    email: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => {
    const isSignup = !!metadata;

    // Use Supabase's built-in OTP which sends a proper 6-digit code
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isSignup,
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

    return {
      error: error as Error | null,
      // For email OTP verification, Supabase expects `type: "email"`.
      otpType: "email" as EmailOtpType,
    };
  };

  // Verify OTP code
  const verifyOtp = async (email: string, token: string, type?: EmailOtpType) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: (type ?? ("email" as EmailOtpType)) as EmailOtpType,
    });

    return { error: error as Error | null };
  };

  // Sign up with email + password
  const signUpWithPassword = async (
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
  };

  // Sign in with email + password
  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  // Derived admin states
  const isFounder = role === "founder";
  const isOwner = role === "owner";
  const isSuperAdmin = role === "super_admin" || isOwner || isFounder;
  const isAdmin = role === "normal_admin" || role === "admin" || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin,
        isSuperAdmin,
        isOwner,
        isFounder,
        sendOtp,
        verifyOtp,
        signUpWithPassword,
        signInWithPassword,
        signOut,
        refreshRole,
      }}
    >
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


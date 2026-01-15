import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session, type EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "creator" | "normal_admin" | "admin" | "super_admin" | "owner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean;
  sendOtp: (
    email: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => Promise<{ error: Error | null; otpType?: EmailOtpType }>;
  verifyOtp: (email: string, token: string, type?: EmailOtpType) => Promise<{ error: Error | null }>;
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

  // Send OTP to email (custom email via backend function, NOT magic-link template)
  const sendOtp = async (
    email: string,
    metadata?: { username?: string; displayName?: string; referredBy?: string },
  ) => {
    const isSignup = !!metadata;

    const { data, error } = await supabase.functions.invoke("auth-send-code", {
      body: {
        email,
        isSignup,
        metadata: metadata
          ? {
              username: metadata.username,
              displayName: metadata.displayName,
              referredBy: metadata.referredBy,
            }
          : {},
        redirectTo: `${window.location.origin}/`,
      },
    });

    return {
      error: (error as Error | null) ?? null,
      otpType: (data?.otpType as EmailOtpType | undefined) ?? (isSignup ? "signup" : "magiclink"),
    };
  };

  // Verify OTP code
  const verifyOtp = async (email: string, token: string, type?: EmailOtpType) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: (type ?? "magiclink") as EmailOtpType,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  // Derived admin states
  const isAdmin = role === "normal_admin" || role === "admin" || role === "super_admin" || role === "owner";
  const isSuperAdmin = role === "super_admin" || role === "owner";
  const isOwner = role === "owner";

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
        sendOtp,
        verifyOtp,
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


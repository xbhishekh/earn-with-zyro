import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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
  sendOtp: (email: string, metadata?: { username?: string; displayName?: string; referredBy?: string }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
      }
    );

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

  // Send OTP to email (works for both login and signup)
  const sendOtp = async (
    email: string, 
    metadata?: { username?: string; displayName?: string; referredBy?: string }
  ) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: metadata ? {
          username: metadata.username,
          displayName: metadata.displayName,
          referredBy: metadata.referredBy,
        } : undefined,
      },
    });
    
    return { error: error as Error | null };
  };

  // Verify OTP code
  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
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
    <AuthContext.Provider value={{ 
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
      refreshRole
    }}>
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

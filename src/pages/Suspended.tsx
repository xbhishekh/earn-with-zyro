import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ban, MessageCircle, LogOut, Mail } from "lucide-react";
import logo from "@/assets/cliporax-mark.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Suspended = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [suspension, setSuspension] = useState<{ reason: string | null; suspended_at: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkSuspension();
    }
  }, [user]);

  const checkSuspension = async () => {
    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select("reason, suspended_at")
        .eq("user_id", user!.id)
        .is("campaign_id", null) // Global suspension
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSuspension(data);
      } else {
        // Not suspended, redirect to dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error checking suspension:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img loading="lazy" decoding="async" 
            src={logo} 
            alt="CliporaX" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <span className="font-display font-bold text-xl gradient-text">
            CliporaX
          </span>
        </Link>

        <div className="glass-card rounded-2xl p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-destructive" />
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl font-bold mb-2">
            Account Suspended
          </h1>
          <p className="text-muted-foreground mb-6">
            Your account has been suspended from the platform.
          </p>

          {/* Reason */}
          {suspension?.reason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{suspension.reason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full" 
              asChild
            >
              <a href="mailto:cliporaxofficial@gmail.com?subject=Account%20Suspension%20Appeal&body=Hi%20CliporaX%20Team%2C%0A%0AI%20would%20like%20to%20appeal%20my%20account%20suspension.%0A%0AAccount%20Email%3A%20%0AReason%20for%20appeal%3A%20%0A%0AThank%20you.">
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link to="/support">
                <MessageCircle className="w-5 h-5 mr-2" />
                Help Center
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          If you believe this is a mistake, email us at{" "}
          <a href="mailto:cliporaxofficial@gmail.com" className="text-primary hover:underline">
            cliporaxofficial@gmail.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Suspended;

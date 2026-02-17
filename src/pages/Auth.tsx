import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, User, ArrowRight, Loader2, Check, X, Sparkles, Zap, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { consumeRedirectIntent, getRedirectIntent, sanitizeRedirectPath, setRedirectIntent } from "@/lib/redirect-intent";
import { supabase } from "@/integrations/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

const emailSchema = z.string().email("Please enter a valid email address");

type AuthStep = "email" | "otp";

const REMEMBER_ME_KEY = "zyrozo_remember_me";
const RESEND_COOLDOWN = 30;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    user, 
    loading: authLoading, 
    isAdmin, 
    isOwner, 
    sendOtp, 
    verifyOtp,
    signInWithGoogle,
  } = useAuth();

  const mode = searchParams.get("mode");
  const redirectToParam = searchParams.get("redirectTo");
  const redirectTo = sanitizeRedirectPath(redirectToParam) ?? getRedirectIntent();

  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [otpType, setOtpType] = useState<EmailOtpType>("email");
  const [rememberMe, setRememberMe] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", usernameToCheck.toLowerCase())
        .maybeSingle();
      if (error) { setUsernameStatus("idle"); return; }
      setUsernameStatus(data ? "taken" : "available");
    } catch { setUsernameStatus("idle"); }
  }, []);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
    setUsernameStatus("idle");
    if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current);
    if (sanitized.length >= 3) {
      usernameCheckTimeoutRef.current = setTimeout(() => checkUsernameAvailability(sanitized), 500);
    }
  };

  useEffect(() => { return () => { if (usernameCheckTimeoutRef.current) clearTimeout(usernameCheckTimeoutRef.current); }; }, []);
  useEffect(() => { if (redirectTo) setRedirectIntent(redirectTo); }, [redirectTo]);
  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => { if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  useEffect(() => {
    if (!authLoading && user) {
      const intent = consumeRedirectIntent();
      if (intent) { navigate(intent, { replace: true }); return; }
      if (isOwner || isAdmin) navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, authLoading, isAdmin, isOwner, navigate]);

  const saveRememberMe = () => {
    if (rememberMe) localStorage.setItem(REMEMBER_ME_KEY, "true");
    else { localStorage.removeItem(REMEMBER_ME_KEY); sessionStorage.setItem(REMEMBER_ME_KEY, "session"); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch (error) { if (error instanceof z.ZodError) toast.error(error.errors[0].message); return; }
    setIsLoading(true);
    setIsSendingOtp(true);
    try {
      const metadata = isSignup ? { username: username || email.split("@")[0], displayName: displayName || username || email.split("@")[0] } : undefined;
      const { error, otpType: returnedOtpType } = await sendOtp(email, metadata);
      if (error) {
        if (error.message.includes("already registered")) { toast.error("Email already registered. Please login instead."); setIsSignup(false); }
        else toast.error(error.message);
      } else {
        if (returnedOtpType) setOtpType(returnedOtpType);
        setStep("otp"); startResendTimer(); toast.success("Verification code sent to your email!");
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsLoading(false); setIsSendingOtp(false); }
  };

  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 8) return;
    setIsLoading(true);
    try {
      const { error } = await verifyOtp(email, value, otpType);
      if (error) { toast.error("Invalid or expired code. Please try again."); setOtp(""); }
      else { saveRememberMe(); toast.success("Logged in successfully!"); }
    } catch { toast.error("Something went wrong. Please try again."); setOtp(""); }
    finally { setIsLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOtpForm = () => (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Mail className="w-3.5 h-3.5" />
          Code Sent
        </div>
        <h1 className="font-display text-3xl font-bold mb-2 text-foreground">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          We sent an 8-digit code to <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      <div className="bg-accent/50 border border-border/50 rounded-2xl p-4 mb-6 text-sm text-muted-foreground backdrop-blur-sm">
        <span className="font-medium text-foreground">💡 Tip:</span> Check your spam/junk folder if you don't see the email within a minute.
      </div>

      <div className="space-y-6">
        {isSendingOtp ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Sending code...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <InputOTP maxLength={8} value={otp} onChange={(value) => { setOtp(value); if (value.length === 8) handleVerifyOtp(value); }} disabled={isLoading}>
              <InputOTPGroup>
                {[0,1,2,3,4,5,6,7].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
        )}

        {isLoading && !isSendingOtp && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Verifying...</p>
          </div>
        )}

        <div className="text-center space-y-4">
          <button onClick={() => { setStep("email"); setOtp(""); setResendTimer(0); if (timerRef.current) clearInterval(timerRef.current); }} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            ← Back to email
          </button>
          <div>
            {resendTimer > 0 ? (
              <p className="text-muted-foreground text-sm">Resend code in <span className="font-medium text-foreground">{resendTimer}s</span></p>
            ) : (
              <button onClick={async () => {
                setIsSendingOtp(true);
                const metadata = isSignup ? { username: username || email.split("@")[0], displayName: displayName || username || email.split("@")[0] } : undefined;
                const { error } = await sendOtp(email, metadata);
                if (error) toast.error("Failed to resend code.");
                else { startResendTimer(); toast.success("New code sent!"); }
                setIsSendingOtp(false);
              }} disabled={isSendingOtp} className="text-primary hover:underline text-sm font-medium">
                Resend code
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderEmailForm = () => (
    <>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          {isSignup ? "Get Started Free" : "Welcome Back"}
        </div>
        <h1 className="font-display text-4xl font-bold mb-2 text-foreground tracking-tight">
          {isSignup ? "Create Your Account" : "Welcome Back"}
        </h1>
        <p className="text-muted-foreground text-base">
          {isSignup ? "Join thousands of creators earning on Zyrozo" : "Sign in to continue to your dashboard"}
        </p>
      </div>

      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-13 bg-card/50 border-border/60 rounded-xl text-base focus:border-primary/50 focus:bg-card transition-all"
              required autoFocus
            />
          </div>
        </div>

        {isSignup && (
          <>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-foreground">Username</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="username" type="text" placeholder="yourname" value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`pl-11 pr-11 h-13 bg-card/50 border-border/60 rounded-xl text-base transition-all ${
                    usernameStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : ""
                  } ${usernameStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="w-4.5 h-4.5 animate-spin text-muted-foreground" />}
                  {usernameStatus === "available" && <Check className="w-4.5 h-4.5 text-green-500" />}
                  {usernameStatus === "taken" && <X className="w-4.5 h-4.5 text-destructive" />}
                </div>
              </div>
              {usernameStatus === "taken" && <p className="text-destructive text-xs">Username is already taken</p>}
              {usernameStatus === "available" && <p className="text-green-500 text-xs">Username is available!</p>}
              {username.length > 0 && username.length < 3 && <p className="text-muted-foreground text-xs">Username must be at least 3 characters</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">Display Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="displayName" type="text" placeholder="Your Name" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-11 h-13 bg-card/50 border-border/60 rounded-xl text-base transition-all"
                />
              </div>
            </div>
          </>
        )}

        <Button type="submit" variant="hero" size="lg" className="w-full h-13 rounded-xl text-base font-semibold mt-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              {isSignup ? "Create Account" : "Send Code"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest">
          <span className="bg-background px-4 text-muted-foreground/70 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Google */}
      <Button
        type="button" variant="outline" size="lg"
        className="w-full h-13 rounded-xl text-base font-medium border-border/60 hover:bg-accent/50 transition-all"
        onClick={async () => {
          setIsLoading(true);
          if (redirectTo) setRedirectIntent(redirectTo);
          const { error } = await signInWithGoogle(redirectTo ?? undefined);
          if (error) toast.error(error.message);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      {/* Toggle */}
      <p className="text-center text-muted-foreground mt-8 text-sm">
        {isSignup ? (
          <>Already have an account?{" "}<button onClick={() => setIsSignup(false)} className="text-primary hover:underline font-semibold">Log in</button></>
        ) : (
          <>Don't have an account?{" "}<button onClick={() => setIsSignup(true)} className="text-primary hover:underline font-semibold">Sign up</button></>
        )}
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
              <img src={logo} alt="Zyrozo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              Zyrozo
            </span>
          </Link>

          {step === "email" && renderEmailForm()}
          {step === "otp" && renderOtpForm()}
        </div>
      </div>

      {/* Right Side - Premium Branding Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 auth-gradient-bg" />
        
        {/* Mesh / noise overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Floating orbs */}
        <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-white/10 rounded-full blur-3xl auth-float-1" />
        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-white/8 rounded-full blur-3xl auth-float-2" />
        <div className="absolute top-[50%] right-[30%] w-40 h-40 bg-white/12 rounded-full blur-2xl auth-float-3" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo icon */}
          <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl mb-8 p-3">
            <img src={logo} alt="Zyrozo" className="w-full h-full object-contain" />
          </div>
          
          <h2 className="font-display text-4xl font-bold text-white mb-4 text-center tracking-tight">
            Start Earning Today
          </h2>
          <p className="text-white/70 max-w-sm mx-auto text-lg text-center leading-relaxed mb-12">
            Join 5,000+ creators who are already monetizing their content with Zyrozo
          </p>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center px-6 py-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="font-display text-3xl font-bold text-white">$50K+</div>
              <div className="text-white/60 text-sm mt-1">Paid Out</div>
            </div>
            <div className="text-center px-6 py-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="font-display text-3xl font-bold text-white">100+</div>
              <div className="text-white/60 text-sm mt-1">Campaigns</div>
            </div>
            <div className="text-center px-6 py-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="font-display text-3xl font-bold text-white">5K+</div>
              <div className="text-white/60 text-sm mt-1">Creators</div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-10 justify-center max-w-md">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 text-white/80 text-sm">
              <Zap className="w-4 h-4 text-yellow-300" />
              Instant Payouts
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 text-white/80 text-sm">
              <TrendingUp className="w-4 h-4 text-green-300" />
              Real-time Analytics
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 text-white/80 text-sm">
              <Sparkles className="w-4 h-4 text-purple-300" />
              Top Brands
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

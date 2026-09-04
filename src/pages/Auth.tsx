import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, User, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, X, Sparkles, Zap, TrendingUp, Shield, Star } from "lucide-react";
import logo from "@/assets/cliperus-mark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { consumeRedirectIntent, getRedirectIntent, sanitizeRedirectPath, setRedirectIntent } from "@/lib/redirect-intent";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Please enter a valid email address");

const REMEMBER_ME_KEY = "cliperus_remember_me";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    user, 
    loading: authLoading, 
    isAdmin, 
    isOwner, 
    signUpWithPassword,
    signInWithPassword,
    resetPassword,
    signInWithGoogle,

  } = useAuth();

  const mode = searchParams.get("mode");
  const redirectToParam = searchParams.get("redirectTo");
  const redirectTo = sanitizeRedirectPath(redirectToParam) ?? getRedirectIntent();

  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch (error) { if (error instanceof z.ZodError) toast.error(error.errors[0].message); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      if (isSignup) {
        if (usernameStatus === "taken") { toast.error("Username is already taken"); return; }
        const { error } = await signUpWithPassword(email, password, {
          username: username || email.split("@")[0],
          displayName: displayName || username || email.split("@")[0],
        });
        if (error) {
          if (/already|registered|exists/i.test(error.message)) {
            toast.error("This email already has an account. Please log in.");
            setIsSignup(false);
          } else toast.error(error.message);
        } else {
          saveRememberMe();
          toast.success("Account created! Welcome to Cliperus 🎉");
        }
        return;
      }

      const { error } = await signInWithPassword(email, password);
      if (error) {
        if (/invalid login|credentials/i.test(error.message)) toast.error("Wrong email or password.");
        else toast.error(error.message);
      } else {
        saveRememberMe();
        toast.success("Logged in successfully!");
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleForgotPassword = async () => {
    try { emailSchema.parse(email); } catch { toast.error("Enter your email first"); return; }
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  const renderEmailForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-5 border border-primary/15">
          <Sparkles className="w-3.5 h-3.5" />
          {isSignup ? "Get Started Free" : "Welcome Back"}
        </div>
        <h1 className="font-display text-[2.5rem] leading-tight font-extrabold mb-3 text-foreground tracking-tight">
          {isSignup ? "Create Your\nAccount" : "Welcome\nBack"}
        </h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {isSignup ? "Join thousands of creators earning on Cliperus" : "Sign in to continue to your dashboard"}
        </p>
      </div>

      {/* Side chooser: Clipper vs Business */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-3">
          <p className="text-sm font-bold text-foreground">I'm a Clipper</p>
          <p className="text-xs text-muted-foreground mt-0.5">Earn per view on clips</p>
        </div>
        <Link
          to="/business"
          className="rounded-xl border-2 border-border hover:border-primary/50 p-3 transition-colors"
        >
          <p className="text-sm font-bold text-foreground">I'm a Business</p>
          <p className="text-xs text-muted-foreground mt-0.5">Book a campaign call</p>
        </Link>
      </div>



      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              id="email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-[52px] bg-muted/30 border-2 border-border/50 rounded-xl text-[15px] placeholder:text-muted-foreground/40 focus:border-primary focus:bg-background focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)] transition-all duration-200"
              required autoFocus
            />
          </div>
        </div>

        {isSignup && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider">Username</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  id="username" type="text" placeholder="yourname" value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`pl-12 pr-12 h-[52px] bg-muted/30 border-2 rounded-xl text-[15px] placeholder:text-muted-foreground/40 transition-all duration-200 ${
                    usernameStatus === "taken" ? "border-destructive focus:shadow-[0_0_0_4px_hsl(var(--destructive)/0.08)]" : ""
                  } ${usernameStatus === "available" ? "border-green-500 focus:shadow-[0_0_0_4px_hsl(142_76%_36%/0.08)]" : ""
                  } ${usernameStatus === "idle" || usernameStatus === "checking" ? "border-border/50 focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]" : ""}`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="w-[18px] h-[18px] animate-spin text-muted-foreground" />}
                  {usernameStatus === "available" && <Check className="w-[18px] h-[18px] text-green-500" />}
                  {usernameStatus === "taken" && <X className="w-[18px] h-[18px] text-destructive" />}
                </div>
              </div>
              {usernameStatus === "taken" && <p className="text-destructive text-xs font-medium">Username is already taken</p>}
              {usernameStatus === "available" && <p className="text-green-500 text-xs font-medium">Username is available!</p>}
              {username.length > 0 && username.length < 3 && <p className="text-muted-foreground text-xs">Minimum 3 characters</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider">Display Name <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  id="displayName" type="text" placeholder="Your Name" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-12 h-[52px] bg-muted/30 border-2 border-border/50 rounded-xl text-[15px] placeholder:text-muted-foreground/40 focus:border-primary focus:bg-background focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)] transition-all duration-200"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wider">Password</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              id="password" type={showPassword ? "text" : "password"} placeholder={isSignup ? "At least 6 characters" : "Your password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-[52px] bg-muted/30 border-2 border-border/50 rounded-xl text-[15px] placeholder:text-muted-foreground/40 focus:border-primary focus:bg-background focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)] transition-all duration-200"
              required minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
          {!isSignup && (
            <div className="flex justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-primary hover:underline text-xs font-medium">
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full h-[52px] rounded-xl text-[15px] font-bold mt-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_36px_-8px_hsl(var(--primary)/0.6)]" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              {isSignup ? "Create Account" : "Log In"}
              <ArrowRight className="w-5 h-5 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-[0.2em]">
          <span className="bg-background px-4 text-muted-foreground/50 font-semibold">Or continue with</span>
        </div>
      </div>

      {/* Google */}
      <Button
        type="button" variant="outline" size="lg"
        className="w-full h-[52px] rounded-xl text-[15px] font-medium border-2 border-border/50 hover:border-border hover:bg-muted/40 transition-all duration-200"
        onClick={async () => {
          setIsLoading(true);
          if (redirectTo) setRedirectIntent(redirectTo);
          const { error } = await signInWithGoogle(redirectTo ?? undefined);
          if (error) toast.error(error.message);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      {/* Toggle */}
      <p className="text-center text-muted-foreground text-sm">
        {isSignup ? (
          <>Already have an account?{" "}<button onClick={() => setIsSignup(false)} className="text-primary hover:underline font-semibold">Log in</button></>
        ) : (
          <>Don't have an account?{" "}<button onClick={() => setIsSignup(true)} className="text-primary hover:underline font-semibold">Sign up</button></>
        )}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-20">
        {/* Logo top */}
        <Link to="/" className="inline-flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-border/30 group-hover:shadow-md transition-shadow">
            <img src={logo} alt="Cliperus" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-xl gradient-text">
            Cliperus
          </span>
        </Link>

        {/* Form center */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0">
          {renderEmailForm()}
        </div>

        {/* Footer */}
        <p className="text-muted-foreground/40 text-xs">
          © {new Date().getFullYear()} Cliperus. All rights reserved.
        </p>
      </div>

      {/* Right Side - Premium Panel */}
      <div className="hidden lg:flex w-[45%] xl:w-[48%] relative overflow-hidden m-3 rounded-3xl">
        {/* Gradient background */}
        <div className="absolute inset-0 auth-gradient-bg" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Floating orbs */}
        <div className="absolute top-[8%] left-[12%] w-72 h-72 bg-primary/15 rounded-full blur-3xl auth-float-1" />
        <div className="absolute bottom-[10%] right-[8%] w-96 h-96 bg-secondary/40 rounded-full blur-3xl auth-float-2" />
        <div className="absolute top-[45%] right-[25%] w-48 h-48 bg-primary/20 rounded-full blur-2xl auth-float-3" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-10 xl:p-16">
          {/* Logo */}
          <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-primary/20 shadow-2xl mb-10 p-2.5">
            <img src={logo} alt="Cliperus" className="w-full h-full object-contain" />
          </div>
          
          <h2 className="font-display text-[2.75rem] font-extrabold text-foreground mb-4 text-center leading-tight tracking-tight">
            Start Earning<br />Today
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-base text-center leading-relaxed mb-12">
            Join 5,000+ creators who are already monetizing their content with Cliperus
          </p>

          {/* Stats row */}
          <div className="flex gap-4 mb-10">
            {[
              { value: "$50K+", label: "Paid Out" },
              { value: "100+", label: "Campaigns" },
              { value: "5K+", label: "Creators" },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-5 py-4 bg-white/70 rounded-2xl backdrop-blur-sm border border-primary/15 min-w-[100px]">
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground text-xs mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 justify-center max-w-md">
            {[
              { icon: <Zap className="w-3.5 h-3.5 text-yellow-500" />, label: "Instant Payouts" },
              { icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />, label: "Real-time Analytics" },
              { icon: <Shield className="w-3.5 h-3.5 text-blue-500" />, label: "Secure Payments" },
              { icon: <Star className="w-3.5 h-3.5 text-amber-500" />, label: "Top Brands" },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full backdrop-blur-sm border border-primary/15 text-foreground text-[13px] font-medium">
                {pill.icon}
                {pill.label}
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="mt-12 bg-white/70 backdrop-blur-sm border border-primary/15 rounded-2xl p-5 max-w-sm w-full">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              "Cliperus helped me earn my first ₹50K within 2 weeks. The platform is incredibly easy to use!"
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-foreground text-xs font-bold">R</div>
              <div>
                <p className="text-foreground text-sm font-semibold">Rahul K.</p>
                <p className="text-muted-foreground text-xs">Content Creator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;

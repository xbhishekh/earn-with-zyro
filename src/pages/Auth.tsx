import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, User, ArrowRight, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { consumeRedirectIntent, getRedirectIntent, sanitizeRedirectPath, setRedirectIntent } from "@/lib/redirect-intent";
import type { EmailOtpType } from "@supabase/supabase-js";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthStep = "email" | "otp" | "forgot-password";
type AuthMethod = "password" | "otp";

const REMEMBER_ME_KEY = "zyrozo_remember_me";

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
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    signInWithGoogle,
  } = useAuth();

  const mode = searchParams.get("mode");
  const redirectToParam = searchParams.get("redirectTo");
  const redirectTo = sanitizeRedirectPath(redirectToParam) ?? getRedirectIntent();

  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [otpType, setOtpType] = useState<EmailOtpType>("email");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");

  // Persist redirect intent (supports refresh / oauth roundtrip)
  useEffect(() => {
    if (redirectTo) {
      setRedirectIntent(redirectTo);
    }
  }, [redirectTo]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const intent = consumeRedirectIntent();
      if (intent) {
        navigate(intent, { replace: true });
        return;
      }

      if (isOwner || isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, isOwner, navigate]);

  const saveRememberMe = () => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      sessionStorage.setItem(REMEMBER_ME_KEY, "session");
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      if (isSignup) {
        const { error } = await signUpWithPassword(email, password, {
          username: username || email.split("@")[0],
          displayName: displayName || username || email.split("@")[0],
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please login instead.");
            setIsSignup(false);
          } else {
            toast.error(error.message);
          }
        } else {
          saveRememberMe();
          toast.success("Account created successfully!");
        }
      } else {
        const { error } = await signInWithPassword(email, password);

        if (error) {
          toast.error(error.message);
        } else {
          saveRememberMe();
          toast.success("Logged in successfully!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const metadata = isSignup
        ? {
            username: username || email.split("@")[0],
            displayName: displayName || username || email.split("@")[0],
          }
        : undefined;

      const { error, otpType: returnedOtpType } = await sendOtp(email, metadata);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email already registered. Please login instead.");
          setIsSignup(false);
        } else {
          toast.error(error.message);
        }
      } else {
        if (returnedOtpType) {
          setOtpType(returnedOtpType);
        }
        setStep("otp");
        toast.success("Verification code sent to your email!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 6) return;

    setIsLoading(true);

    try {
      const { error } = await verifyOtp(email, value, otpType);

      if (error) {
        toast.error("Invalid or expired code. Please try again.");
        setOtp("");
      } else {
        saveRememberMe();
        toast.success("Logged in successfully!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent to your email!");
        setStep("email");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOtpForm = () => (
    <>
      <h1 className="font-display text-3xl font-bold mb-2">
        Check your email
      </h1>
      <p className="text-muted-foreground mb-8">
        We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
      </p>

      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (value.length === 6) {
                handleVerifyOtp(value);
              }
            }}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        <div className="text-center space-y-4">
          <button
            onClick={() => {
              setStep("email");
              setOtp("");
            }}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to email
          </button>
          
          <div>
            <button
              onClick={async () => {
                setIsLoading(true);
                const metadata = isSignup
                  ? {
                      username: username || email.split("@")[0],
                      displayName: displayName || username || email.split("@")[0],
                    }
                  : undefined;
                const { error } = await sendOtp(email, metadata);
                if (error) {
                  toast.error("Failed to resend code. Please try again.");
                } else {
                  toast.success("New code sent!");
                }
                setIsLoading(false);
              }}
              disabled={isLoading}
              className="text-primary hover:underline text-sm font-medium"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <h1 className="font-display text-3xl font-bold mb-2">
        Reset Password
      </h1>
      <p className="text-muted-foreground mb-6">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleForgotPassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
              required
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-center text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to login
        </button>
      </form>
    </>
  );

  const renderEmailForm = () => (
    <>
      <h1 className="font-display text-3xl font-bold mb-2">
        {isSignup ? "Create Account" : "Welcome Back"}
      </h1>
      <p className="text-muted-foreground mb-6">
        {isSignup 
          ? "Join thousands of creators earning on Zyrozo" 
          : "Sign in to your account"
        }
      </p>

      {/* Auth Method Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
        <button
          onClick={() => setAuthMethod("password")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === "password"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setAuthMethod("otp")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === "otp"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Email Code
        </button>
      </div>

      {/* Auth Form */}
      <form onSubmit={authMethod === "password" ? handlePasswordAuth : handleSendOtp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
              required
              autoFocus
            />
          </div>
        </div>

        {authMethod === "password" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => setStep("forgot-password")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-card border-border"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {isSignup && (
          <>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="pl-10 h-12 bg-card border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                />
              </div>
            </div>
          </>
        )}

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <label
            htmlFor="remember-me"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Remember me for 30 days
          </label>
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {authMethod === "password" ? (isSignup ? "Create Account" : "Sign In") : "Send Code"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={async () => {
          setIsLoading(true);
          // If user came from a campaign deep link, preserve it for OAuth roundtrip.
          if (redirectTo) setRedirectIntent(redirectTo);

          const { error } = await signInWithGoogle(redirectTo ?? undefined);
          if (error) {
            toast.error(error.message);
          }
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Toggle Mode */}
      <p className="text-center text-muted-foreground mt-6">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setIsSignup(false)}
              className="text-primary hover:underline font-semibold"
            >
              Log in
            </button>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => setIsSignup(true)}
              className="text-primary hover:underline font-semibold"
            >
              Sign up
            </button>
          </>
        )}
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img 
              src={logo} 
              alt="Zyrozo" 
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="font-display font-bold text-xl gradient-text">
              Zyrozo
            </span>
          </Link>

          {step === "email" && renderEmailForm()}
          {step === "otp" && renderOtpForm()}
          {step === "forgot-password" && renderForgotPasswordForm()}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center text-white">
          <div>
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm p-3">
              <img src={logo} alt="Zyrozo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-display text-4xl font-bold mb-4">
              Start Earning Today
            </h2>
            <p className="text-white/80 max-w-sm mx-auto text-lg">
              Join 5,000+ creators who are already monetizing their content with Zyrozo
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="font-display text-3xl font-bold">$50K+</div>
                <div className="text-white/70 text-sm">Paid Out</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold">100+</div>
                <div className="text-white/70 text-sm">Campaigns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

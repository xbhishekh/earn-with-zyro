import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Zap, Mail, User, ArrowRight, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import type { EmailOtpType } from "@supabase/supabase-js";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMethod = "password" | "otp";

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
    signUpWithPassword,
    signInWithPassword,
  } = useAuth();

  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otpType, setOtpType] = useState<EmailOtpType>("email");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (isOwner || isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, isOwner, navigate]);

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
        const metadata = {
          username: username || email.split("@")[0],
          displayName: displayName || username || email.split("@")[0],
        };

        const { error } = await signUpWithPassword(email, password, metadata);

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please login instead.");
            setIsSignup(false);
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully!");
        }
      } else {
        const { error } = await signInWithPassword(email, password);

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
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
        toast.success("Logged in successfully!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setOtp("");
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              Zyrozo
            </span>
          </Link>

          {step === "email" ? (
            <>
              {/* Header */}
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
              <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    authMethod === "password"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    authMethod === "otp"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Email Code
                </button>
              </div>

              {/* Password Auth Form */}
              {authMethod === "password" ? (
                <form onSubmit={handlePasswordAuth} className="space-y-5">
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

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
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
                        {isSignup ? "Create Account" : "Log In"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* OTP Auth Form */
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-otp">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email-otp"
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

                  {isSignup && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="username-otp">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="username-otp"
                            type="text"
                            placeholder="yourname"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            className="pl-10 h-12 bg-card border-border"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="displayName-otp">Display Name (optional)</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="displayName-otp"
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
                        Send Code
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Toggle Mode */}
              <p className="text-center text-muted-foreground mt-8">
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
          ) : (
            <>
              {/* OTP Verification */}
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
          )}
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
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
              <Zap className="w-12 h-12" />
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
                <div className="font-display text-3xl font-bold">$500K+</div>
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

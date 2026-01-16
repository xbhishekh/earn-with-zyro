import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, User, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const usernameSchema = z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isOwner, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"email" | "otp" | "signup-info">(
    searchParams.get("mode") === "signup" ? "email" : "email",
  );
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);

  // Auth state for OTP verification
  const [otpType, setOtpType] = useState<any>(undefined);

  // Form fields
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

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

  // Auto-verify when OTP is complete (6 or 8 digits - Supabase uses 6, some flows use 8)
  useEffect(() => {
    if ((otpCode.length === 6 || otpCode.length === 8) && step === "otp") {
      handleVerifyOtp();
    }
  }, [otpCode]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    // If signup, validate username first
    if (isSignup && step === "signup-info") {
      try {
        usernameSchema.parse(username);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error(error.errors[0].message);
        }
        return;
      }
    }

    setIsLoading(true);

    try {
      const { error, otpType } = await sendOtp(
        email,
        isSignup
          ? {
              username,
              displayName: displayName || username,
            }
          : undefined,
      );

      if (error) {
        toast.error(error.message);
      } else {
        setOtpType(otpType);
        toast.success("Verification code sent to your email!");
        setStep("otp");
      }
    } catch (error) {
      toast.error("Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      toast.error("Please enter the complete verification code");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await verifyOtp(email, otpCode, otpType);

      if (error) {
        if (error.message.includes("Invalid") || error.message.includes("expired")) {
          toast.error("Code mismatch! Please check and try again.");
        } else {
          toast.error(error.message);
        }
        setOtpCode("");
      } else {
        toast.success("Verified successfully!");
        // Redirect will be handled by useEffect
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      setOtpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    if (isSignup) {
      setStep("signup-info");
    } else {
      handleSendOtp();
    }
  };

  const handleSignupInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendOtp();
  };

  const goBack = () => {
    if (step === "otp") {
      setStep(isSignup ? "signup-info" : "email");
      setOtpCode("");
    } else if (step === "signup-info") {
      setStep("email");
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              Zyrozo
            </span>
          </Link>

          {/* Back button */}
          {step !== "email" && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Header */}
          <h1 className="font-display text-3xl font-bold mb-2">
            {step === "email" && (isSignup ? "Create Account" : "Welcome Back")}
            {step === "signup-info" && "Complete Your Profile"}
            {step === "otp" && "Enter Verification Code"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {step === "email" && (isSignup 
              ? "Join thousands of creators earning on Zyrozo" 
              : "Enter your email to receive a verification code"
            )}
            {step === "signup-info" && "Choose a unique username for your profile"}
            {step === "otp" && (
              <>We sent a code to <span className="text-foreground font-medium">{email}</span>. Enter the verification code from your email.</>
            )}
          </p>

          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Signup Info Step */}
          {step === "signup-info" && (
            <form onSubmit={handleSignupInfoSubmit} className="space-y-5">
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
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, and underscores only
                </p>
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

          {/* OTP Step */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={8}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <InputOTPSlot
                        key={idx}
                        index={idx}
                        className="w-10 h-12 text-lg border-border bg-card"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="text-primary hover:underline font-medium disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {/* Toggle Mode */}
          {step === "email" && (
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
          )}
        </motion.div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

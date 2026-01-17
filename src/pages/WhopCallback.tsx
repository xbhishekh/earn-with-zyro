import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhopCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const usernameParam = searchParams.get("username");

    if (success === "true") {
      setStatus("success");
      setUsername(usernameParam || "");
      setMessage("Your Whop account has been verified successfully!");
    } else if (error) {
      setStatus("error");
      const errorMessages: Record<string, string> = {
        missing_params: "Missing authorization parameters",
        invalid_state: "Invalid or expired session. Please try again.",
        expired_state: "Session expired. Please try again.",
        token_exchange_failed: "Failed to connect to Whop. Please try again.",
        profile_fetch_failed: "Failed to fetch your Whop profile.",
        update_failed: "Failed to update your account.",
        insert_failed: "Failed to link your account.",
        internal_error: "An unexpected error occurred.",
      };
      setMessage(errorMessages[error] || errorDescription || "Verification failed");
    } else {
      // Still processing or unknown state
      setTimeout(() => {
        setStatus("error");
        setMessage("Unknown response from Whop");
      }, 5000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="glass-card rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-bold mb-2">Connecting to Whop...</h1>
              <p className="text-muted-foreground">Please wait while we verify your account</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-bold mb-2">Verified! ✨</h1>
              {username && (
                <p className="text-muted-foreground mb-4">
                  Connected as <span className="font-medium text-foreground">@{username}</span>
                </p>
              )}
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button 
                onClick={() => navigate("/profile")}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
              >
                Go to Profile
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/profile")}
                  className="w-full"
                >
                  Back to Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WhopCallback;

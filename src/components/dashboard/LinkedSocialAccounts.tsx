import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

interface SocialAccount {
  id: string;
  platform: string;
  username: string | null;
  profile_url: string | null;
  status: string;
  is_verified: boolean;
  verification_code: string | null;
  admin_code: string | null;
  admin_notes: string | null;
  created_at: string;
}

const platformConfig: Record<string, { icon: any; color: string; name: string; urlPattern: RegExp }> = {
  instagram: {
    icon: Instagram,
    color: "text-pink-500",
    name: "Instagram",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/,
  },
  tiktok: {
    icon: TikTokIcon,
    color: "text-foreground",
    name: "TikTok",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/,
  },
  youtube: {
    icon: Youtube,
    color: "text-red-500",
    name: "YouTube",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)?([a-zA-Z0-9_-]+)/,
  },
  twitter: {
    icon: Twitter,
    color: "text-blue-400",
    name: "X (Twitter)",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/,
  },
};

interface LinkedSocialAccountsProps {
  isOwnProfile?: boolean;
  userId?: string;
}

const LinkedSocialAccounts = ({ isOwnProfile = true, userId }: LinkedSocialAccountsProps) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchAccounts();
    }
  }, [targetUserId]);

  const fetchAccounts = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractUsername = (url: string, platform: string): string | null => {
    const config = platformConfig[platform];
    if (!config) return null;
    
    const match = url.match(config.urlPattern);
    return match ? match[1] : null;
  };

  const handleAddAccount = async () => {
    if (!selectedPlatform || !profileUrl.trim()) {
      toast.error("Please select a platform and enter your profile URL");
      return;
    }

    const username = extractUsername(profileUrl, selectedPlatform);
    if (!username) {
      toast.error("Invalid profile URL. Please enter a valid URL.");
      return;
    }

    // Check if platform already linked
    const existing = accounts.find(a => a.platform === selectedPlatform);
    if (existing) {
      toast.error(`You already have a ${platformConfig[selectedPlatform].name} account linked`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("social_accounts").insert({
        user_id: user!.id,
        platform: selectedPlatform,
        username: username,
        profile_url: profileUrl,
        status: "pending_link",
      });

      if (error) throw error;

      toast.success("Account added! Waiting for admin to send verification code.");
      setIsAddModalOpen(false);
      setSelectedPlatform("");
      setProfileUrl("");
      fetchAccounts();
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast.error(error.message || "Failed to add account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCodeAdded = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ status: "pending_verification" })
        .eq("id", accountId);

      if (error) throw error;
      toast.success("Great! Admin will verify your account shortly.");
      fetchAccounts();
    } catch (error) {
      console.error("Error confirming code:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this social account?")) return;

    try {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
      toast.success("Account removed");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to remove account");
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied! Add it to your bio.");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (account: SocialAccount) => {
    if (account.is_verified) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    
    switch (account.status) {
      case "pending_link":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "awaiting_code":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/50"><AlertCircle className="w-3 h-3 mr-1" />Code Ready</Badge>;
      case "pending_verification":
        return <Badge variant="outline" className="text-purple-500 border-purple-500/50"><Clock className="w-3 h-3 mr-1" />Verifying</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-destructive border-destructive/50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{account.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-bold">Linked Social Accounts</h3>
          <p className="text-sm text-muted-foreground">Connect your social media for verification</p>
        </div>
        {isOwnProfile && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No social accounts linked yet</p>
          {isOwnProfile && (
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              Link Your First Account
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const config = platformConfig[account.platform];
            const Icon = config?.icon || ExternalLink;
            
            return (
              <div
                key={account.id}
                className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center ${config?.color || ""}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config?.name || account.platform}</span>
                        {getStatusBadge(account)}
                      </div>
                      <p className="text-sm text-muted-foreground">@{account.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* External link */}
                    {account.profile_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}

                    {/* Delete button */}
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status-specific content */}
                {isOwnProfile && account.status === "pending_link" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Waiting for admin to send verification code...
                    </p>
                  </div>
                )}

                {/* Show admin code when awaiting_code */}
                {isOwnProfile && account.status === "awaiting_code" && account.admin_code && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Add this code to your bio:
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-lg font-mono font-bold bg-background px-4 py-2 rounded-lg">
                        {account.admin_code}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(account.admin_code!)}
                      >
                        {copiedCode === account.admin_code ? (
                          <><Check className="w-4 h-4 mr-1 text-green-500" />Copied</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-1" />Copy</>
                        )}
                      </Button>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleConfirmCodeAdded(account.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      I Added the Code to My Bio
                    </Button>
                  </div>
                )}

                {/* Show pending verification status */}
                {isOwnProfile && account.status === "pending_verification" && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Admin is verifying your account. This may take a few hours.
                    </p>
                  </div>
                )}

                {/* Show rejection reason */}
                {isOwnProfile && account.status === "rejected" && account.admin_notes && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive font-medium mb-1">Rejection Reason:</p>
                    <p className="text-sm text-muted-foreground">{account.admin_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Social Account</DialogTitle>
            <DialogDescription>
              Add your social media profile to get verified
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(platformConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Profile URL</label>
              <Input
                placeholder={`https://${selectedPlatform || "platform"}.com/yourusername`}
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the full URL to your profile
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={submitting}>
              {submitting ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default LinkedSocialAccounts;
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Send,
  Globe
} from "lucide-react";
import { 
  PlatformIcon, 
  InstagramIcon, 
  YouTubeIcon, 
  TikTokColorIcon, 
  TwitterXIcon, 
  FacebookIcon, 
  SnapchatIcon 
} from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Pinterest icon component (not in main platform-icons)
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#E60023">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

// Twitch icon component (not in main platform-icons)
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#9146FF">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

// LinkedIn icon component (not in main platform-icons)
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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

// Whop icon component
const WhopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#FF6243" />
    <path
      d="M7 8h2l2 8 2-8h2l2 8 2-8h2"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const platformConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; name: string; urlPattern: RegExp; isOAuth?: boolean }> = {
  whop: {
    icon: WhopIcon,
    name: "Whop",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?whop\.com\/([a-zA-Z0-9_-]+)/,
    isOAuth: true,
  },
  instagram: {
    icon: InstagramIcon,
    name: "Instagram",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/,
  },
  tiktok: {
    icon: TikTokColorIcon,
    name: "TikTok",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/,
  },
  youtube: {
    icon: YouTubeIcon,
    name: "YouTube",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)?([a-zA-Z0-9_-]+)/,
  },
  twitter: {
    icon: TwitterXIcon,
    name: "X (Twitter)",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/,
  },
  facebook: {
    icon: FacebookIcon,
    name: "Facebook",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)/,
  },
  linkedin: {
    icon: LinkedInIcon,
    name: "LinkedIn",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/,
  },
  snapchat: {
    icon: SnapchatIcon,
    name: "Snapchat",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([a-zA-Z0-9_.]+)/,
  },
  pinterest: {
    icon: PinterestIcon,
    name: "Pinterest",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]+)/,
  },
  twitch: {
    icon: TwitchIcon,
    name: "Twitch",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/,
  },
  spotify: {
    icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
    name: "Spotify",
    urlPattern: /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:user|artist)\/([a-zA-Z0-9]+)/,
  },
  other: {
    icon: () => <Globe className="w-5 h-5 text-muted-foreground" />,
    name: "Other",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9_.-]+\.[a-zA-Z]{2,})\/?/,
  },
};

interface LinkedSocialAccountsProps {
  isOwnProfile?: boolean;
  userId?: string;
}

const LinkedSocialAccounts = ({ isOwnProfile = true, userId }: LinkedSocialAccountsProps) => {
  const { user, isAdmin, isSuperAdmin, isOwner, isFounder, role } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  // Users can add their own social accounts, but only admins can delete them
  const canAddAccounts = isOwnProfile && !!user;
  const canDeleteAccounts = isAdmin || isSuperAdmin || isOwner || isFounder || role === "normal_admin";
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [whopConnecting, setWhopConnecting] = useState(false);

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

  // Handle Whop OAuth connection
  const handleWhopConnect = async () => {
    // Check if Whop already linked
    const existing = accounts.find(a => a.platform === "whop");
    if (existing) {
      toast.error("You already have a Whop account linked");
      return;
    }

    setWhopConnecting(true);
    // NOTE: Some sites (like Whop) refuse to load inside the editor preview iframe.
    // Open a new tab immediately to avoid popup blockers.
    const popup = window.open("about:blank", "_blank");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        popup?.close();
        toast.error("Please sign in to connect your Whop account");
        return;
      }

      const response = await supabase.functions.invoke("whop-oauth-start", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        popup?.close();
        throw new Error(response.error.message || "Failed to start OAuth");
      }

      const { authUrl } = response.data as { authUrl?: string };
      if (!authUrl) {
        popup?.close();
        throw new Error("No OAuth URL returned");
      }

      // Prefer the popup/new tab (works even when preview is inside an iframe)
      if (popup && !popup.closed) {
        try {
          // Prevent the new page from having access to the opener
          popup.opener = null;
        } catch {
          // ignore
        }
        popup.location.href = authUrl;
        popup.focus?.();
        return;
      }

      // Fallbacks
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      } catch {
        window.location.href = authUrl;
      }
    } catch (error: any) {
      console.error("Error starting Whop OAuth:", error);
      toast.error(error.message || "Failed to connect to Whop");
    } finally {
      setWhopConnecting(false);
    }
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
        {canAddAccounts && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-muted-foreground mb-4">No social accounts linked yet</p>
          {canAddAccounts && (
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="border-pink-500/50 text-pink-600 hover:bg-pink-500/10">
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
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
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

                    {/* Delete button - only for admins */}
                    {canDeleteAccounts && (
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
                        <config.icon className="w-4 h-4" />
                        {config.name}
                        {config.isOAuth && (
                          <span className="text-xs text-green-500 ml-1">• Auto-verify</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show Whop OAuth button when Whop is selected */}
            {selectedPlatform === "whop" ? (
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your Whop account for <span className="text-green-500 font-medium">instant verification</span> - no manual review needed!
                </p>
                <Button
                  onClick={handleWhopConnect}
                  disabled={whopConnecting}
                  className="w-full bg-[#FF6243] hover:bg-[#e5573b] text-white"
                >
                  {whopConnecting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <WhopIcon className="w-5 h-5 mr-2" />
                      Connect with Whop
                    </>
                  )}
                </Button>
              </div>
            ) : (
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            {selectedPlatform !== "whop" && (
              <Button onClick={handleAddAccount} disabled={submitting}>
                {submitting ? "Adding..." : "Add Account"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default LinkedSocialAccounts;
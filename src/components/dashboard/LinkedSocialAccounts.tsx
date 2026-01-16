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
  Send,
  Facebook,
  Linkedin,
  Twitch,
  Film,
  Tv,
  Music,
  Globe
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

// Snapchat icon component
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.076-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.449-.165-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.015-.36.285-.69.72-.839.156-.074.346-.104.54-.104.12 0 .284.015.449.104.375.165.72.284 1.019.284.211 0 .359-.045.435-.09-.008-.165-.023-.329-.037-.51l-.002-.06c-.106-1.628-.232-3.654.297-4.847C7.86 1.068 11.216.793 12.206.793z"/>
  </svg>
);

// Pinterest icon component
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
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
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    name: "Facebook",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)/,
  },
  linkedin: {
    icon: Linkedin,
    color: "text-blue-700",
    name: "LinkedIn",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/,
  },
  snapchat: {
    icon: SnapchatIcon,
    color: "text-yellow-400",
    name: "Snapchat",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([a-zA-Z0-9_.]+)/,
  },
  pinterest: {
    icon: PinterestIcon,
    color: "text-red-600",
    name: "Pinterest",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]+)/,
  },
  twitch: {
    icon: Twitch,
    color: "text-purple-500",
    name: "Twitch",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/,
  },
  spotify: {
    icon: Music,
    color: "text-green-500",
    name: "Spotify",
    urlPattern: /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:user|artist)\/([a-zA-Z0-9]+)/,
  },
  netflix: {
    icon: Film,
    color: "text-red-500",
    name: "Netflix",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?netflix\.com\/([a-zA-Z0-9_-]+)/,
  },
  primevideo: {
    icon: Tv,
    color: "text-blue-400",
    name: "Prime Video",
    urlPattern: /(?:https?:\/\/)?(?:www\.)?primevideo\.com\/([a-zA-Z0-9_-]+)/,
  },
  other: {
    icon: Globe,
    color: "text-muted-foreground",
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

  // Only admins can add/delete social accounts
  const canManageAccounts = isAdmin || isSuperAdmin || isOwner || isFounder || role === "normal_admin";
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
        {isOwnProfile && canManageAccounts && (
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
          {isOwnProfile && canManageAccounts && (
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

                    {/* Delete button - only for admins */}
                    {isOwnProfile && canManageAccounts && (
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
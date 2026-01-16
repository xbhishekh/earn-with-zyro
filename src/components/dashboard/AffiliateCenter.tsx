import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Link2, Users, DollarSign, MousePointer, Copy, Check, 
  Share2, RefreshCw, ExternalLink, TrendingUp,
  Twitter, MessageCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface AffiliateLink {
  id: string;
  user_id: string;
  campaign_id: string | null;
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  affiliate_commission_percent: number;
  status: string;
}

interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  amount: number;
  campaign_id: string | null;
  status: string;
  created_at: string;
}

interface ReferredUser {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
}

const AffiliateCenter = () => {
  const { user } = useAuth();
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [profile, setProfile] = useState<{ username: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [linksRes, campaignsRes, rewardsRes, profileRes, referredRes] = await Promise.all([
        supabase.from("affiliate_links").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("campaigns").select("id, name, slug, affiliate_commission_percent, status").eq("status", "active"),
        supabase.from("referral_rewards").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("username").eq("user_id", user.id).single(),
        supabase.from("profiles").select("id, user_id, username, display_name, created_at").eq("referred_by", user.id),
      ]);

      setAffiliateLinks(linksRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setReferralRewards(rewardsRes.data || []);
      setProfile(profileRes.data);
      setReferredUsers(referredRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    if (!user || !selectedCampaign || !profile?.username) {
      toast.error("Please select a campaign first");
      return;
    }

    const existingLink = affiliateLinks.find(l => l.campaign_id === selectedCampaign);
    if (existingLink) {
      toast.error("You already have a link for this campaign");
      return;
    }

    setGeneratingLink(true);
    try {
      const code = profile.username;
      
      const { error } = await supabase.from("affiliate_links").insert({
        user_id: user.id,
        campaign_id: selectedCampaign,
        code: code,
      });

      if (error) throw error;
      
      toast.success("Affiliate link generated!");
      fetchData();
      setSelectedCampaign("");
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error(error.message || "Failed to generate link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const getFullLink = (code: string, campaignId: string | null) => {
    const baseUrl = "https://zyrozo.com";
    
    if (campaignId) {
      const campaign = campaigns.find(c => c.id === campaignId);
      const slug = campaign?.slug || campaign?.name?.toLowerCase().replace(/\s+/g, '-') || "campaign";
      return `${baseUrl}/${slug}?ref=${code}`;
    }
    return `${baseUrl}?ref=${code}`;
  };

  const copyLink = async (code: string, campaignId: string | null) => {
    const link = getFullLink(code, campaignId);
    await navigator.clipboard.writeText(link);
    setCopiedLink(code);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const shareToTwitter = (code: string, campaignId: string | null) => {
    const link = getFullLink(code, campaignId);
    const text = encodeURIComponent(`Join me on this amazing creator platform and start earning! 🚀`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, "_blank");
  };

  const shareToWhatsApp = (code: string, campaignId: string | null) => {
    const link = getFullLink(code, campaignId);
    const text = encodeURIComponent(`Hey! Check out this creator platform where you can earn rewards. Join using my link: ${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTelegram = (code: string, campaignId: string | null) => {
    const link = getFullLink(code, campaignId);
    const text = encodeURIComponent(`Join me on this amazing creator platform!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`, "_blank");
  };

  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return "General";
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || "Unknown Campaign";
  };

  // Calculate stats
  const totalClicks = affiliateLinks.reduce((a, b) => a + (b.clicks || 0), 0);
  const totalSignups = affiliateLinks.reduce((a, b) => a + (b.signups || 0), 0);
  const totalConversions = affiliateLinks.reduce((a, b) => a + (b.conversions || 0), 0);
  const totalEarnings = referralRewards.reduce((a, b) => a + (b.status === "completed" ? Number(b.amount) : 0), 0);
  const pendingEarnings = referralRewards.reduce((a, b) => a + (b.status === "pending" ? Number(b.amount) : 0), 0);

  const availableCampaigns = campaigns.filter(c => 
    !affiliateLinks.some(l => l.campaign_id === c.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Affiliate Center</h2>
            <p className="text-sm text-muted-foreground">Manage your referral links and earn</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Links</p>
                <p className="font-display text-lg font-bold">{affiliateLinks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <MousePointer className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="font-display text-lg font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Signups</p>
                <p className="font-display text-lg font-bold">{totalSignups.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="font-display text-lg font-bold">{totalConversions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="font-display text-lg font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Banner */}
      {pendingEarnings > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">
              <strong>${pendingEarnings.toFixed(2)}</strong> pending
            </span>
          </div>
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Pending</Badge>
        </div>
      )}

      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="links">My Links</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* My Links Tab */}
        <TabsContent value="links" className="space-y-4">
          {/* Generate New Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate New Link</CardTitle>
              <CardDescription className="text-xs">Create affiliate links for specific campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCampaigns.length === 0 ? (
                      <SelectItem value="none" disabled>No available campaigns</SelectItem>
                    ) : (
                      availableCampaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.affiliate_commission_percent}%)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={generateLink} 
                  disabled={!selectedCampaign || generatingLink}
                  size="sm"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {generatingLink ? "..." : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Links List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Links</CardTitle>
            </CardHeader>
            <CardContent>
              {affiliateLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No affiliate links yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {affiliateLinks.map(link => (
                    <div key={link.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{getCampaignName(link.campaign_id)}</span>
                        <Badge variant="outline" className="text-xs">{link.code}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span>{link.clicks} clicks</span>
                        <span>{link.signups} signups</span>
                        <span>{link.conversions} conversions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => copyLink(link.code, link.campaign_id)}
                        >
                          {copiedLink === link.code ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => shareToTwitter(link.code, link.campaign_id)}
                        >
                          <Twitter className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => shareToWhatsApp(link.code, link.campaign_id)}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => shareToTelegram(link.code, link.campaign_id)}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Referrals</CardTitle>
              <CardDescription className="text-xs">Users who signed up using your link</CardDescription>
            </CardHeader>
            <CardContent>
              {referredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referredUsers.map(referred => (
                    <div key={referred.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {referred.display_name?.charAt(0) || referred.username?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{referred.display_name || referred.username || "User"}</p>
                          <p className="text-xs text-muted-foreground">@{referred.username || "unknown"}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(referred.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Earnings History</CardTitle>
              <CardDescription className="text-xs">Your affiliate commissions</CardDescription>
            </CardHeader>
            <CardContent>
              {referralRewards.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No earnings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referralRewards.map(reward => (
                    <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          reward.status === "completed" ? "bg-green-500/10" : "bg-yellow-500/10"
                        }`}>
                          <DollarSign className={`w-4 h-4 ${
                            reward.status === "completed" ? "text-green-500" : "text-yellow-500"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">${Number(reward.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCampaignName(reward.campaign_id)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={reward.status === "completed" ? "default" : "outline"} className="text-xs">
                          {reward.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(reward.created_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateCenter;

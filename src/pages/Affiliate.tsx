import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Link2, Users, DollarSign, MousePointer, Copy, Check, 
  Share2, ArrowLeft, RefreshCw, ExternalLink, TrendingUp,
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

const Affiliate = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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

    // Check if link already exists for this campaign
    const existingLink = affiliateLinks.find(l => l.campaign_id === selectedCampaign);
    if (existingLink) {
      toast.error("You already have a link for this campaign");
      return;
    }

    setGeneratingLink(true);
    try {
      // Use just the username as the code (Whop style)
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

  // Create URL-friendly slug from campaign name
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const getFullLink = (code: string, campaignId: string | null) => {
    // Use cliporax.com domain with campaign slug from database
    const baseUrl = "https://cliporax.com";
    
    if (campaignId) {
      const campaign = campaigns.find(c => c.id === campaignId);
      // Use the slug from database, fallback to generated slug from name
      const slug = campaign?.slug || createSlug(campaign?.name || "campaign");
      // Use /c/ prefix for clean campaign URLs
      return `${baseUrl}/c/${slug}?ref=${code}`;
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

  // Filter campaigns that don't have a link yet
  const availableCampaigns = campaigns.filter(c => 
    !affiliateLinks.some(l => l.campaign_id === c.id)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">Affiliate Center</h1>
              <p className="text-sm text-muted-foreground">Manage your referral links and earnings</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Links</p>
                    <p className="font-display text-xl font-bold">{affiliateLinks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Clicks</p>
                    <p className="font-display text-xl font-bold">{totalClicks.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Signups</p>
                    <p className="font-display text-xl font-bold">{totalSignups.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-display text-xl font-bold">{totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="font-display text-xl font-bold">${totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pending Earnings Banner */}
        {pendingEarnings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">
                You have <strong>${pendingEarnings.toFixed(2)}</strong> in pending affiliate earnings
              </span>
            </div>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Pending</Badge>
          </motion.div>
        )}

        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="links">My Links</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* My Links Tab */}
          <TabsContent value="links" className="space-y-6">
            {/* Generate New Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate New Link</CardTitle>
                <CardDescription>Create affiliate links for specific campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
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
                            {c.name} ({c.affiliate_commission_percent}% commission)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={generateLink} 
                    disabled={!selectedCampaign || generatingLink}
                    className="shrink-0"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {generatingLink ? "Generating..." : "Generate Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Links Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Affiliate Links</CardTitle>
                <CardDescription>Manage and share your referral links</CardDescription>
              </CardHeader>
              <CardContent>
                {affiliateLinks.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No affiliate links yet</p>
                    <p className="text-sm text-muted-foreground">Generate your first link above to start earning!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="text-center">Clicks</TableHead>
                          <TableHead className="text-center">Signups</TableHead>
                          <TableHead className="text-center">Conversions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliateLinks.map(link => (
                          <TableRow key={link.id}>
                            <TableCell className="font-medium">
                              {getCampaignName(link.campaign_id)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{link.code}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{link.clicks?.toLocaleString() || 0}</TableCell>
                            <TableCell className="text-center">{link.signups?.toLocaleString() || 0}</TableCell>
                            <TableCell className="text-center">{link.conversions?.toLocaleString() || 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyLink(link.code, link.campaign_id)}
                                >
                                  {copiedLink === link.code ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Share2 className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Share Your Link</DialogTitle>
                                      <DialogDescription>
                                        Share your affiliate link to earn commissions
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <div className="p-3 bg-muted rounded-lg text-sm break-all">
                                        {getFullLink(link.code, link.campaign_id)}
                                      </div>
                                      <div className="grid grid-cols-3 gap-3">
                                        <Button
                                          variant="outline"
                                          onClick={() => shareToTwitter(link.code, link.campaign_id)}
                                          className="flex items-center gap-2"
                                        >
                                          <Twitter className="w-4 h-4" />
                                          Twitter
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => shareToWhatsApp(link.code, link.campaign_id)}
                                          className="flex items-center gap-2"
                                        >
                                          <MessageCircle className="w-4 h-4" />
                                          WhatsApp
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => shareToTelegram(link.code, link.campaign_id)}
                                          className="flex items-center gap-2"
                                        >
                                          <Send className="w-4 h-4" />
                                          Telegram
                                        </Button>
                                      </div>
                                      <Button 
                                        className="w-full" 
                                        onClick={() => copyLink(link.code, link.campaign_id)}
                                      >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Referrals</CardTitle>
                <CardDescription>Users who signed up using your link</CardDescription>
              </CardHeader>
              <CardContent>
                {referredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No referrals yet</p>
                    <p className="text-sm text-muted-foreground">Share your links to start referring users!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referredUsers.map(refUser => (
                        <TableRow key={refUser.id}>
                          <TableCell className="font-medium">
                            @{refUser.username || refUser.display_name || "Anonymous"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(refUser.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Earned</p>
                    <p className="font-display text-3xl font-bold text-green-500">${totalEarnings.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Pending</p>
                    <p className="font-display text-3xl font-bold text-yellow-500">${pendingEarnings.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Signup Bonuses</p>
                    <p className="font-display text-3xl font-bold text-primary">
                      ${(referredUsers.length * 2).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings History</CardTitle>
                <CardDescription>Your affiliate commission payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {referralRewards.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No earnings yet</p>
                    <p className="text-sm text-muted-foreground">Earnings will appear here when your referrals convert!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralRewards.map(reward => (
                        <TableRow key={reward.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(reward.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="font-medium text-green-500">
                            +${Number(reward.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {reward.campaign_id ? "Commission" : "Signup Bonus"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={reward.status === "completed" ? "default" : "secondary"}
                              className={reward.status === "completed" ? "bg-green-500" : ""}
                            >
                              {reward.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>How Affiliate Program Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-1">Generate Links</h3>
                  <p className="text-sm text-muted-foreground">Create unique affiliate links for campaigns</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-1">Share & Invite</h3>
                  <p className="text-sm text-muted-foreground">Share links on social media and with friends</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-1">Users Convert</h3>
                  <p className="text-sm text-muted-foreground">Earn $2 for each signup + commission on earnings</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-primary">4</span>
                  </div>
                  <h3 className="font-semibold mb-1">Get Paid</h3>
                  <p className="text-sm text-muted-foreground">Withdraw earnings to your bank or wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Affiliate;

import { useState, useEffect } from "react";
import { 
  Share2, 
  Link2, 
  MousePointerClick, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  Copy,
  ExternalLink,
  Plus,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface AffiliateLink {
  id: string;
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  campaign_id: string | null;
  campaign?: {
    name: string;
    slug: string | null;
  };
}

interface AffiliateStats {
  totalLinks: number;
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  totalEarned: number;
}

const AffiliateCenter = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalLinks: 0,
    totalClicks: 0,
    totalSignups: 0,
    totalConversions: 0,
    totalEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    try {
      // Fetch affiliate links with campaign info
      const { data: linksData, error: linksError } = await supabase
        .from("affiliate_links")
        .select(`
          id,
          code,
          clicks,
          signups,
          conversions,
          campaign_id,
          campaigns (name, slug)
        `)
        .eq("user_id", user!.id);

      if (linksError) throw linksError;

      const formattedLinks = (linksData || []).map(link => ({
        ...link,
        campaign: link.campaigns as { name: string; slug: string | null } | undefined
      }));

      setLinks(formattedLinks);

      // Calculate stats
      const totalClicks = formattedLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
      const totalSignups = formattedLinks.reduce((sum, l) => sum + (l.signups || 0), 0);
      const totalConversions = formattedLinks.reduce((sum, l) => sum + (l.conversions || 0), 0);

      // Fetch affiliate earnings from balance_transactions
      const { data: earningsData } = await supabase
        .from("balance_transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "affiliate_commission");

      const totalEarned = (earningsData || []).reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalLinks: formattedLinks.length,
        totalClicks,
        totalSignups,
        totalConversions,
        totalEarned,
      });
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAffiliateData();
    setRefreshing(false);
    toast.success("Data refreshed!");
  };

  const copyLink = (code: string, campaignSlug?: string | null) => {
    const baseUrl = window.location.origin;
    const link = campaignSlug 
      ? `${baseUrl}/c/${campaignSlug}?ref=${code}`
      : `${baseUrl}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

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
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Affiliate Center</h2>
              <p className="text-sm text-muted-foreground">Manage your referral links and earn</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Links</p>
                <p className="text-xl font-bold">{stats.totalLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="text-xl font-bold">{stats.totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Signups</p>
                <p className="text-xl font-bold">{stats.totalSignups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="text-xl font-bold">{stats.totalConversions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="text-2xl font-bold text-amber-500">${stats.totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Links List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Your Affiliate Links</h3>
          <Button asChild size="sm" variant="outline">
            <Link to="/campaigns">
              <Plus className="w-4 h-4 mr-2" />
              Get More Links
            </Link>
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Link2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No affiliate links yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join campaigns to get your unique referral links and start earning!
            </p>
            <Button asChild>
              <Link to="/campaigns">
                Browse Campaigns
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {links.map((link) => (
              <div key={link.id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {link.campaign?.name || "General Referral"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {link.clicks} clicks
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    ref={link.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyLink(link.code, link.campaign?.slug)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {link.campaign?.slug && (
                    <Button variant="ghost" size="icon" asChild>
                      <a 
                        href={`/c/${link.campaign.slug}?ref=${link.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">💰 How Affiliate Earnings Work</h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Share your unique referral link with your audience</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Earn $2 flat bonus when someone signs up using your link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Earn commission on their campaign earnings forever!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AffiliateCenter;

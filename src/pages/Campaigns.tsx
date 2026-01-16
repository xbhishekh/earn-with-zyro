import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, DollarSign, Eye, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  platforms: string[] | null;
  reward_per_1k_views: number;
  budget_total: number | null;
  budget_spent: number | null;
  campaign_type: string | null;
  status: string | null;
  join_type: string | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string | null;
  creator_avatar?: string | null;
}

const categories = ["All", "Gaming", "Fitness", "Technology", "Travel", "Food", "Fashion", "Sports", "Entertainment"];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch creator profiles for campaigns
      const campaignsWithCreators = await Promise.all(
        (data || []).map(async (campaign) => {
          if (campaign.created_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", campaign.created_by)
              .single();
            return {
              ...campaign,
              creator_name: profile?.display_name || "Zyrozo",
              creator_avatar: profile?.avatar_url,
            };
          }
          return { ...campaign, creator_name: "Zyrozo", creator_avatar: null };
        })
      );
      
      setCampaigns(campaignsWithCreators);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("tiktok")) return "🎵";
    if (p.includes("youtube")) return "📺";
    if (p.includes("instagram")) return "📸";
    if (p.includes("twitter") || p.includes("x")) return "𝕏";
    if (p.includes("facebook")) return "📘";
    return "🌐";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Active <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse our active campaigns and start earning from your content today
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search campaigns..." className="pl-10 h-12 bg-card border-border" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <Button key={category} variant={category === selectedCategory ? "default" : "outline"} size="sm" className="whitespace-nowrap" onClick={() => setSelectedCategory(category)}>
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No campaigns found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign, index) => {
                const budgetTotal = campaign.budget_total || 0;
                const budgetSpent = campaign.budget_spent || 0;
                const budgetRemaining = Math.max(0, budgetTotal - budgetSpent);
                const budgetPercent = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
                const timeAgo = formatDistanceToNow(new Date(campaign.created_at), { addSuffix: false });
                
                return (
                  <motion.div key={campaign.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                    <Link to={`/campaigns/${campaign.id}`} className="block glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all">
                      {/* Header with Creator & Badges */}
                      <div className="p-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            {campaign.creator_avatar ? (
                              <img src={campaign.creator_avatar} alt="" className="w-full h-full object-cover" />
                            ) : campaign.thumbnail_url ? (
                              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{campaign.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-xs">{campaign.campaign_type?.toUpperCase() || "UGC"}</Badge>
                            {campaign.category && <Badge variant="outline" className="text-xs">{campaign.category}</Badge>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeAgo} ago</span>
                      </div>

                      {/* Campaign Title & Creator */}
                      <div className="px-4 pb-3">
                        <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
                          {campaign.name} - ₹{campaign.reward_per_1k_views} Per 1,000 Views
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{campaign.creator_name}</span>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          {campaign.platforms && campaign.platforms.length > 0 && (
                            <div className="flex gap-1 ml-2">
                              {campaign.platforms.map((p) => (
                                <span key={p} className="text-sm">{getPlatformIcon(p)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Budget Progress */}
                      <div className="px-4 pb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Paid Out</span>
                          <span className="text-muted-foreground">CPM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-lg">₹{(budgetSpent / 1000).toFixed(2)}k</span>
                            <span className="text-muted-foreground text-sm"> / ₹{(budgetTotal / 1000).toFixed(0)}k</span>
                          </div>
                          <div>
                            <span className="font-bold text-primary text-lg">₹{campaign.reward_per_1k_views}</span>
                            <span className="text-muted-foreground text-sm"> / 1k views</span>
                          </div>
                        </div>
                        {budgetTotal > 0 && (
                          <Progress value={budgetPercent} className="h-1.5 mt-2" />
                        )}
                      </div>

                      {/* Stats Footer */}
                      <div className="px-4 py-3 border-t border-border grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Approval</p>
                          <p className="font-semibold text-sm">High</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Views</p>
                          <p className="font-semibold text-sm">--</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Budget Left</p>
                          <p className="font-semibold text-sm text-success">₹{(budgetRemaining / 1000).toFixed(2)}k</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;

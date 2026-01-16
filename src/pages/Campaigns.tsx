import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, CheckCircle, Ban, Clock, Loader2 } from "lucide-react";
import { CampaignCardSkeleton } from "@/components/ui/card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarImageOptimized } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CampaignStats {
  total_submissions: number;
  approved_submissions: number;
  total_views: number;
}

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
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
  waitlist_questions: string[] | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string | null;
  creator_avatar?: string | null;
  stats?: CampaignStats;
  // User-specific status
  isMember?: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  waitlistStatus?: string | null;
}

const categories = ["All", "Gaming", "Fitness", "Technology", "Travel", "Food", "Fashion", "Sports", "Entertainment"];

const Campaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Waitlist modal state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [waitlistAnswers, setWaitlistAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [joiningCampaignId, setJoiningCampaignId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      // Fetch campaigns (no FK join - created_by references user_id not id)
      const { data: campaignsData, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const campaignIds = campaignsData.map(c => c.id);
      const creatorIds = campaignsData.map(c => c.created_by).filter(Boolean) as string[];

      // Fetch creator profiles separately
      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", creatorIds);
        
        if (profilesData) {
          profilesData.forEach(p => profilesMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }));
        }
      }

      // Show campaigns immediately with basic data (fast first paint)
      const initialCampaigns = campaignsData.map(campaign => {
        const creatorProfile = campaign.created_by ? profilesMap.get(campaign.created_by) : null;
        return {
          ...campaign,
          creator_name: creatorProfile?.display_name || "Zyrozo",
          creator_avatar: creatorProfile?.avatar_url || null,
          stats: { total_submissions: 0, approved_submissions: 0, total_views: 0 },
          isMember: false,
          isBanned: false,
          banReason: null,
          waitlistStatus: null,
        };
      });
      
      setCampaigns(initialCampaigns);
      setLoading(false);

      // Fetch user-specific data in background (only essential for logged-in users)
      if (user) {
        const [membersRes, bansRes, waitlistRes] = await Promise.all([
          supabase.from("campaign_members").select("campaign_id").eq("user_id", user.id).in("campaign_id", campaignIds),
          supabase.from("user_suspensions").select("campaign_id, reason").eq("user_id", user.id).eq("is_active", true).in("campaign_id", campaignIds),
          supabase.from("campaign_waitlist_requests").select("campaign_id, status").eq("user_id", user.id).in("campaign_id", campaignIds),
        ]);

        const membersSet = new Set((membersRes.data || []).map(m => m.campaign_id));
        const bansMap = new Map((bansRes.data || []).map(b => [b.campaign_id, b.reason]));
        const waitlistMap = new Map((waitlistRes.data || []).map(w => [w.campaign_id, w.status]));

        // Update with user-specific status
        setCampaigns(prev => prev.map(campaign => ({
          ...campaign,
          isMember: membersSet.has(campaign.id),
          isBanned: bansMap.has(campaign.id),
          banReason: bansMap.get(campaign.id) || null,
          waitlistStatus: waitlistMap.get(campaign.id) || null,
        })));
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setLoading(false);
    }
  };

  const handleJoinClick = (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (campaign.join_type === "waitlist") {
      setSelectedCampaign(campaign);
      setWaitlistAnswers(new Array(campaign.waitlist_questions?.length || 0).fill(""));
      setShowWaitlistModal(true);
    } else {
      handleDirectJoin(campaign);
    }
  };

  const handleDirectJoin = async (campaign: Campaign) => {
    if (!user) return;
    
    setJoiningCampaignId(campaign.id);
    try {
      const { error } = await supabase.from("campaign_members").insert({
        user_id: user.id,
        campaign_id: campaign.id
      });

      if (error) throw error;
      toast.success("Successfully joined!");
      
      // Update local state
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id ? { ...c, isMember: true } : c
      ));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to join campaign");
    } finally {
      setJoiningCampaignId(null);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!selectedCampaign || !user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_waitlist_requests").insert({
        user_id: user.id,
        campaign_id: selectedCampaign.id,
        answers: waitlistAnswers
      });

      if (error) throw error;
      toast.success("Application submitted!");
      setShowWaitlistModal(false);
      
      // Update local state
      setCampaigns(prev => prev.map(c => 
        c.id === selectedCampaign.id ? { ...c, waitlistStatus: "pending" } : c
      ));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
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

  const renderActionButton = (campaign: Campaign) => {
    const isJoining = joiningCampaignId === campaign.id;
    
    // Banned user - full width red button
    if (campaign.isBanned) {
      return (
        <Button 
          variant="destructive" 
          className="w-full h-12 text-base font-semibold"
          disabled
        >
          <Ban className="w-5 h-5 mr-2" />
          Banned from Campaign
        </Button>
      );
    }
    
    // Already a member or approved from waitlist - full width green button
    if (campaign.isMember || campaign.waitlistStatus === "approved") {
      return (
        <Button 
          className="w-full h-12 text-base font-semibold bg-success hover:bg-success/90 text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/c/${campaign.slug || campaign.id}`);
          }}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          View Campaign
        </Button>
      );
    }
    
    // Waitlist pending - full width amber button
    if (campaign.waitlistStatus === "pending") {
      return (
        <Button 
          variant="outline"
          className="w-full h-12 text-base font-semibold border-warning text-warning hover:bg-warning/10"
          disabled
        >
          <Clock className="w-5 h-5 mr-2" />
          Waitlisted - Pending Review
        </Button>
      );
    }
    
    // Waitlist rejected - full width red button
    if (campaign.waitlistStatus === "rejected") {
      return (
        <Button 
          variant="destructive"
          className="w-full h-12 text-base font-semibold"
          disabled
        >
          <Ban className="w-5 h-5 mr-2" />
          Application Rejected
        </Button>
      );
    }
    
    // Can join - full width primary button (Whop style)
    return (
      <Button 
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
        onClick={(e) => handleJoinClick(campaign, e)}
        disabled={isJoining}
      >
        {isJoining ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : campaign.join_type === "waitlist" ? (
          "Join Waitlist"
        ) : (
          "Join for free"
        )}
      </Button>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Active <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse our active campaigns and start earning from your content today
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
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
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CampaignCardSkeleton key={i} />
              ))}
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
                  <div key={campaign.id}>
                    <div className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all">
                      <Link to={`/c/${campaign.slug || campaign.id}`} className="block">
                        {/* Campaign Thumbnail - Prominent Display */}
                        <div className="relative aspect-video w-full overflow-hidden">
                          {campaign.thumbnail_url ? (
                            <img 
                              src={campaign.thumbnail_url} 
                              alt={campaign.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <span className="text-4xl font-bold text-muted-foreground">{campaign.name.charAt(0)}</span>
                            </div>
                          )}
                          {/* Badges Overlay */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <Badge className="bg-black/70 text-white border-0 text-xs">{campaign.campaign_type?.toUpperCase() || "UGC"}</Badge>
                            {campaign.category && <Badge className="bg-black/70 text-white border-0 text-xs">{campaign.category}</Badge>}
                          </div>
                          <span className="absolute top-3 right-3 text-xs text-white bg-black/50 px-2 py-1 rounded-full">{timeAgo} ago</span>
                        </div>

                        {/* Campaign Title & Creator */}
                        <div className="p-4">
                          <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
                            {campaign.name}
                          </h3>
                          <p className="text-primary font-semibold text-sm mt-1">
                            ${campaign.reward_per_1k_views} Per 1,000 Views
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Link 
                              to={campaign.created_by ? `/u/${campaign.creator_name}` : "#"}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {campaign.creator_name}
                            </Link>
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
                              <span className="font-bold text-lg">${(budgetSpent / 1000).toFixed(2)}k</span>
                              <span className="text-muted-foreground text-sm"> / ${(budgetTotal / 1000).toFixed(0)}k</span>
                            </div>
                            <div>
                              <span className="font-bold text-primary text-lg">${campaign.reward_per_1k_views}</span>
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
                            <p className="font-semibold text-sm">
                              {campaign.stats?.total_submissions ? (
                                `${Math.round((campaign.stats.approved_submissions / campaign.stats.total_submissions) * 100)}%`
                              ) : (
                                "N/A"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Views</p>
                            <p className="font-semibold text-sm">
                              {campaign.stats?.total_views ? (
                                campaign.stats.total_views >= 1000000
                                  ? `${(campaign.stats.total_views / 1000000).toFixed(1)}M`
                                  : campaign.stats.total_views >= 1000
                                  ? `${(campaign.stats.total_views / 1000).toFixed(1)}K`
                                  : campaign.stats.total_views.toString()
                              ) : (
                                "0"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Budget Left</p>
                            <p className="font-semibold text-sm text-success">${(budgetRemaining / 1000).toFixed(2)}k</p>
                          </div>
                        </div>
                      </Link>

                      {/* Action Button - Full Width Join/Waitlist/Banned (Whop Style) */}
                      <div className="p-4 border-t border-border">
                        {renderActionButton(campaign)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Apply to Join</DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  {selectedCampaign.thumbnail_url ? (
                    <img src={selectedCampaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedCampaign.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedCampaign.name}</p>
                  <p className="text-sm text-muted-foreground">${selectedCampaign.reward_per_1k_views} / 1K views</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Please answer the following questions to apply for this campaign.
              </p>
              
              {selectedCampaign.waitlist_questions?.map((q, i) => (
                <div key={i}>
                  <Label className="text-sm">
                    {q} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea 
                    value={waitlistAnswers[i] || ""} 
                    onChange={(e) => {
                      const newAnswers = [...waitlistAnswers];
                      newAnswers[i] = e.target.value;
                      setWaitlistAnswers(newAnswers);
                    }} 
                    className="mt-1"
                    rows={3}
                  />
                </div>
              ))}

              {(!selectedCampaign.waitlist_questions || selectedCampaign.waitlist_questions.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No questions required. Click submit to apply.
                </p>
              )}
            </div>
          )}

          <Button onClick={handleWaitlistSubmit} disabled={submitting} className="w-full mt-4" size="lg">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit Application"}
          </Button>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Campaigns;

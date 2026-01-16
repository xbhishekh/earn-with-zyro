import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Ban,
  Clock,
  Loader2,
  Zap,
  LogOut,
  User,
  Info,
  Upload,
  ExternalLink,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { CampaignChatSidebar } from "@/components/campaigns/CampaignChatSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  thumbnail_url: string | null;
  platforms: string[];
  category: string | null;
  campaign_type: string | null;
  reward_per_1k_views: number;
  min_payout: number | null;
  max_payout: number | null;
  budget_total: number | null;
  budget_spent: number | null;
  rules_guidelines: string | null;
  rules_link: string | null;
  status: string | null;
  join_type: string | null;
  waitlist_questions: string[];
}

interface Submission {
  id: string;
  video_url: string;
  social_link: string | null;
  status: string | null;
  views_count: number | null;
  estimated_earnings: number | null;
  created_at: string;
}

const CampaignDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("rewards");
  
  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  
  // Form data
  const [videoUrl, setVideoUrl] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [waitlistAnswers, setWaitlistAnswers] = useState<string[]>([]);

  // Track affiliate clicks from ref param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      const trackClick = async () => {
        try {
          await supabase.rpc('increment_affiliate_clicks', { link_code: refCode });
        } catch {
          // Silent fail
        }
      };
      trackClick();
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if ((id || slug) && user) {
      fetchCampaignData();
    }
  }, [id, slug, user, authLoading, navigate]);

  const fetchCampaignData = async () => {
    try {
      let campaignData;
      
      if (id) {
        const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).single();
        if (error) throw error;
        campaignData = data;
      } else if (slug) {
        const { data, error } = await supabase.from("campaigns").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        campaignData = data;
        if (!campaignData) throw new Error("Campaign not found");
      }
      setCampaign(campaignData as Campaign);
      setWaitlistAnswers(new Array(campaignData.waitlist_questions?.length || 0).fill(""));

      const campaignId = campaignData.id;

      const [memberRes, banRes, waitlistRes, submissionRes, roomRes] = await Promise.all([
        supabase.from("campaign_members").select("id").eq("user_id", user!.id).eq("campaign_id", campaignId).maybeSingle(),
        supabase.from("user_suspensions").select("reason").eq("user_id", user!.id).eq("campaign_id", campaignId).eq("is_active", true).maybeSingle(),
        supabase.from("campaign_waitlist_requests").select("status").eq("user_id", user!.id).eq("campaign_id", campaignId).maybeSingle(),
        supabase.from("submissions").select("*").eq("user_id", user!.id).eq("campaign_id", campaignId).order("created_at", { ascending: false }),
        supabase.from("chat_rooms").select("id").eq("campaign_id", campaignId).eq("type", "campaign").maybeSingle(),
      ]);

      setIsMember(!!memberRes.data);
      if (banRes.data) { setIsBanned(true); setBanReason(banRes.data.reason); }
      if (waitlistRes.data) setWaitlistStatus(waitlistRes.data.status);
      setSubmissions(submissionRes.data as Submission[] || []);
      if (roomRes.data) setChatRoomId(roomRes.data.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!campaign) return;
    
    if (campaign.join_type === "waitlist") {
      setShowWaitlistModal(true);
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase.from("campaign_members").insert({
        user_id: user!.id,
        campaign_id: campaign.id
      });

      if (error) throw error;
      toast.success("Successfully joined!");
      setIsMember(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to join campaign");
    } finally {
      setJoining(false);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!campaign) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_waitlist_requests").insert({
        user_id: user!.id,
        campaign_id: campaign.id,
        answers: waitlistAnswers
      });

      if (error) throw error;
      toast.success("Application submitted!");
      setShowWaitlistModal(false);
      setWaitlistStatus("pending");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmission = async () => {
    if (!socialLink || !campaign) {
      toast.error("Please provide the social media link");
      return;
    }

    setSubmitting(true);
    try {
      const { data: submissionData, error } = await supabase
        .from("submissions")
        .insert({
          user_id: user!.id,
          campaign_id: campaign.id,
          video_url: videoUrl || socialLink,
          social_link: socialLink
        })
        .select("id")
        .single();

      if (error) throw error;

      supabase.functions.invoke("notify-submission", {
        body: { submission_id: submissionData.id, video_url: videoUrl || socialLink, social_link: socialLink, campaign_id: campaign.id, user_id: user!.id }
      }).catch(() => {});

      toast.success("Submission sent for review!");
      setShowSubmitModal(false);
      setVideoUrl("");
      setSocialLink("");
      fetchCampaignData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  const budgetTotal = campaign.budget_total || 0;
  const budgetSpent = campaign.budget_spent || 0;
  const budgetPercent = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
  const canSubmit = isMember || waitlistStatus === "approved";

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("tiktok")) return "🎵";
    if (p.includes("youtube")) return "📺";
    if (p.includes("instagram")) return "📸";
    if (p.includes("twitter") || p.includes("x")) return "𝕏";
    if (p.includes("facebook")) return "📘";
    return "🌐";
  };

  const getSubmissionStatusIcon = (status: string | null) => {
    switch (status) {
      case "approved": case "paid": return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">Zyrozo</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard"><User className="w-4 h-4" /></Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back */}
        <button onClick={() => navigate("/campaigns")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Campaign Title */}
        <h1 className="font-display text-xl md:text-2xl font-bold mb-6">
          {campaign.name} - ₹{campaign.reward_per_1k_views} per 1,000 views
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Thumbnail */}
            {campaign.thumbnail_url && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden">
                <img src={campaign.thumbnail_url} alt={campaign.name} className="w-full aspect-video object-cover" />
              </motion.div>
            )}

            {/* Info Banner */}
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                Only views after you submit count towards payout. Submit as soon as you post to get paid for all of your views.
              </p>
            </div>

            {/* Budget Progress - Whop Style */}
            {budgetTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">PAID OUT</span>
                  <span className="font-medium">{budgetPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>₹{budgetSpent.toLocaleString()} of ₹{budgetTotal.toLocaleString()} paid out</span>
                </div>
                <Progress value={budgetPercent} className="h-2" />
              </div>
            )}

            {/* Stats Grid - Whop Style */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Reward</p>
                <Badge className="bg-primary text-primary-foreground">₹{campaign.reward_per_1k_views} / 1K</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Type</p>
                <Badge variant="outline">{campaign.campaign_type?.toUpperCase() || "UGC"}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Min Payout</p>
                <Badge variant="outline">₹{campaign.min_payout || 0}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Max Payout</p>
                <Badge variant="outline">₹{campaign.max_payout || "∞"}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Category</p>
                <Badge variant="outline">{campaign.category || "General"}</Badge>
              </div>
            </div>

            {/* Platforms */}
            {campaign.platforms && campaign.platforms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase">Platforms:</span>
                <div className="flex gap-2">
                  {campaign.platforms.map((p) => (
                    <span key={p} className="text-lg" title={p}>{getPlatformIcon(p)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Info & Action */}
            <div className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">{campaign.name}</h2>
                <p className="text-sm text-muted-foreground">₹{campaign.reward_per_1k_views} / 1K</p>
              </div>
              
              {/* Banned State */}
              {isBanned ? (
                <div className="flex items-center gap-2 text-destructive">
                  <Ban className="w-5 h-5" />
                  <div className="text-right">
                    <p className="font-medium text-sm">You are banned</p>
                    {banReason && <p className="text-xs text-muted-foreground">{banReason}</p>}
                  </div>
                </div>
              ) : !canSubmit ? (
                waitlistStatus === "pending" ? (
                  <div className="flex items-center gap-2 text-warning">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Application Pending</span>
                  </div>
                ) : waitlistStatus === "rejected" ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Application Rejected</span>
                  </div>
                ) : (
                  <Button onClick={handleJoin} disabled={joining} className="bg-primary hover:bg-primary/90">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : campaign.join_type === "waitlist" ? "Apply to Join" : "Join for free"}
                  </Button>
                )
              ) : (
                <Button onClick={() => setShowSubmitModal(true)} className="bg-primary hover:bg-primary/90">
                  Submit
                </Button>
              )}
            </div>

            {/* Tabs - Rewards / My Submissions */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full max-w-xs">
                <TabsTrigger value="rewards" className="flex-1">Rewards</TabsTrigger>
                <TabsTrigger value="submissions" className="flex-1">My submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="rewards" className="mt-4 space-y-4">
                {/* Description */}
                {campaign.description && (
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="font-medium mb-2">About this campaign</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                  </div>
                )}

                {/* Rules */}
                {campaign.rules_guidelines && (
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="font-medium mb-2">Rules & Guidelines</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.rules_guidelines}</p>
                    {campaign.rules_link && (
                      <a href={campaign.rules_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View full guidelines
                      </a>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                {submissions.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No submissions yet</p>
                    {canSubmit && (
                      <Button onClick={() => setShowSubmitModal(true)} className="mt-4" variant="outline">
                        Create your first submission
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSubmissionStatusIcon(sub.status)}
                            <div>
                              <a href={sub.social_link || sub.video_url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-primary flex items-center gap-1">
                                View post <ExternalLink className="w-3 h-3" />
                              </a>
                              <p className="text-xs text-muted-foreground">{format(new Date(sub.created_at), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={sub.status === "approved" || sub.status === "paid" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                              {sub.status || "pending"}
                            </Badge>
                            {(sub.views_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                                <Eye className="w-3 h-3" /> {sub.views_count?.toLocaleString()}
                              </div>
                            )}
                            {(sub.estimated_earnings ?? 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-success font-medium mt-1 justify-end">
                                <DollarSign className="w-3 h-3" /> ₹{Number(sub.estimated_earnings).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <CampaignChatSidebar
                campaignId={campaign.id}
                campaignName={campaign.name}
                chatRoomId={chatRoomId}
                isMember={canSubmit}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Submit Modal - Whop Style */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Create submission</DialogTitle>
          </DialogHeader>
          
          {/* Info Banner */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              Only views after you submit count towards payout. Submit as soon as you post to get paid for all of your views.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Submit your social media post</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your post's link and the original image or video below. Once approved, you'll start earning rewards based on the views your content generates.
              </p>
            </div>

            <div>
              <Label className="text-sm">
                Provide link <span className="text-destructive">*</span>
              </Label>
              <Input 
                value={socialLink} 
                onChange={(e) => setSocialLink(e.target.value)} 
                placeholder="https://www.tiktok.com/@username/video/1234567890" 
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">
                Media (Optional)
              </Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Upload the original media file you posted (not a screenshot). For videos, upload the video file. For posts with multiple files, upload the first file.
                </p>
                <Input 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)} 
                  placeholder="Paste Google Drive or Dropbox link..." 
                  className="mb-3"
                />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  <span>Or paste a file link above</span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmission} disabled={submitting || !socialLink.trim()} className="w-full mt-4" size="lg">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Apply to Join</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please answer the following questions to apply for this campaign.
            </p>
            
            {campaign.waitlist_questions?.map((q, i) => (
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

            {(!campaign.waitlist_questions || campaign.waitlist_questions.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No questions required. Click submit to apply.
              </p>
            )}
          </div>

          <Button onClick={handleWaitlistSubmit} disabled={submitting} className="w-full mt-4" size="lg">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit Application"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetail;

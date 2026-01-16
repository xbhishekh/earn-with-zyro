import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  FileVideo, 
  ExternalLink,
  Ban,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  Zap,
  LogOut,
  User
} from "lucide-react";
import { CampaignChatSidebar } from "@/components/campaigns/CampaignChatSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  platforms: string[];
  category: string | null;
  campaign_type: string | null;
  reward_per_1k_views: number;
  min_payout: number | null;
  max_payout: number | null;
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
  const { id } = useParams<{ id: string }>();
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
  
  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [videoUrl, setVideoUrl] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [waitlistAnswers, setWaitlistAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (id && user) {
      fetchCampaignData();
    }
  }, [id, user, authLoading, navigate]);

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData as Campaign);
      setWaitlistAnswers(new Array(campaignData.waitlist_questions?.length || 0).fill(""));

      // Check if member
      const { data: memberData } = await supabase
        .from("campaign_members")
        .select("id")
        .eq("user_id", user!.id)
        .eq("campaign_id", id)
        .maybeSingle();

      setIsMember(!!memberData);

      // Check ban status
      const { data: banData } = await supabase
        .from("user_suspensions")
        .select("reason")
        .eq("user_id", user!.id)
        .eq("campaign_id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (banData) {
        setIsBanned(true);
        setBanReason(banData.reason);
      }

      // Check waitlist status
      const { data: waitlistData } = await supabase
        .from("campaign_waitlist_requests")
        .select("status")
        .eq("user_id", user!.id)
        .eq("campaign_id", id)
        .maybeSingle();

      if (waitlistData) {
        setWaitlistStatus(waitlistData.status);
      }

      // Fetch submissions
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });

      setSubmissions(submissionData as Submission[] || []);

      // Fetch or create chat room
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("campaign_id", id)
        .eq("type", "campaign")
        .maybeSingle();

      if (existingRoom) {
        setChatRoomId(existingRoom.id);
      } else {
        // Auto-create chat room for campaign (only admins can do this via RLS, so we try)
        const { data: newRoom } = await supabase
          .from("chat_rooms")
          .insert({ 
            campaign_id: id, 
            type: "campaign",
            name: `${campaignData.name} Chat`
          })
          .select("id")
          .maybeSingle();

        if (newRoom) {
          setChatRoomId(newRoom.id);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (campaign?.join_type === "waitlist") {
      setShowWaitlistModal(true);
      return;
    }

    try {
      const { error } = await supabase.from("campaign_members").insert({
        user_id: user!.id,
        campaign_id: id
      });

      if (error) throw error;
      toast.success("Joined campaign!");
      setIsMember(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to join campaign");
    }
  };

  const handleWaitlistSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_waitlist_requests").insert({
        user_id: user!.id,
        campaign_id: id,
        answers: waitlistAnswers
      });

      if (error) throw error;
      toast.success("Waitlist application submitted!");
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
    if (!videoUrl || !socialLink) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("submissions").insert({
        user_id: user!.id,
        campaign_id: id,
        video_url: videoUrl,
        social_link: socialLink
      });

      if (error) throw error;
      toast.success("Submission sent!");
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

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out");
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved": case "paid": return <Badge className="bg-success/10 text-success border-success">{status}</Badge>;
      case "rejected": return <Badge className="bg-destructive/10 text-destructive border-destructive">{status}</Badge>;
      default: return <Badge className="bg-warning/10 text-warning border-warning">pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 gradient-bg rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">Zyrozo</span>
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile"><User className="w-4 h-4 mr-2" />Profile</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Campaigns
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
              {campaign.thumbnail_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={campaign.thumbnail_url} alt={campaign.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {campaign.platforms?.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                  {campaign.category && <Badge variant="outline">{campaign.category}</Badge>}
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">{campaign.name}</h1>
                <p className="text-muted-foreground mb-6">{campaign.description}</p>

                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    <span className="font-bold">₹{campaign.reward_per_1k_views}</span>
                    <span className="text-muted-foreground">/1K views</span>
                  </div>
                  {campaign.max_payout && (
                    <div className="text-muted-foreground">
                      Max payout: ₹{campaign.max_payout}
                    </div>
                  )}
                </div>

                {/* Banned State */}
                {isBanned && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Ban className="w-6 h-6 text-destructive" />
                      <div>
                        <p className="font-medium text-destructive">You are banned from this campaign</p>
                        {banReason && <p className="text-sm text-muted-foreground">{banReason}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Join/Submit Actions */}
                {!isBanned && (
                  <div className="flex gap-4">
                    {!isMember && waitlistStatus !== "pending" && waitlistStatus !== "approved" && (
                      <Button variant="hero" size="lg" onClick={handleJoin}>
                        {campaign.join_type === "waitlist" ? "Apply to Join" : "Join Campaign"}
                      </Button>
                    )}
                    {waitlistStatus === "pending" && (
                      <div className="flex items-center gap-2 text-warning">
                        <Clock className="w-5 h-5" />
                        <span>Waitlist application pending...</span>
                      </div>
                    )}
                    {(isMember || waitlistStatus === "approved") && (
                      <Button variant="hero" size="lg" onClick={() => setShowSubmitModal(true)}>
                        <Send className="w-5 h-5 mr-2" />Submit Clip
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Rules */}
            {campaign.rules_guidelines && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-xl font-bold mb-4">Rules & Guidelines</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.rules_guidelines}</p>
                {campaign.rules_link && (
                  <a href={campaign.rules_link} target="_blank" className="inline-flex items-center gap-2 text-primary mt-4 hover:underline">
                    <ExternalLink className="w-4 h-4" />View full guidelines
                  </a>
                )}
              </motion.div>
            )}

            {/* My Submissions */}
            {submissions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-display text-xl font-bold mb-4">My Submissions</h2>
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-4">
                        <FileVideo className="w-8 h-8 text-primary" />
                        <div>
                          <a href={sub.video_url} target="_blank" className="font-medium hover:text-primary">View Submission</a>
                          <p className="text-sm text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(sub.status)}
                        {sub.views_count && sub.views_count > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">{sub.views_count.toLocaleString()} views</p>
                        )}
                        {sub.estimated_earnings && Number(sub.estimated_earnings) > 0 && (
                          <p className="text-sm text-success font-medium">₹{Number(sub.estimated_earnings).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Chat & Announcements */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CampaignChatSidebar
                campaignId={id!}
                campaignName={campaign.name}
                chatRoomId={chatRoomId}
                isMember={isMember || waitlistStatus === "approved"}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Submit Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Clip</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Video URL (Google Drive, Dropbox, etc.)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <Label>Social Media Link (where you posted)</Label>
              <Input value={socialLink} onChange={(e) => setSocialLink(e.target.value)} placeholder="https://tiktok.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button onClick={handleSubmission} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply to Join</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {campaign.waitlist_questions?.map((q, i) => (
              <div key={i}>
                <Label>{q}</Label>
                <Textarea value={waitlistAnswers[i] || ""} onChange={(e) => {
                  const newAnswers = [...waitlistAnswers];
                  newAnswers[i] = e.target.value;
                  setWaitlistAnswers(newAnswers);
                }} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaitlistModal(false)}>Cancel</Button>
            <Button onClick={handleWaitlistSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetail;

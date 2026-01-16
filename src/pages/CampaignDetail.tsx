import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
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
  AlertCircle,
  Instagram,
  Link as LinkIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { CampaignChatSidebar } from "@/components/campaigns/CampaignChatSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  video_url: string | null;
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
  created_by: string | null;
}

interface CampaignAsset {
  id: string;
  asset_type: 'video' | 'image' | 'file' | 'link';
  title: string;
  description: string | null;
  url: string;
  file_name: string | null;
  file_size: number | null;
  is_required: boolean;
  sort_order: number;
}

interface CreatorProfile {
  display_name: string | null;
  avatar_url: string | null;
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
  const [campaignAssets, setCampaignAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("rewards");
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [videoUrl, setVideoUrl] = useState("");
  const [socialLink, setSocialLink] = useState("");
  
  // Video upload state
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

      const campaignId = campaignData.id;

      // Fetch creator profile if created_by exists
      if (campaignData.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", campaignData.created_by)
          .single();
        if (profile) {
          setCreatorProfile(profile);
        }
      }

      const [memberRes, submissionRes, roomRes, assetsRes] = await Promise.all([
        supabase.from("campaign_members").select("id").eq("user_id", user!.id).eq("campaign_id", campaignId).maybeSingle(),
        supabase.from("submissions").select("*").eq("user_id", user!.id).eq("campaign_id", campaignId).order("created_at", { ascending: false }),
        supabase.from("chat_rooms").select("id").eq("campaign_id", campaignId).eq("type", "campaign").maybeSingle(),
        supabase.from("campaign_assets").select("*").eq("campaign_id", campaignId).order("sort_order", { ascending: true }),
      ]);

      setIsMember(!!memberRes.data);
      setSubmissions(submissionRes.data as Submission[] || []);
      setCampaignAssets(assetsRes.data as CampaignAsset[] || []);
      if (roomRes.data) setChatRoomId(roomRes.data.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload MP4, WebM, MOV or AVI video");
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const clearSelectedVideo = () => {
    setSelectedVideo(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!selectedVideo || !user || !campaign) return null;

    setUploadingVideo(true);
    setUploadProgress(0);
    
    try {
      const fileExt = selectedVideo.name.split(".").pop();
      const fileName = `${campaign.id}/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(fileName, selectedVideo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("submissions")
        .getPublicUrl(fileName);

      setUploadProgress(100);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmission = async () => {
    if (!socialLink || !campaign) {
      toast.error("Please provide the social media link");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedVideoUrl = videoUrl;
      
      // Upload video from device if selected
      if (selectedVideo) {
        const url = await uploadVideo();
        if (url) {
          uploadedVideoUrl = url;
        }
      }

      const { data: submissionData, error } = await supabase
        .from("submissions")
        .insert({
          user_id: user!.id,
          campaign_id: campaign.id,
          video_url: uploadedVideoUrl || socialLink,
          social_link: socialLink
        })
        .select("id")
        .single();

      if (error) throw error;

      supabase.functions.invoke("notify-submission", {
        body: { submission_id: submissionData.id, video_url: uploadedVideoUrl || socialLink, social_link: socialLink, campaign_id: campaign.id, user_id: user!.id }
      }).catch(() => {});

      toast.success("Submission sent for review!");
      setShowSubmitModal(false);
      setVideoUrl("");
      setSocialLink("");
      clearSelectedVideo();
      fetchCampaignData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // Parse rules_guidelines into requirement pills
  const parseRequirements = (guidelines: string | null): string[] => {
    if (!guidelines) return [];
    // Split by newlines, filter empty lines, trim whitespace
    return guidelines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
  };

  // Extract URLs from rules_guidelines for assets section
  const extractAssets = (guidelines: string | null): { title: string; url: string; icon: string }[] => {
    if (!guidelines) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = guidelines.match(urlRegex) || [];
    
    return matches.map(url => {
      let icon = "🔗";
      let title = url;
      
      if (url.includes("instagram.com")) {
        icon = "📸";
        title = "Instagram Link";
      } else if (url.includes("tiktok.com")) {
        icon = "🎵";
        title = "TikTok Link";
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        icon = "📺";
        title = "YouTube Link";
      } else if (url.includes("drive.google.com")) {
        icon = "📁";
        title = "Google Drive Asset";
      } else if (url.includes("dropbox.com")) {
        icon = "📦";
        title = "Dropbox Asset";
      } else {
        // Try to extract domain name
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          title = domain;
        } catch {
          title = "External Link";
        }
      }
      
      return { title, url, icon };
    });
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

  // If not a member, redirect back to campaigns page (join/waitlist happens there)
  if (!isMember) {
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
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              {campaign.thumbnail_url ? (
                <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">{campaign.name.charAt(0)}</span>
              )}
            </div>
            
            <h1 className="font-display text-2xl font-bold mb-2">{campaign.name}</h1>
            <p className="text-muted-foreground mb-6">
              You need to join this campaign first to view its content and submit.
            </p>

            <Button onClick={() => navigate("/campaigns")} className="w-full" size="lg">
              Go to Campaigns to Join
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const budgetTotal = campaign.budget_total || 0;
  const budgetSpent = campaign.budget_spent || 0;
  const budgetPercent = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
  const requirements = parseRequirements(campaign.rules_guidelines);
  const assets = extractAssets(campaign.rules_guidelines);

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

      <main className="container mx-auto px-4 py-6 max-w-4xl pb-28">
        {/* Back Button & Title - Whop Style */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate("/campaigns")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="font-display font-bold text-lg">{campaign.name}</h1>
        </div>

        {/* Platforms Icons Row */}
        {campaign.platforms && campaign.platforms.length > 0 && (
          <div className="flex gap-2 mb-6">
            {campaign.platforms.map((p) => (
              <span key={p} className="text-2xl" title={p}>{getPlatformIcon(p)}</span>
            ))}
          </div>
        )}

        {/* Video/Thumbnail Preview - Whop Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative rounded-2xl overflow-hidden group">
            {campaign.video_url ? (
              <>
                {showVideoPreview ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={campaign.video_url}
                      className="w-full aspect-video object-cover"
                      muted={isMuted}
                      loop
                      playsInline
                      autoPlay
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            onClick={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pause();
                                } else {
                                  videoRef.current.play();
                                }
                              }
                            }}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsMuted(!isMuted)}
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setShowVideoPreview(true)}
                  >
                    {campaign.thumbnail_url ? (
                      <img 
                        src={campaign.thumbnail_url} 
                        alt={campaign.name} 
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-primary ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 bg-black/70 text-white border-0">
                      <Video className="w-3 h-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                )}
              </>
            ) : campaign.thumbnail_url ? (
              <img 
                src={campaign.thumbnail_url} 
                alt={campaign.name} 
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl font-bold text-muted-foreground">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Banner - Yellow Warning Style */}
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning">
            Only views after you submit count towards payout. Submit as soon as you post to get paid for all of your views.
          </p>
        </div>

        {/* Budget Progress - Whop Style */}
        {budgetTotal > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground uppercase text-xs">PAID OUT</span>
              <span className="font-medium">{budgetPercent}%</span>
            </div>
            <p className="text-sm mb-2">
              ${budgetSpent.toLocaleString()} of ${budgetTotal.toLocaleString()} paid out
            </p>
            <Progress value={budgetPercent} className="h-2" />
          </div>
        )}

        {/* Stats Grid - Whop Style */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-border mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Reward</p>
            <Badge className="bg-primary text-primary-foreground">${campaign.reward_per_1k_views} / 1K</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Type</p>
            <Badge variant="outline">{campaign.campaign_type?.toUpperCase() || "UGC"}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Min Payout</p>
            <Badge variant="outline">${campaign.min_payout || 0}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Max Payout</p>
            <Badge variant="outline">${campaign.max_payout || "∞"}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Category</p>
            <Badge variant="outline">{campaign.category || "General"}</Badge>
          </div>
        </div>

        {/* Requirements Section - Whop Style Pills */}
        {requirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs text-muted-foreground uppercase mb-3">REQUIREMENTS</h3>
            <div className="flex flex-wrap gap-2">
              {requirements.map((req, i) => (
                <span 
                  key={i} 
                  className="inline-block bg-muted/80 text-foreground text-sm px-4 py-2 rounded-lg border border-border"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assets Section - From Database */}
        {(campaignAssets.length > 0 || assets.length > 0) && (
          <div className="mb-6">
            <h3 className="text-xs text-muted-foreground uppercase mb-3">ASSETS</h3>
            <div className="space-y-2">
              {/* Database assets first */}
              {campaignAssets.map((asset) => {
                const getAssetIcon = () => {
                  switch (asset.asset_type) {
                    case 'video': return <Video className="w-5 h-5 text-primary" />;
                    case 'image': return <ImageIcon className="w-5 h-5 text-primary" />;
                    case 'file': return <FileText className="w-5 h-5 text-primary" />;
                    case 'link': return <LinkIcon className="w-5 h-5 text-primary" />;
                    default: return <ExternalLink className="w-5 h-5 text-primary" />;
                  }
                };
                
                const formatFileSize = (bytes: number | null) => {
                  if (!bytes) return '';
                  if (bytes < 1024) return `${bytes} B`;
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                };

                return (
                  <a
                    key={asset.id}
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {getAssetIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground group-hover:text-primary truncate">{asset.title}</p>
                        {asset.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {asset.description || asset.file_name || asset.url}
                        {asset.file_size && ` • ${formatFileSize(asset.file_size)}`}
                      </p>
                    </div>
                    {asset.asset_type === 'file' ? (
                      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </a>
                );
              })}
              
              {/* Fallback: Legacy assets from rules_guidelines */}
              {campaignAssets.length === 0 && assets.map((asset, i) => (
                <a
                  key={i}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
                >
                  <span className="text-2xl">{asset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary group-hover:underline truncate">{asset.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{asset.url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Rules Link if provided */}
        {campaign.rules_link && (
          <div className="mb-6">
            <a
              href={campaign.rules_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
            >
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <p className="font-medium text-primary group-hover:underline">Full Guidelines & Rules</p>
                <p className="text-xs text-muted-foreground">View detailed campaign rules</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        )}

        {/* Disclaimer - Whop Style */}
        <div className="mb-6">
          <h3 className="text-xs text-muted-foreground uppercase mb-2">DISCLAIMER</h3>
          <p className="text-sm text-muted-foreground">
            Creators may reject submissions that don't meet requirements. By submitting, you grant full usage rights and agree to follow the platform guidelines.
          </p>
        </div>

        {/* Tabs - My Submissions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-xs">
            <TabsTrigger value="rewards" className="flex-1">About</TabsTrigger>
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

            {/* Campaign Chat */}
            {chatRoomId && (
              <CampaignChatSidebar
                campaignId={campaign.id}
                campaignName={campaign.name}
                chatRoomId={chatRoomId}
                isMember={true}
              />
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-4">
            {submissions.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No submissions yet</p>
                <Button onClick={() => setShowSubmitModal(true)} className="mt-4" variant="outline">
                  Create your first submission
                </Button>
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
                            <DollarSign className="w-3 h-3" /> ${Number(sub.estimated_earnings).toLocaleString()}
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
      </main>

      {/* Sticky Bottom Bar - Whop Style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">${campaign.reward_per_1k_views} / 1K</p>
            </div>
            
            <Button onClick={() => setShowSubmitModal(true)} size="lg" className="bg-primary hover:bg-primary/90 px-8 rounded-xl">
              Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Modal - Whop Style with Video Upload */}
      <Dialog open={showSubmitModal} onOpenChange={(open) => {
        setShowSubmitModal(open);
        if (!open) clearSelectedVideo();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Create submission</DialogTitle>
          </DialogHeader>
          
          {/* Hidden file input for video */}
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoSelect}
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
          />
          
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
                Share your post's link and upload the original video below. Once approved, you'll start earning rewards based on the views your content generates.
              </p>
            </div>

            <div>
              <Label className="text-sm">
                Social Media Link <span className="text-destructive">*</span>
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
                Upload Video <span className="text-muted-foreground">(Recommended)</span>
              </Label>
              
              {selectedVideo ? (
                <div className="mt-2 border border-border rounded-xl overflow-hidden">
                  {videoPreviewUrl && (
                    <video 
                      src={videoPreviewUrl} 
                      className="w-full max-h-48 object-contain bg-black"
                      controls
                    />
                  )}
                  <div className="p-3 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{selectedVideo.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearSelectedVideo}
                      className="shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  {uploadingVideo && (
                    <div className="px-3 pb-3">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload video</p>
                  <p className="text-xs text-muted-foreground">
                    MP4, WebM, MOV, AVI (max 100MB)
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              — OR paste a link —
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">
                Video URL (Google Drive, Dropbox, etc.)
              </Label>
              <Input 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                placeholder="https://drive.google.com/..." 
                className="mt-1"
                disabled={!!selectedVideo}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmission} 
            disabled={submitting || uploadingVideo || !socialLink.trim()} 
            className="w-full mt-4" 
            size="lg"
          >
            {submitting || uploadingVideo ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {uploadingVideo ? "Uploading..." : "Submitting..."}</>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetail;

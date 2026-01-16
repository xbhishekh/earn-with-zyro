import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, ExternalLink, Eye, Sparkles, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ApprovedSubmission {
  id: string;
  video_url: string;
  social_link: string | null;
  views_count: number | null;
  estimated_earnings: number | null;
  created_at: string;
  campaign: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    category: string | null;
  } | null;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Gallery = () => {
  const [submissions, setSubmissions] = useState<ApprovedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedSubmissions();
  }, []);

  const fetchApprovedSubmissions = async () => {
    try {
      // Fetch approved/paid submissions with campaign and profile data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("id, video_url, social_link, views_count, estimated_earnings, created_at, campaign_id, user_id")
        .in("status", ["approved", "paid"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (submissionsError) throw submissionsError;

      // Fetch campaigns and profiles separately
      const campaignIds = [...new Set(submissionsData?.map(s => s.campaign_id) || [])];
      const userIds = [...new Set(submissionsData?.map(s => s.user_id) || [])];

      const [campaignsRes, profilesRes] = await Promise.all([
        supabase.from("campaigns").select("id, name, thumbnail_url, category").in("id", campaignIds),
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
      ]);

      const campaignsMap = new Map((campaignsRes.data || []).map(c => [c.id, c]));
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));

      const enrichedSubmissions: ApprovedSubmission[] = (submissionsData || []).map(s => ({
        ...s,
        campaign: campaignsMap.get(s.campaign_id) || null,
        profile: profilesMap.get(s.user_id) || null
      }));

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVideoThumbnail = (url: string): string | null => {
    // Extract YouTube thumbnail
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
    }
    return null;
  };

  const formatViews = (views: number | null): string => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Creator Showcase</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Creator <span className="gradient-text">Gallery</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Explore approved content from our talented creators. Get inspired and see what's trending!
            </p>
          </motion.div>

          {/* Stats Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 mb-10 flex flex-wrap justify-center gap-8"
          >
            <div className="text-center">
              <p className="font-display text-3xl font-bold gradient-text">{submissions.length}</p>
              <p className="text-sm text-muted-foreground">Approved Videos</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-success">
                {formatViews(submissions.reduce((sum, s) => sum + (s.views_count || 0), 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">
                {new Set(submissions.map(s => s.profile?.username)).size}
              </p>
              <p className="text-sm text-muted-foreground">Active Creators</p>
            </div>
          </motion.div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No approved content yet</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to get featured!</p>
              <Button variant="hero" className="mt-6" asChild>
                <Link to="/campaigns">Browse Campaigns</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {submissions.map((submission, index) => {
                const videoThumbnail = getVideoThumbnail(submission.video_url);
                const thumbnailUrl = videoThumbnail || submission.campaign?.thumbnail_url;
                
                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all"
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <Play className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={submission.social_link || submission.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Play className="w-6 h-6 text-white ml-1" />
                        </a>
                      </div>

                      {/* Views Badge */}
                      {submission.views_count && submission.views_count > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/60 backdrop-blur-sm border-0 text-white">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatViews(submission.views_count)}
                          </Badge>
                        </div>
                      )}

                      {/* Campaign Badge */}
                      {submission.campaign?.category && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                            {submission.campaign.category}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Creator Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {submission.profile?.avatar_url ? (
                            <img 
                              src={submission.profile.avatar_url} 
                              alt="Creator" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center gradient-bg text-white text-xs font-bold">
                              {(submission.profile?.display_name || submission.profile?.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            @{submission.profile?.username || submission.profile?.display_name || "creator"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Campaign Name */}
                      <Link 
                        to={`/campaigns/${submission.campaign?.id}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {submission.campaign?.name || "Campaign"}
                      </Link>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1" 
                          asChild
                        >
                          <a 
                            href={submission.social_link || submission.video_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Watch
                          </a>
                        </Button>
                      </div>
                    </div>
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

export default Gallery;
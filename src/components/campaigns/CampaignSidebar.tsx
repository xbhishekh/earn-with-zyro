import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Megaphone, 
  ChevronDown, 
  ChevronRight,
  Lock,
  FileText,
  Star,
  Flag,
  X,
  Loader2,
  ClipboardList,
  ArrowLeft,
  ExternalLink,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Instagram,
  Video,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { AnnouncementsList } from '@/components/announcements/AnnouncementsList';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipDetailsModal } from '@/components/submissions/ClipDetailsModal';

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
  rules_guidelines: string | null;
  reward_per_1k_views?: number;
}

interface CampaignSidebarProps {
  campaign: Campaign;
  chatRoomId: string | null;
  isMember: boolean;
  memberCount?: number;
  submissions?: Submission[];
  onOpenChat?: () => void;
  onOpenSubmissions?: () => void;
  onOpenAnnouncements?: () => void;
  onSwitchToSubmissionsTab?: () => void;
  onBackToDetails?: () => void;
  activeView?: 'details' | 'chat' | 'submissions' | 'announcements';
}

interface Submission {
  id: string;
  video_url: string;
  social_link: string | null;
  status: string | null;
  views_count: number | null;
  estimated_earnings: number | null;
  created_at: string;
  approved_at?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  campaign_id?: string;
}

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const CampaignSidebar = ({ 
  campaign, 
  chatRoomId,
  isMember,
  memberCount = 0,
  submissions = [],
  onOpenChat,
  onOpenSubmissions,
  onOpenAnnouncements,
  onSwitchToSubmissionsTab,
  onBackToDetails,
  activeView = 'details'
}: CampaignSidebarProps) => {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportedUsername, setReportedUsername] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    important: true,
    submissions: false
  });

  // Presence tracking for online count
  useEffect(() => {
    if (!user || !isMember) return;

    const channel = supabase.channel(`campaign-presence-${campaign.id}`, {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign.id, user, isMember]);

  const submitReport = async () => {
    if (!user || !reportedUserId || !reportReason) {
      toast.error('Please select a reason for the report');
      return;
    }

    setSubmittingReport(true);
    try {
      const { error } = await supabase.from('user_reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        campaign_id: campaign.id,
        reason: reportReason,
        details: reportDetails || null
      });

      if (error) throw error;

      toast.success('Report submitted successfully');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      setReportedUserId('');
      setReportedUsername('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Campaign Header - Whop Style Full-Width Banner (24% of sidebar) */}
        <div className="relative">
          {/* Full-Bleed Hero Banner - Edge to Edge */}
          <div className="h-[24vh] min-h-[140px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden flex items-center justify-center relative">
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-zinc-900 to-secondary/30" />
            
            {campaign.thumbnail_url ? (
              <img 
                src={campaign.thumbnail_url} 
                alt={campaign.name}
                className="w-full h-full object-contain relative z-10"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80" />
            )}
            {/* Gradient Overlay - Subtle at top for name visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
            
            {/* Campaign Name at Top - Like Whop */}
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm shrink-0">
                {campaign.thumbnail_url ? (
                  <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{campaign.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-sm text-white truncate drop-shadow-lg">{campaign.name}</h2>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                  <span className="text-xs text-white/80">{onlineCount} online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="px-4 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1.5">Rate this campaign</p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className="h-4 w-4 text-muted-foreground/30 cursor-pointer hover:text-warning transition-colors" 
              />
            ))}
          </div>
        </div>

        {/* Important Section */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection('important')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Important</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedSections.important ? '' : '-rotate-90'}`} />
          </button>
          
          <AnimatePresence>
            {expandedSections.important && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="px-2 pb-2 space-y-0.5">
                  {/* Community Rules */}
                  <button
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Community Rules</span>
                  </button>
                  
                  {/* Announcements */}
                  <button
                    onClick={onOpenAnnouncements}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Megaphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Announcements</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* My Submissions Section - Whop Style List */}
        {submissions.length > 0 && (
          <div className="border-b border-border">
            <button
              onClick={onSwitchToSubmissionsTab}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Submissions</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            
            <div className="px-3 pb-3 space-y-2">
              {submissions.slice(0, 5).map((sub) => (
                <a
                  key={sub.id}
                  href={sub.social_link || sub.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {sub.status === 'approved' || sub.status === 'paid' ? (
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      ) : sub.status === 'rejected' ? (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium flex items-center gap-1">
                          View post <ExternalLink className="w-3 h-3" />
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge 
                        variant={sub.status === 'paid' ? 'default' : sub.status === 'approved' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}
                        className={`text-xs ${sub.status === 'paid' ? 'bg-primary' : ''}`}
                      >
                        {sub.status || 'pending'}
                      </Badge>
                      {(sub.views_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                          <Eye className="w-3 h-3" /> {sub.views_count?.toLocaleString()}
                        </div>
                      )}
                      {(sub.estimated_earnings ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-success font-medium justify-end">
                          ${Number(sub.estimated_earnings).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
              {submissions.length > 5 && (
                <button
                  onClick={onSwitchToSubmissionsTab}
                  className="w-full text-center text-xs text-primary hover:underline py-1"
                >
                  View all {submissions.length} submissions
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat Section - Whop Style */}
        <div>
          <div className="px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chat</span>
          </div>
          
          <div className="px-2 pb-2">
            {/* Chat - Opens fullscreen */}
            <button
              onClick={onOpenChat}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report User Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Report User
            </DialogTitle>
            <DialogDescription>
              Report @{reportedUsername} for violating community guidelines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or misleading content</SelectItem>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="scam">Scam or fraud</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional details (optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitReport}
                disabled={!reportReason || submittingReport}
                variant="destructive"
              >
                {submittingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Fullscreen Chat View Component
export const FullscreenChatView = ({
  campaign,
  chatRoomId: initialChatRoomId,
  onClose
}: {
  campaign: Campaign;
  chatRoomId: string | null;
  onClose: () => void;
}) => {
  const [chatRoomId, setChatRoomId] = useState<string | null>(initialChatRoomId);
  const [loading, setLoading] = useState(!initialChatRoomId);

  // Create or fetch chat room if not provided
  useEffect(() => {
    if (initialChatRoomId) {
      setChatRoomId(initialChatRoomId);
      setLoading(false);
      return;
    }

    const ensureChatRoom = async () => {
      // Try to find existing chat room
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('type', 'campaign')
        .maybeSingle();

      if (existingRoom) {
        setChatRoomId(existingRoom.id);
      } else {
        // Create new chat room
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert({
            campaign_id: campaign.id,
            type: 'campaign',
            name: campaign.name
          })
          .select('id')
          .single();

        if (!error && newRoom) {
          setChatRoomId(newRoom.id);
        }
      }
      setLoading(false);
    };

    ensureChatRoom();
  }, [campaign.id, initialChatRoomId]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {campaign.thumbnail_url ? (
              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <span className="font-medium">{campaign.name}</span>
            <span className="text-xs text-muted-foreground ml-2">Chat</span>
          </div>
        </div>
      </header>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading chat...</p>
          </div>
        ) : chatRoomId ? (
          <ChatRoom roomId={chatRoomId} roomName={campaign.name} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-8 w-8 mr-2 opacity-50" />
            <p>Unable to load chat. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Fullscreen Submissions View Component - Whop V2 Style
export const FullscreenSubmissionsView = ({
  campaign,
  onClose
}: {
  campaign: Campaign;
  onClose: () => void;
}) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch submissions
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      setSubmissions(data as Submission[] || []);
      setLoading(false);
    };

    fetchData();
  }, [campaign.id, user]);

  // Status counts
  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => !s.status || s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved' || s.status === 'paid').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    flagged: submissions.filter(s => s.status === 'flagged').length,
  };

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(sub => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return !sub.status || sub.status === 'pending';
      if (statusFilter === 'approved') return sub.status === 'approved' || sub.status === 'paid';
      return sub.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'views') return (b.views_count || 0) - (a.views_count || 0);
      if (sortBy === 'earnings') return (b.estimated_earnings || 0) - (a.estimated_earnings || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-0 text-xs">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-teal-500/10 text-teal-500 border-0 text-xs">Paid</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-warning/10 text-warning border-0 text-xs">Flagged</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0 text-xs">Submitted</Badge>;
    }
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const handleViewPayouts = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsModalOpen(true);
  };

  const detectPlatform = (url: string | null): 'instagram' | 'youtube' | 'tiktok' | 'other' => {
    if (!url) return 'other';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'other';
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'tiktok':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All Clips' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'flagged', label: 'Flagged' },
  ];

  return (
    <>
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {campaign.thumbnail_url ? (
              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <span className="font-medium">{campaign.name}</span>
        </div>
      </header>

      {/* Content - No Tabs, Just My Submissions */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-6">My Submissions</h1>

          {/* Status Filter Tabs - Whop V2 Style */}
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {filter.label}
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0.5 ${
                    statusFilter === filter.value ? 'bg-background/20 text-background' : ''
                  }`}
                >
                  {statusCounts[filter.value as keyof typeof statusCounts]}
                </Badge>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex gap-2 mb-6">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-muted border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="earnings">Highest Earnings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submissions Grid - 3 columns like Whop */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmissions.map((sub) => {
                const thumbnailUrl = sub.thumbnail_url || campaign.thumbnail_url;
                const username = profile?.username || 'Unknown';
                const displayName = profile?.display_name || username;
                const platform = detectPlatform(sub.social_link);
                const isApprovedOrPaid = sub.status === 'approved' || sub.status === 'paid';
                const title = sub.description || campaign.name;
                
                return (
                  <div key={sub.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all">
                    {/* Header - Platform icon left, Volume icon right */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                      <div className="text-muted-foreground">
                        <PlatformIcon platform={platform} />
                      </div>
                      <div className="text-muted-foreground">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </div>
                    </div>

                    {/* Video Thumbnail - Whop Style with player controls */}
                    <a 
                      href={sub.social_link || sub.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-[9/16] bg-zinc-900 overflow-hidden group cursor-pointer"
                    >
                      {thumbnailUrl ? (
                        <img 
                          src={thumbnailUrl} 
                          alt="Video thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                          <Video className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Center play button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                        </div>
                      </div>

                      {/* Bottom controls bar - Play and Fullscreen icons */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-white/80" />
                          </div>
                          <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        </div>
                      </div>
                    </a>

                    {/* Content */}
                    <div className="p-3.5 space-y-3">
                      {/* Title and Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium line-clamp-2 leading-snug flex-1">{title}</p>
                        {getStatusBadge(sub.status)}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">@{username}</span>
                      </div>

                      {/* Dates and Earnings */}
                      <div className={`grid gap-2 text-xs ${isApprovedOrPaid ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Submitted on</p>
                          <p className="font-medium">{format(new Date(sub.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        {isApprovedOrPaid && (
                          <div>
                            <p className="text-muted-foreground mb-0.5">Approved on</p>
                            <p className="font-medium">{format(new Date(sub.approved_at || sub.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-muted-foreground mb-0.5">Est. Payout</p>
                          <p className="font-medium text-success">${(sub.estimated_earnings || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Views and View Payouts Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          <span className="text-sm font-medium">
                            {formatViewCount(sub.views_count || 0)}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 px-4 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 rounded-lg font-medium"
                          onClick={() => handleViewPayouts(sub)}
                        >
                          View Payouts
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Clip Details Modal */}
    <ClipDetailsModal
      open={detailsModalOpen}
      onOpenChange={setDetailsModalOpen}
      submission={selectedSubmission}
      campaign={selectedSubmission ? campaign : null}
    />
    </>
  );
};

// Fullscreen Announcements View Component
export const FullscreenAnnouncementsView = ({
  campaign,
  onClose
}: {
  campaign: Campaign;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'announcements'>('announcements');

  // Parse requirements from guidelines
  const parseRequirements = (guidelines: string | null): string[] => {
    if (!guidelines) return [];
    return guidelines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
  };

  const requirements = parseRequirements(campaign.rules_guidelines);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {campaign.thumbnail_url ? (
              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <span className="font-medium">{campaign.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-3 text-sm transition-colors ${activeTab === 'rewards' ? 'font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Rewards
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-3 text-sm transition-colors ${activeTab === 'announcements' ? 'font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Announcements
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'rewards' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Campaign Thumbnail */}
            {campaign.thumbnail_url && (
              <div className="rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={campaign.thumbnail_url} alt={campaign.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Reward Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase mb-1">Reward</p>
                <Badge className="bg-primary text-primary-foreground">${campaign.reward_per_1k_views || 1} / 1K</Badge>
              </div>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 uppercase text-muted-foreground">Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {requirements.slice(0, 5).map((req, i) => (
                    <Badge key={i} variant="outline" className="text-sm">{req}</Badge>
                  ))}
                </div>
                {requirements.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-3 bg-muted/50 rounded-lg p-3">
                    {requirements.slice(5).join('\n')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Campaign Announcements</h2>
            </div>
            
            <AnnouncementsList campaignId={campaign.id} />
          </div>
        )}
      </div>
    </div>
  );
};

// Inline Submissions View (for embedding in main content area - no fullscreen wrapper)
export const InlineSubmissionsView = ({
  campaign,
}: {
  campaign: Campaign;
}) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      setSubmissions(data as Submission[] || []);
      setLoading(false);
    };

    fetchData();
  }, [campaign.id, user]);

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => !s.status || s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved' || s.status === 'paid').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    flagged: submissions.filter(s => s.status === 'flagged').length,
  };

  const filteredSubmissions = submissions
    .filter(sub => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return !sub.status || sub.status === 'pending';
      if (statusFilter === 'approved') return sub.status === 'approved' || sub.status === 'paid';
      return sub.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'views') return (b.views_count || 0) - (a.views_count || 0);
      if (sortBy === 'earnings') return (b.estimated_earnings || 0) - (a.estimated_earnings || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-0 text-xs">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-teal-500/10 text-teal-500 border-0 text-xs">Paid</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-warning/10 text-warning border-0 text-xs">Flagged</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0 text-xs">Submitted</Badge>;
    }
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const detectPlatform = (url: string | null): 'instagram' | 'youtube' | 'tiktok' | 'other' => {
    if (!url) return 'other';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'other';
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'tiktok':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All Clips' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'flagged', label: 'Flagged' },
  ];

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Submissions</h1>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === filter.value
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {filter.label}
              <Badge 
                variant="secondary" 
                className={`text-xs px-1.5 py-0.5 ${
                  statusFilter === filter.value ? 'bg-background/20 text-background' : ''
                }`}
              >
                {statusCounts[filter.value as keyof typeof statusCounts]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-muted border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
              <SelectItem value="earnings">Highest Earnings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submissions Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No submissions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmissions.map((sub) => {
              const thumbnailUrl = sub.thumbnail_url || campaign.thumbnail_url;
              const username = profile?.username || 'Unknown';
              const displayName = profile?.display_name || username;
              const platform = detectPlatform(sub.social_link);
              const isApprovedOrPaid = sub.status === 'approved' || sub.status === 'paid';
              const title = sub.description || campaign.name;
              
              return (
                <div key={sub.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                    <div className="text-muted-foreground">
                      <PlatformIcon platform={platform} />
                    </div>
                  </div>

                  <a 
                    href={sub.social_link || sub.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-[9/16] bg-zinc-900 overflow-hidden group cursor-pointer"
                  >
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <Video className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </a>

                  <div className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2 leading-snug flex-1">{title}</p>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">@{username}</span>
                    </div>

                    <div className={`grid gap-2 text-xs ${isApprovedOrPaid ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Submitted on</p>
                        <p className="font-medium">{format(new Date(sub.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      {isApprovedOrPaid && (
                        <div>
                          <p className="text-muted-foreground mb-0.5">Approved on</p>
                          <p className="font-medium">{format(new Date(sub.approved_at || sub.created_at), 'MMM d, yyyy')}</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-muted-foreground mb-0.5">Est. Payout</p>
                        <p className="font-medium text-success">${(sub.estimated_earnings || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="text-sm font-medium">{formatViewCount(sub.views_count || 0)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8 px-4 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 rounded-lg font-medium"
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setDetailsModalOpen(true);
                        }}
                      >
                        View Payouts
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClipDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        submission={selectedSubmission}
        campaign={selectedSubmission ? campaign : null}
      />
    </>
  );
};

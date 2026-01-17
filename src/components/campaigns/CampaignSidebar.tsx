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
  Instagram
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
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  onOpenChat?: () => void;
  onOpenSubmissions?: () => void;
  onOpenAnnouncements?: () => void;
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

export const CampaignSidebar = ({ 
  campaign, 
  chatRoomId,
  isMember,
  memberCount = 0,
  onOpenChat,
  onOpenSubmissions,
  onOpenAnnouncements
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
        {/* Campaign Header - Whop Style */}
        <div className="relative">
          <div className="h-16 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
            {campaign.thumbnail_url && (
              <img 
                src={campaign.thumbnail_url} 
                alt="" 
                className="w-full h-full object-cover opacity-40"
              />
            )}
          </div>
          <div className="absolute -bottom-4 left-4 w-10 h-10 rounded-xl border-2 border-background overflow-hidden bg-card shadow-lg">
            {campaign.thumbnail_url ? (
              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-6 px-4 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm truncate">{campaign.name}</h2>
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span className="text-xs text-muted-foreground">{onlineCount} online</span>
          </div>
        </div>

        {/* Star Rating */}
        <div className="px-4 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1.5">Rate this whop</p>
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

        {/* My Submissions Section */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection('submissions')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Submissions</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedSections.submissions ? '' : '-rotate-90'}`} />
          </button>
          
          <AnimatePresence>
            {expandedSections.submissions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="px-2 pb-2">
                  {/* My Submissions - Opens fullscreen */}
                  <button
                    onClick={onOpenSubmissions}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">My submissions</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

// Fullscreen Submissions View Component
export const FullscreenSubmissionsView = ({
  campaign,
  onClose
}: {
  campaign: Campaign;
  onClose: () => void;
}) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rewards' | 'submissions'>('submissions');

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      setSubmissions(data as Submission[] || []);
      setLoading(false);
    };

    fetchSubmissions();
  }, [campaign.id, user]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-0 text-xs">Accepted</Badge>;
      case 'paid':
        return <Badge className="bg-orange-500 text-white border-0 text-xs">paid</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-warning/10 text-warning border-0 text-xs">Flagged</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-0 text-xs">Decision any moment</Badge>;
    }
  };

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
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-3 text-sm transition-colors ${activeTab === 'submissions' ? 'font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            My submissions
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
          <>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Total views</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Submission</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Reward rate</th>
                      <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Paid out to you</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b border-border hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <span className="text-sm">{campaign.name}</span>
                        </td>
                        <td className="py-3 px-2">
                          {getStatusBadge(sub.status)}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm">{(sub.views_count || 0).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-2">
                          <a 
                            href={sub.social_link || sub.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <Instagram className="w-4 h-4" />
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm">${campaign.reward_per_1k_views || 1} / 1K</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-medium">
                            ${(sub.estimated_earnings || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* How do Content Rewards work? Link */}
      <div className="text-right px-4 py-2 border-t border-border bg-card">
        <button className="text-xs text-muted-foreground hover:text-foreground">
          How do Content Rewards work?
        </button>
      </div>
    </div>
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Megaphone, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  FileText,
  Gift,
  Trophy,
  Users,
  Star,
  Flag,
  X,
  Loader2
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

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
  rules_guidelines: string | null;
}

interface CampaignSidebarProps {
  campaign: Campaign;
  chatRoomId: string | null;
  isMember: boolean;
  memberCount?: number;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasContent?: boolean;
}

export const CampaignSidebar = ({ 
  campaign, 
  chatRoomId,
  isMember,
  memberCount = 0
}: CampaignSidebarProps) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>('announcements');
  const [onlineCount, setOnlineCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportedUsername, setReportedUsername] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [members, setMembers] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch campaign members for reporting
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      const { data: memberData } = await supabase
        .from('campaign_members')
        .select('user_id')
        .eq('campaign_id', campaign.id)
        .limit(50);

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        if (profiles) {
          setMembers(profiles.filter(p => p.user_id !== user?.id));
        }
      }
      setLoadingMembers(false);
    };

    if (isMember && user) {
      fetchMembers();
    }
  }, [campaign.id, isMember, user]);

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

  const handleReportUser = (userId: string, username: string) => {
    setReportedUserId(userId);
    setReportedUsername(username);
    setShowReportModal(true);
  };

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

  const sections: SidebarSection[] = [
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4 w-4" /> },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-4 w-4" /> },
    { id: 'rules', label: 'Community Rules', icon: <FileText className="h-4 w-4" />, hasContent: !!campaign.rules_guidelines },
    { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  ];

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-20">
        {/* Campaign Header */}
        <div className="relative">
          <div className="h-20 bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden">
            {campaign.thumbnail_url && (
              <img 
                src={campaign.thumbnail_url} 
                alt="" 
                className="w-full h-full object-cover opacity-50"
              />
            )}
          </div>
          <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-xl border-2 border-background overflow-hidden bg-card">
            {campaign.thumbnail_url ? (
              <img src={campaign.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold">{campaign.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-6 px-4 pb-4">
          <h2 className="font-display font-bold text-sm truncate">{campaign.name}</h2>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span className="text-xs text-muted-foreground">{onlineCount} online</span>
          </div>
        </div>

        {/* Star Rating Placeholder */}
        <div className="px-4 pb-4 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">Rate this campaign</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className="h-5 w-5 text-muted-foreground/30 cursor-pointer hover:text-warning transition-colors" 
              />
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="divide-y divide-border">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary">{section.icon}</span>
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                {activeSection === section.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              <AnimatePresence>
                {activeSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.id === 'announcements' && (
                      <div className="p-3 pt-0 max-h-[300px] overflow-y-auto">
                        <AnnouncementsList campaignId={campaign.id} limit={5} />
                      </div>
                    )}
                    
                    {section.id === 'chat' && (
                      <div className="h-[350px]">
                        {!isMember ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                            <Lock className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm text-center">Join the campaign to chat with other members</p>
                          </div>
                        ) : chatRoomId ? (
                          <ChatRoom roomId={chatRoomId} roomName={campaign.name} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <p className="text-sm">Loading chat...</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {section.id === 'rules' && (
                      <div className="p-3 pt-0 max-h-[300px] overflow-y-auto">
                        {campaign.rules_guidelines ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              {campaign.rules_guidelines}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No community rules posted yet
                          </p>
                        )}
                      </div>
                    )}
                    
                    {section.id === 'members' && (
                      <div className="p-3 pt-0 max-h-[300px] overflow-y-auto">
                        {!isMember ? (
                          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                            <Lock className="h-6 w-6 mb-2 opacity-50" />
                            <p className="text-sm text-center">Join to see members</p>
                          </div>
                        ) : loadingMembers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : members.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No other members yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {members.map((member) => (
                              <div 
                                key={member.user_id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                              >
                                <Link 
                                  to={`/user/${member.username || member.user_id}`}
                                  className="flex items-center gap-2 flex-1 min-w-0"
                                >
                                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                                    {member.avatar_url ? (
                                      <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          {member.username?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm truncate">@{member.username || 'user'}</span>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleReportUser(member.user_id, member.username || 'user');
                                  }}
                                >
                                  <Flag className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
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

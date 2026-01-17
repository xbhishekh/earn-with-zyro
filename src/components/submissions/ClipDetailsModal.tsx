import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, DollarSign, Clock, ArrowUpRight, ExternalLink, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';

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
}

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
  reward_per_1k_views?: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  type: string;
  notes: string | null;
  created_at: string;
  status?: string;
}

interface ClipDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  campaign: Campaign | null;
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success/10 text-success border-0">Approved</Badge>;
    case 'paid':
      return <Badge className="bg-teal-500/10 text-teal-500 border-0">Paid</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/10 text-destructive border-0">Rejected</Badge>;
    case 'flagged':
      return <Badge className="bg-warning/10 text-warning border-0">Flagged</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground border-0">Submitted</Badge>;
  }
};

export const ClipDetailsModal = ({ 
  open, 
  onOpenChange, 
  submission, 
  campaign 
}: ClipDetailsModalProps) => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'payouts'>('payouts');

  useEffect(() => {
    if (!open || !submission || !user) return;

    const fetchPayouts = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('submission_id', submission.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setPayouts(data || []);
      } catch (error) {
        console.error('Error fetching payouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [open, submission, user]);

  if (!submission || !campaign) return null;

  const totalEarned = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const receivedAmount = payouts
    .filter(p => p.type === 'payout' || p.status === 'available')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = submission.estimated_earnings || 0;
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), { addSuffix: true });
  const thumbnailUrl = submission.thumbnail_url || campaign.thumbnail_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold mb-1">
                Clip details
              </DialogTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(submission.status)}
              </div>
            </div>
            {thumbnailUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                <img 
                  src={thumbnailUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Video Title */}
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-medium text-sm mb-2">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">
            {submission.description || 'No description available'}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              {campaign.thumbnail_url ? (
                <img 
                  src={campaign.thumbnail_url} 
                  alt="" 
                  className="w-4 h-4 rounded object-cover"
                />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span>{campaign.name}</span>
            </div>
          </div>
          
          {/* View Submission Link */}
          <a 
            href={submission.social_link || submission.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View submission
          </a>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'notes' | 'payouts')}>
          <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none">
            <TabsTrigger 
              value="notes"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger 
              value="payouts"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="m-0">
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-8">
                No notes available for this clip.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="payouts" className="m-0">
            {/* Payout Stats */}
            <div className="grid grid-cols-4 gap-2 p-5 border-b border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total earned</p>
                <p className="text-lg font-semibold text-success">${totalEarned.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Received</p>
                <p className="text-lg font-semibold">${receivedAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Days until</p>
                <p className="text-lg font-semibold">3</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Next payout</p>
                <p className="text-lg font-semibold">${pendingAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Payout History */}
            <ScrollArea className="max-h-[250px]">
              <div className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No payouts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Payouts will appear here once processed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div 
                        key={payout.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {payout.notes || 'View payout'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payout.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-success">
                          +${payout.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

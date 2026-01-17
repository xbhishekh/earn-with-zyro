import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { SubmissionCard } from '@/components/submissions/SubmissionCard';
import { ClipDetailsModal } from '@/components/submissions/ClipDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ClipboardList, ChevronDown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  campaign_id: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
  reward_per_1k_views?: number;
}

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'flagged';
type SortOption = 'recent' | 'oldest' | 'views' | 'earnings';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Clips' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'flagged', label: 'Flagged' },
];

const MySubmissions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch submissions and related data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch all submissions for the user
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (submissionsData) {
          setSubmissions(submissionsData as Submission[]);

          // Get unique campaign IDs
          const campaignIds = [...new Set(submissionsData.map(s => s.campaign_id))];

          // Fetch campaigns
          if (campaignIds.length > 0) {
            const { data: campaignsData } = await supabase
              .from('campaigns')
              .select('id, name, slug, thumbnail_url, reward_per_1k_views')
              .in('id', campaignIds);

            if (campaignsData) {
              const campaignMap = new Map<string, Campaign>();
              campaignsData.forEach(c => campaignMap.set(c.id, c));
              setCampaigns(campaignMap);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: submissions.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
    };

    submissions.forEach(s => {
      if (s.status === 'pending') counts.pending++;
      else if (s.status === 'approved' || s.status === 'paid') counts.approved++;
      else if (s.status === 'rejected') counts.rejected++;
      else if (s.status === 'flagged') counts.flagged++;
    });

    return counts;
  }, [submissions]);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => {
        if (statusFilter === 'approved') return s.status === 'approved' || s.status === 'paid';
        return s.status === statusFilter;
      });
    }

    // Apply campaign filter
    if (campaignFilter !== 'all') {
      result = result.filter(s => s.campaign_id === campaignFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0);
        case 'earnings':
          return (b.estimated_earnings || 0) - (a.estimated_earnings || 0);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [submissions, statusFilter, campaignFilter, sortBy]);

  // Get unique campaigns for filter dropdown
  const campaignOptions = useMemo(() => {
    return Array.from(campaigns.values());
  }, [campaigns]);

  const handleViewPayouts = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsModalOpen(true);
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Submissions</h1>
            <p className="text-sm text-muted-foreground">
              View and track all your video submissions
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {filter.label}
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-1 h-5 min-w-5 px-1.5 text-xs",
                  statusFilter === filter.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background"
                )}
              >
                {statusCounts[filter.value]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 mb-6">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaignOptions.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
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
        {filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardList className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {statusFilter === 'all' 
                ? "Start submitting videos to campaigns to see them here"
                : `No ${statusFilter} submissions found`
              }
            </p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/campaigns')}
            >
              Browse Campaigns
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmissions.map((submission) => {
              const campaign = campaigns.get(submission.campaign_id);
              if (!campaign) return null;
              
              return (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  campaign={campaign}
                  profile={profile || undefined}
                  onViewPayouts={handleViewPayouts}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Clip Details Modal */}
      <ClipDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        submission={selectedSubmission}
        campaign={selectedSubmission ? campaigns.get(selectedSubmission.campaign_id) || null : null}
      />
    </MainLayout>
  );
};

export default MySubmissions;

import { Instagram, Youtube, Play, Eye, Video, Volume2, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

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

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface SubmissionCardProps {
  submission: Submission;
  campaign: Campaign;
  profile?: Profile;
  onViewPayouts: (submission: Submission) => void;
}

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
    case 'youtube':
      return <Youtube className="w-4 h-4" />;
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

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-success/10 text-success border-0 text-xs font-medium px-2.5 py-0.5">
          Approved
        </Badge>
      );
    case 'paid':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-medium px-2.5 py-0.5">
          Paid
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-destructive/10 text-destructive border-0 text-xs font-medium px-2.5 py-0.5">
          Rejected
        </Badge>
      );
    case 'flagged':
      return (
        <Badge className="bg-warning/10 text-warning border-0 text-xs font-medium px-2.5 py-0.5">
          Flagged
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted text-muted-foreground border border-border text-xs font-medium px-2.5 py-0.5">
          Submitted
        </Badge>
      );
  }
};

const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

export const SubmissionCard = ({ submission, campaign, profile, onViewPayouts }: SubmissionCardProps) => {
  const platform = detectPlatform(submission.social_link);
  const thumbnailUrl = submission.thumbnail_url || campaign.thumbnail_url;
  const username = profile?.username || 'Unknown';
  const displayName = profile?.display_name || username;
  const avatarUrl = profile?.avatar_url;
  const isApprovedOrPaid = submission.status === 'approved' || submission.status === 'paid';
  
  // Get description/title from submission or use campaign name
  const title = (submission as any).description || campaign.name;

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = submission.social_link || submission.video_url;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all">
      {/* Header - Platform icon left, Volume icon right */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <div className="text-muted-foreground">
          <PlatformIcon platform={platform} />
        </div>
        <div className="text-muted-foreground">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      {/* Video Thumbnail - Whop Style with player controls */}
      <div 
        className="relative aspect-[9/16] bg-zinc-900 overflow-hidden cursor-pointer group"
        onClick={handleVideoClick}
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
            <Maximize2 className="w-4 h-4 text-white/80" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3">
        {/* Title and Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-2 leading-snug flex-1">{title}</p>
          {getStatusBadge(submission.status)}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={avatarUrl || ''} />
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
            <p className="font-medium">{format(new Date(submission.created_at), 'MMM d, yyyy')}</p>
          </div>
          {isApprovedOrPaid && (
            <div>
              <p className="text-muted-foreground mb-0.5">Approved on</p>
              <p className="font-medium">
                {submission.approved_at 
                  ? format(new Date(submission.approved_at), 'MMM d, yyyy')
                  : format(new Date(submission.created_at), 'MMM d, yyyy')
                }
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-muted-foreground mb-0.5">Est. Payout</p>
            <p className="font-medium text-success">
              ${(submission.estimated_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Views and View Payouts Button */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-sm font-medium">
              {formatViewCount(submission.views_count || 0)}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8 px-4 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 rounded-lg font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onViewPayouts(submission);
            }}
          >
            View Payouts
          </Button>
        </div>
      </div>
    </div>
  );
};

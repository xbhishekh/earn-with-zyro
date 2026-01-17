import { Instagram, Youtube, Play, Eye, Video } from 'lucide-react';
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
        <Badge className="bg-success/10 text-success border-0 text-xs font-medium">
          Approved
        </Badge>
      );
    case 'paid':
      return (
        <Badge className="bg-teal-500/10 text-teal-500 border-0 text-xs font-medium">
          Paid
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-destructive/10 text-destructive border-0 text-xs font-medium">
          Rejected
        </Badge>
      );
    case 'flagged':
      return (
        <Badge className="bg-warning/10 text-warning border-0 text-xs font-medium">
          Flagged
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-xs font-medium">
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

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
      {/* Header with platform icon */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <PlatformIcon platform={platform} />
        </div>
      </div>

      {/* Video Thumbnail */}
      <div className="relative aspect-[9/16] bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Video className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Play button overlay */}
        <a 
          href={submission.social_link || submission.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
          </div>
        </a>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium truncate flex-1">{campaign.name}</p>
          {getStatusBadge(submission.status)}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="text-[10px]">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">@{username}</span>
        </div>

        {/* Dates and Earnings */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Submitted on</p>
            <p className="font-medium">{format(new Date(submission.created_at), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {submission.status === 'approved' || submission.status === 'paid' ? 'Approved on' : 'Status'}
            </p>
            <p className="font-medium">
              {submission.approved_at 
                ? format(new Date(submission.approved_at), 'MMM d, yyyy')
                : submission.status === 'pending' ? 'Pending' : '-'
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Est. Payout</p>
            <p className="font-medium text-success">
              ${(submission.estimated_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Views and View Payouts Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatViewCount(submission.views_count || 0)}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8"
            onClick={() => onViewPayouts(submission)}
          >
            View Payouts
          </Button>
        </div>
      </div>
    </div>
  );
};

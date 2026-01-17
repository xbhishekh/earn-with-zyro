import { useState, useRef } from 'react';
import { Instagram, Youtube, Play, Video, Volume2, Maximize2, Pause } from 'lucide-react';
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

const detectPlatform = (url: string | null): 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'other' => {
  if (!url) return 'other';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'other';
};

const PlatformIcon = ({ platform, className = "w-5 h-5" }: { platform: string; className?: string }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    default:
      return <Video className={className} />;
  }
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-medium px-3 py-1 rounded-full">
          Approved
        </Badge>
      );
    case 'paid':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-medium px-3 py-1 rounded-full">
          Paid
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-medium px-3 py-1 rounded-full">
          Rejected
        </Badge>
      );
    case 'flagged':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs font-medium px-3 py-1 rounded-full">
          Flagged
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-700/50 text-zinc-300 border-0 text-xs font-medium px-3 py-1 rounded-full">
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
  const username = profile?.username || 'Unknown';
  const avatarUrl = profile?.avatar_url;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Check if video_url is a direct video file (for video preview)
  const isVideoFile = submission.video_url && (
    submission.video_url.includes('.mp4') || 
    submission.video_url.includes('.webm') || 
    submission.video_url.includes('.mov') ||
    submission.video_url.includes('supabase')
  );
  
  // Get description/title from submission or use campaign name
  const title = (submission as any).description || campaign.name;

  const handleVideoClick = () => {
    if (videoRef.current && isVideoFile) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && isVideoFile) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
      {/* Video Container with Platform Icon Overlay */}
      <div className="relative">
        {/* Top Bar - Platform icon left, Volume icon right */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-3">
          <div className="text-white/90">
            <PlatformIcon platform={platform} className="w-5 h-5" />
          </div>
          <div className="text-white/90">
            <Volume2 className="w-5 h-5" />
          </div>
        </div>

        {/* Video Thumbnail - Click to play/pause inline */}
        <div 
          className="relative aspect-[9/16] bg-zinc-950 overflow-hidden cursor-pointer group"
          onClick={handleVideoClick}
        >
          {isVideoFile ? (
            <video 
              ref={videoRef}
              src={submission.video_url} 
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : submission.thumbnail_url ? (
            <img 
              src={submission.thumbnail_url} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Video className="w-16 h-16 text-zinc-600" />
            </div>
          )}
          
          {/* Center play/pause button */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
              <Play className="w-7 h-7 text-zinc-900 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Bottom controls bar */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent">
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <button className="p-1.5 hover:bg-white/20 rounded transition-colors">
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
              <button 
                onClick={handleFullscreen}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title and Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white line-clamp-2 leading-snug flex-1">
            {title}
          </h3>
          {getStatusBadge(submission.status)}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 border border-zinc-700">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-400">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-zinc-400">@{username}</span>
        </div>

        {/* Dates and Earnings - Two columns */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500 mb-1">Submitted on</p>
            <p className="font-medium text-white">{format(new Date(submission.created_at), 'MMM d, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 mb-1">Est. Payout</p>
            <p className="font-medium text-emerald-400">
              ${(submission.estimated_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Views and View Payouts Button */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-sm font-semibold text-white">
              {formatViewCount(submission.views_count || 0)}
            </span>
          </div>
          <Button 
            size="sm" 
            className="text-sm h-9 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium shadow-lg shadow-orange-500/20"
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

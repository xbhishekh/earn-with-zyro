import { Video } from 'lucide-react';

// Professional branded platform icons - Whop style
export const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80" />
        <stop offset="25%" stopColor="#FCAF45" />
        <stop offset="50%" stopColor="#F77737" />
        <stop offset="75%" stopColor="#F56040" />
        <stop offset="100%" stopColor="#FD1D1D" />
      </linearGradient>
      <linearGradient id="instagram-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F56040" />
        <stop offset="50%" stopColor="#C13584" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient-2)" />
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
  </svg>
);

export const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      fill="currentColor"
    />
  </svg>
);

export const TikTokColorIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      fill="#000000"
    />
    {/* Cyan glow effect */}
    <path
      d="M18.59 5.69a4.83 4.83 0 0 1-3.77-4.25V1h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V8.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 4 19.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      fill="#25F4EE"
      opacity="0.7"
    />
    {/* Pink glow effect */}
    <path
      d="M20.59 7.69a4.83 4.83 0 0 1-3.77-4.25V3h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V10.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 6 21.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      fill="#FE2C55"
      opacity="0.7"
    />
  </svg>
);

export const YouTubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="#FF0000"
    />
  </svg>
);

export const TwitterXIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

export const SnapchatIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509-.015.21-.169.375-.405.45-.3.09-.631.135-.99.15-.121.01-.239.019-.353.029-.356.03-.695.059-.988.135-.404.104-.784.524-1.169.925-.199.2-.404.41-.614.6-.615.555-1.47 1.169-2.85 1.169-.073 0-.149-.005-.224-.014l-.012.001c-.129.006-.261.01-.39.01-1.379 0-2.235-.614-2.85-1.169a5.52 5.52 0 0 1-.615-.6c-.39-.4-.764-.821-1.168-.925-.294-.075-.633-.105-.989-.135-.115-.01-.233-.019-.355-.029a7.61 7.61 0 0 1-.99-.15c-.22-.075-.39-.24-.405-.45-.015-.239.165-.465.42-.509 3.265-.54 4.731-3.878 4.791-4.014l.016-.015c.18-.344.21-.644.12-.868-.195-.45-.884-.675-1.334-.81a4.196 4.196 0 0 1-.345-.119c-.82-.33-1.227-.72-1.212-1.168 0-.36.284-.689.734-.838.15-.061.327-.09.509-.09.12 0 .299.016.464.104.374.181.733.285 1.034.301.197 0 .325-.045.401-.09-.008-.165-.019-.33-.03-.51l-.002-.06c-.105-1.627-.232-3.654.297-4.847C7.86 1.069 11.216.793 12.206.793z"
      fill="#FFFC00"
    />
  </svg>
);

// Platform icon component that handles all platforms
export const PlatformIcon = ({ 
  platform, 
  className = "w-5 h-5",
  colored = true 
}: { 
  platform: string; 
  className?: string;
  colored?: boolean;
}) => {
  const p = platform.toLowerCase();
  
  if (p.includes('instagram')) {
    return <InstagramIcon className={className} />;
  }
  if (p.includes('youtube')) {
    return <YouTubeIcon className={className} />;
  }
  if (p.includes('tiktok')) {
    return colored ? <TikTokColorIcon className={className} /> : <TikTokIcon className={className} />;
  }
  if (p.includes('twitter') || p.includes('x.com') || p === 'x') {
    return <TwitterXIcon className={className} />;
  }
  if (p.includes('facebook')) {
    return <FacebookIcon className={className} />;
  }
  if (p.includes('snapchat')) {
    return <SnapchatIcon className={className} />;
  }
  
  return <Video className={className} />;
};

// Detect platform from URL
export const detectPlatform = (url: string | null): string => {
  if (!url) return 'other';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('snapchat.com')) return 'snapchat';
  return 'other';
};

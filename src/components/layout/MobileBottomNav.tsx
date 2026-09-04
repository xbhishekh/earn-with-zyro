import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const tickerItems = [
  "CliporaX is a safe & trusted platform",
  "Clip videos & earn real money",
  "Top brands post campaigns daily",
  "Buy & sell digital products",
  "100% guaranteed payouts",
  "Fully trusted by 10,000+ clippers",
];

const TrustTickerStrip = () => (
  <div className="md:hidden overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-md py-1.5">
    <div className="flex animate-[marquee_28s_linear_infinite] items-center whitespace-nowrap">
      {[...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
        <span key={i} className="flex items-center gap-1.5 pr-6 text-[11px] font-medium text-muted-foreground">
          <Shield className="w-3 h-3 text-primary shrink-0" />
          {t}
        </span>
      ))}
    </div>
  </div>
);

// Colorful Home Icon
const HomeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-home-grad" x1="3" y1="3" x2="21" y2="21">
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="url(#mob-home-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Colorful Marketplace Icon
const MarketplaceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-market-grad" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#mob-market-grad)" strokeWidth="2"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="url(#mob-market-grad)" strokeWidth="2"/>
    <path d="M2 12h20" stroke="url(#mob-market-grad)" strokeWidth="2"/>
  </svg>
);

// Colorful Messages Icon (filled style for center button)
const MessagesIcon = ({ className = "w-6 h-6", filled = false }: { className?: string; filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-msg-grad" x1="3" y1="3" x2="21" y2="21">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    {filled ? (
      <>
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="url(#mob-msg-grad)"/>
        <circle cx="8.5" cy="11.5" r="1" fill="white"/>
        <circle cx="12" cy="11.5" r="1" fill="white"/>
        <circle cx="15.5" cy="11.5" r="1" fill="white"/>
      </>
    ) : (
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="url(#mob-msg-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

// Colorful Clipping/Campaigns Icon
const ClippingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-clip-grad" x1="2" y1="20" x2="22" y2="4">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M2 20h20M5 20V10l5-4 4 4v10M14 20V8l5-4v16" stroke="url(#mob-clip-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Colorful Profile Icon
const ProfileIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-profile-grad" x1="4" y1="4" x2="20" y2="20">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="4" stroke="url(#mob-profile-grad)" strokeWidth="2"/>
    <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="url(#mob-profile-grad)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Colorful Sign In Icon
const SignInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="mob-signin-grad" x1="3" y1="3" x2="21" y2="21">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="url(#mob-signin-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ className?: string; filled?: boolean }>;
  center?: boolean;
  badgeKey?: 'messages' | 'clipping' | 'profile';
}

// 5 tabs with Profile as last tab
const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Marketplace', href: '/marketplace', icon: MarketplaceIcon },
  { label: 'Messages', href: '/messages', icon: MessagesIcon, center: true, badgeKey: 'messages' },
  { label: 'Clipping', href: '/campaigns', icon: ClippingIcon, badgeKey: 'clipping' },
  { label: 'Profile', href: '/profile', icon: ProfileIcon, badgeKey: 'profile' },
];

const guestNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Marketplace', href: '/marketplace', icon: MarketplaceIcon },
  { label: 'Clipping', href: '/campaigns', icon: ClippingIcon },
  { label: 'Sign In', href: '/auth', icon: SignInIcon },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [campaignUpdates, setCampaignUpdates] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Fetch unread message count for DMs
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      // First get all DM rooms the user is part of
      const { data: participations } = await supabase
        .from('dm_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (!participations || participations.length === 0) {
        setUnreadMessages(0);
        return;
      }

      const roomIds = participations.map(p => p.room_id);

      // Count unread messages in those rooms (not sent by current user)
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('room_id', roomIds)
        .neq('user_id', user.id)
        .is('read_at', null);
      
      setUnreadMessages(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('unread-dm-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        // Only increment if message is not from current user
        if (payload.new && payload.new.user_id !== user.id) {
          setUnreadMessages(prev => prev + 1);
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        // Decrement when a message is marked as read
        if (payload.new && payload.new.read_at && !payload.old?.read_at) {
          setUnreadMessages(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch campaign updates (unread notifications related to campaigns)
  useEffect(() => {
    if (!user) return;

    const fetchCampaignUpdates = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .in('type', ['submission_approved', 'submission_rejected', 'campaign_update', 'payout', 'announcement']);
      
      setCampaignUpdates(count || 0);
    };

    fetchCampaignUpdates();

    // Subscribe to notification changes
    const channel = supabase
      .channel('campaign-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchCampaignUpdates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch pending verifications for profile badge
  useEffect(() => {
    if (!user) return;

    const fetchPendingVerifications = async () => {
      const { count } = await supabase
        .from('social_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending_link', 'awaiting_code', 'pending_verification']);
      
      setPendingVerifications(count || 0);
    };

    fetchPendingVerifications();

    // Subscribe to social account changes
    const channel = supabase
      .channel('profile-verifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'social_accounts',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchPendingVerifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const items = user ? navItems : guestNavItems;

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'messages') return unreadMessages;
    if (badgeKey === 'clipping') return campaignUpdates;
    if (badgeKey === 'profile') return pendingVerifications;
    return 0;
  };

  return (
    <>
      <TrustTickerStrip />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          const badgeCount = getBadgeCount(item.badgeKey);
          const isCenter = item.center;
          const Icon = item.icon;

          if (isCenter) {
            return (
              <Link
                key={item.label}
                to={item.href}
                className="relative flex flex-col items-center justify-center -mt-4"
              >
              <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform",
                    active 
                      ? "gradient-bg glow-primary" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {active ? (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="white"/>
                      <circle cx="8.5" cy="11.5" r="1" fill="hsl(var(--primary))"/>
                      <circle cx="12" cy="11.5" r="1" fill="hsl(var(--primary))"/>
                      <circle cx="15.5" cy="11.5" r="1" fill="hsl(var(--primary))"/>
                    </svg>
                  ) : (
                    <Icon className="w-6 h-6" filled />
                  )}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-3"
            >
              <div className="relative active:scale-95 transition-transform">
                <Icon className="w-5 h-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 transition-colors",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
};

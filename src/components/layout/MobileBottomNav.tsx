import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';


/* ---- Premium duotone gradient icon set ---- */

const Grad = ({ id, from, to }: { id: string; from: string; to: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
    <stop stopColor={from} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
);

// Home — solid house with glowing roof
const HomeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-home-a" from="#FB923C" to="#EF4444" />
      <Grad id="ic-home-b" from="#FDBA74" to="#FCA5A5" />
    </defs>
    <path d="M11.02 2.79a1.6 1.6 0 011.96 0l7.4 5.76c.39.3.62.77.62 1.27v9.43a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.25V9.82c0-.5.23-.97.62-1.27l7.4-5.76z" fill="url(#ic-home-a)"/>
    <path d="M9.5 21v-5.1c0-.77.63-1.4 1.4-1.4h2.2c.77 0 1.4.63 1.4 1.4V21H9.5z" fill="#fff" fillOpacity="0.92"/>
    <path d="M2.4 10.3L12 2.8l9.6 7.5" stroke="url(#ic-home-b)" strokeWidth="2.1" strokeLinecap="round"/>
  </svg>
);

// Marketplace — shopping bag with sparkle
const MarketplaceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-mkt-a" from="#A78BFA" to="#EC4899" />
    </defs>
    <path d="M4.6 8h14.8c.62 0 1.14.47 1.2 1.09l.92 9.5A2.5 2.5 0 0119.03 21H4.97a2.5 2.5 0 01-2.49-2.41l.92-9.5A1.2 1.2 0 014.6 8z" fill="url(#ic-mkt-a)"/>
    <path d="M8.2 9.5V7a3.8 3.8 0 017.6 0v2.5" stroke="url(#ic-mkt-a)" strokeWidth="2.1" strokeLinecap="round"/>
    <circle cx="9" cy="13" r="1.15" fill="#fff" fillOpacity="0.95"/>
    <circle cx="15" cy="13" r="1.15" fill="#fff" fillOpacity="0.95"/>
  </svg>
);

// Messages — filled chat bubble
const MessagesIcon = ({ className = "w-6 h-6", filled = false }: { className?: string; filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-msg-a" from="#38BDF8" to="#2563EB" />
    </defs>
    <path
      d="M12 2.6c5.3 0 9.4 3.7 9.4 8.5 0 4.8-4.1 8.5-9.4 8.5-.98 0-1.93-.12-2.8-.35l-4.4 2.02a.7.7 0 01-.98-.79l.83-3.86C3.06 15.1 2.6 13.4 2.6 11.1c0-4.8 4.1-8.5 9.4-8.5z"
      fill={filled ? "url(#ic-msg-a)" : "url(#ic-msg-a)"}
      fillOpacity={filled ? 1 : 0.9}
    />
    <circle cx="8.3" cy="11.2" r="1.15" fill="#fff"/>
    <circle cx="12" cy="11.2" r="1.15" fill="#fff"/>
    <circle cx="15.7" cy="11.2" r="1.15" fill="#fff"/>
  </svg>
);

// Clipping — film clip / scissors-on-reel
const ClippingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-clip-a" from="#34D399" to="#0891B2" />
    </defs>
    <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="3.2" fill="url(#ic-clip-a)"/>
    <path d="M10 9.4l5.4 2.6L10 14.6V9.4z" fill="#fff"/>
    <path d="M5.4 4.6v14.8M18.6 4.6v14.8" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4"/>
  </svg>
);

// Profile — avatar chip
const ProfileIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-prof-a" from="#FBBF24" to="#F43F5E" />
    </defs>
    <circle cx="12" cy="12" r="9.4" fill="url(#ic-prof-a)"/>
    <circle cx="12" cy="9.7" r="3.1" fill="#fff"/>
    <path d="M5.6 19.2a6.9 6.9 0 0112.8 0A9.36 9.36 0 0112 21.4a9.36 9.36 0 01-6.4-2.2z" fill="#fff"/>
  </svg>
);

// Sign In — arrow into door
const SignInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <Grad id="ic-in-a" from="#34D399" to="#3B82F6" />
    </defs>
    <rect x="11.6" y="2.6" width="9.8" height="18.8" rx="3" fill="url(#ic-in-a)"/>
    <path d="M2.6 12h8.2M7.6 8.2L11.4 12l-3.8 3.8" stroke="url(#ic-in-a)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
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
                <Icon className="w-[26px] h-[26px] drop-shadow-sm" />
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

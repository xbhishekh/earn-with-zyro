import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, TrendingUp, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  center?: boolean;
  badgeKey?: 'messages' | 'notifications';
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Marketplace', href: '/marketplace', icon: Compass },
  { label: 'Messages', href: '/messages', icon: MessageCircle, center: true, badgeKey: 'messages' },
  { label: 'Clipping', href: '/campaigns', icon: TrendingUp },
  { label: 'Profile', href: '/profile', icon: User },
];

const guestNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Marketplace', href: '/marketplace', icon: Compass },
  { label: 'Clipping', href: '/campaigns', icon: TrendingUp },
  { label: 'Sign In', href: '/auth', icon: LogIn },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Fetch unread message count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      // Count unread DM messages
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .neq('user_id', user.id)
        .is('read_at', null);
      
      setUnreadMessages(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const items = user ? navItems : guestNavItems;

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'messages') return unreadMessages;
    return 0;
  };

  return (
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
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    active 
                      ? "gradient-bg glow-primary" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className={cn(
                    "w-6 h-6",
                    active ? "text-white" : "text-muted-foreground"
                  )} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </motion.div>
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
              <motion.div whileTap={{ scale: 0.95 }} className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )} />
                {badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </motion.div>
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
  );
};

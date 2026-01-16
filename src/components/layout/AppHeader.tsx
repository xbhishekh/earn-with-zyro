import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Zap, Shield, LogOut, Wallet, Home, Compass, 
  MessageCircle, TrendingUp, Users, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import NotificationsBell from '@/components/NotificationsBell';
import { cn } from '@/lib/utils';

interface Profile {
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const desktopNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Campaigns', href: '/campaigns', icon: TrendingUp },
  { label: 'Marketplace', href: '/marketplace', icon: Compass },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Affiliate', href: '/affiliate', icon: Users },
];

export const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin, isOwner, role, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);

  // Get badge based on role only (no hardcoded emails)
  const getSpecialBadge = () => {
    if (!user) return null;
    if (isOwner) {
      return { label: 'Owner', icon: Crown, className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0' };
    }
    if (isSuperAdmin) {
      return { label: 'Super Admin', icon: Crown, className: 'bg-primary text-primary-foreground border-0' };
    }
    if (isAdmin || role === 'normal_admin') {
      return { label: 'Admin', icon: Shield, className: 'bg-muted text-foreground' };
    }
    return null;
  };

  const specialBadge = getSpecialBadge();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Fetch profile and balance
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, balanceRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('avatar_url, display_name, username')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('balance_transactions')
          .select('amount, type, status')
          .eq('user_id', user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      // Calculate available balance
      if (balanceRes.data) {
        const available = balanceRes.data.reduce((acc, tx) => {
          if (tx.status === 'available') {
            return tx.type === 'earning' || tx.type === 'referral' 
              ? acc + tx.amount 
              : acc - tx.amount;
          }
          return acc;
        }, 0);
        setBalance(Math.max(0, available));
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 md:h-16 gap-2 md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 md:w-9 md:h-9 gradient-bg rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="hidden sm:block font-display font-bold text-lg gradient-text">
                Zyrozo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search Button - Desktop */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex w-56 lg:w-64 h-9 px-4 bg-muted hover:bg-muted/80 rounded-full items-center gap-2 transition-colors shrink-0"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                Search...
              </span>
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile: Only Notifications (left) and Balance (right) for logged in users */}
              {user ? (
                <>
                  {/* Admin Badge - Mobile */}
                  {specialBadge && (
                    <Badge 
                      variant="outline" 
                      className={cn("md:hidden flex items-center gap-1 text-[10px] px-1.5 py-0.5", specialBadge.className)}
                    >
                      <specialBadge.icon className="w-3 h-3" />
                      {specialBadge.label}
                    </Badge>
                  )}

                  {/* Mobile: Admin icon next to notification */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="md:hidden p-2 hover:bg-muted rounded-full relative"
                    >
                      <Shield className="w-5 h-5 text-primary" />
                    </Link>
                  )}

                  {/* Mobile: Notification on left */}
                  <div className="md:hidden">
                    <NotificationsBell />
                  </div>

                  {/* Balance - Desktop */}
                  <Link
                    to="/balance"
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      ${balance.toFixed(2)}
                    </span>
                  </Link>

                  {/* Balance - Mobile (on right) */}
                  <Link
                    to="/balance"
                    className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-muted rounded-full"
                  >
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium">
                      ${balance.toFixed(0)}
                    </span>
                  </Link>

                  {/* Admin Badge - Desktop */}
                  {specialBadge && (
                    <Badge 
                      variant="outline" 
                      className={cn("hidden md:flex items-center gap-1.5 px-2.5 py-1", specialBadge.className)}
                    >
                      <specialBadge.icon className="w-3.5 h-3.5" />
                      {specialBadge.label}
                    </Badge>
                  )}

                  {/* Desktop: Notifications */}
                  <div className="hidden md:block">
                    <NotificationsBell />
                  </div>

                  {/* Admin Button - Desktop */}
                  {(isAdmin || role === 'normal_admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hidden lg:flex"
                    >
                      <Link to="/admin">
                        <Shield className="w-4 h-4 mr-1" />
                        Admin
                      </Link>
                    </Button>
                  )}

                  {/* User Avatar Dropdown - Always visible */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                        <Avatar className="w-8 h-8 md:w-9 md:h-9">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/balance">Balance</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages">Messages</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/affiliate">Affiliate</Link>
                      </DropdownMenuItem>
                      {(isAdmin || role === 'normal_admin') && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Mobile Search */}
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="md:hidden p-2 hover:bg-muted rounded-full"
                  >
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link to="/auth">Log In</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/auth?mode=signup">
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Sign Up</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
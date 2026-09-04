import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Shield, LogOut, Wallet, Crown, LayoutDashboard, User, MessageCircle, HandCoins, ChevronRight
} from 'lucide-react';
import logo from "@/assets/cliporax-mark.png";
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
import { ThemeToggle } from '@/components/ThemeToggle';
import { prefetchRoute } from '@/lib/prefetch';
import { cn } from '@/lib/utils';
import { calculateAvailableBalance } from '@/lib/balance-utils';

// Colorful Home Icon
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="home-grad" x1="3" y1="3" x2="21" y2="21">
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="url(#home-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Colorful Campaigns Icon (Trending/Chart)
const CampaignsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="camp-grad" x1="2" y1="20" x2="22" y2="4">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M2 20h20M5 20V10l5-4 4 4v10M14 20V8l5-4v16" stroke="url(#camp-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Colorful Marketplace Icon
const MarketplaceIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="market-grad" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#market-grad)" strokeWidth="2"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="url(#market-grad)" strokeWidth="2"/>
    <path d="M2 12h20" stroke="url(#market-grad)" strokeWidth="2"/>
  </svg>
);

// Colorful Messages Icon
const MessagesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="msg-grad" x1="3" y1="3" x2="21" y2="21">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="url(#msg-grad)"/>
    <circle cx="8.5" cy="11.5" r="1" fill="white"/>
    <circle cx="12" cy="11.5" r="1" fill="white"/>
    <circle cx="15.5" cy="11.5" r="1" fill="white"/>
  </svg>
);

// Colorful Affiliate Icon
const AffiliateIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="aff-nav-grad" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <circle cx="9" cy="7" r="4" stroke="url(#aff-nav-grad)" strokeWidth="2"/>
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="url(#aff-nav-grad)" strokeWidth="2"/>
    <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="url(#aff-nav-grad)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface Profile {
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const desktopNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Campaigns', href: '/campaigns', icon: CampaignsIcon },
  { label: 'Marketplace', href: '/marketplace', icon: MarketplaceIcon },
  { label: 'Messages', href: '/messages', icon: MessagesIcon },
  { label: 'Affiliate', href: '/affiliate', icon: AffiliateIcon },
];

// Cache for profile and balance to prevent re-fetching
const profileCache = new Map<string, { profile: Profile; balance: number; timestamp: number }>();
const PROFILE_CACHE_TTL = 30000; // 30 seconds

// Running trust ticker (desktop header)
const tickerItems = [
  "CliporaX is a safe & trusted platform",
  "Clip videos & earn real money",
  "Top brands post campaigns daily",
  "Buy & sell digital products",
  "100% guaranteed payouts",
  "Fully trusted by 10,000+ clippers",
];

const TrustTicker = () => (
  <div className="flex flex-1 min-w-0 items-center overflow-hidden mx-2" aria-hidden>
    <div className="flex shrink-0 animate-[marquee_70s_linear_infinite] items-center whitespace-nowrap">
      {[...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
        <span key={i} className="flex items-center gap-1.5 pr-6 lg:pr-10 text-[11px] lg:text-[13px] font-medium text-muted-foreground">
          <Shield className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-primary shrink-0" />
          {t}
        </span>
      ))}
    </div>
  </div>
);

export const AppHeader = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin, isOwner, role, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);

  // Memoize badge based on role
  const specialBadge = useMemo(() => {
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
  }, [user, isOwner, isSuperAdmin, isAdmin, role]);

  const isActive = useCallback((href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  }, [location.pathname]);

  // Fetch profile and balance with caching
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setBalance(0);
      return;
    }

    // Check cache first
    const cached = profileCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
      setProfile(cached.profile);
      setBalance(cached.balance);
      return;
    }

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

      const profileData = profileRes.data || null;
      if (profileData) setProfile(profileData);

      // Calculate available balance using centralized utility
      let calculatedBalance = 0;
      if (balanceRes.data) {
        calculatedBalance = calculateAvailableBalance(balanceRes.data);
        setBalance(calculatedBalance);
      }

      // Update cache
      if (profileData) {
        profileCache.set(user.id, { 
          profile: profileData, 
          balance: calculatedBalance, 
          timestamp: Date.now() 
        });
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = useCallback(async () => {
    // Clear cache on sign out
    if (user) profileCache.delete(user.id);
    await signOut();
    navigate('/');
  }, [user, signOut, navigate]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 lg:left-[264px]"
      >
        <div className="w-full h-full">
          <div className="flex items-center h-14 md:h-16 gap-2 md:gap-3 px-3 md:px-4 border-b border-border/70 bg-gradient-to-r from-primary/[0.08] via-background to-secondary/90 backdrop-blur-xl shadow-[0_4px_20px_-10px_hsl(var(--primary)/0.14)]">
            {/* Logo */}
            <Link to="/" className="flex lg:hidden items-center gap-2 shrink-0">
              <img 
                src={logo} 
                alt="CliporaX" 
                width={36}
                height={36}
                decoding="async"
                fetchPriority="high"
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-contain"
              />
              <span className="hidden sm:block font-display font-extrabold text-lg tracking-tight text-foreground">
                Clipora<span className="gradient-text">X</span>
              </span>
            </Link>

            {/* Desktop Navigation (sidebar handles lg+ nav) */}
            <nav className="hidden lg:hidden items-center gap-1 ml-4 p-1 rounded-full bg-muted/60 border border-border/50">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-2px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Running trust ticker (desktop) */}
            <TrustTicker />

            {/* Search Button - Desktop with ⌘K hint */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex w-56 lg:w-64 h-9 px-3.5 bg-muted/70 border border-border/50 hover:border-primary/40 hover:bg-muted rounded-full items-center gap-2 transition-all shrink-0 group shadow-sm"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1 text-left">
                Search...
              </span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Theme toggle - Desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

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
                    className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/15 rounded-full transition-colors shadow-sm"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
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
                        <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-primary/25 ring-offset-1 ring-offset-background">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={10} className="w-72 p-2 rounded-2xl border-border/70 shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.25)]">
                      {/* User info header */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-2">
                        <Avatar className="w-11 h-11 ring-2 ring-primary/25">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">
                            {profile?.display_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{profile?.username || 'clipper'}
                          </p>
                          {specialBadge && (
                            <Badge variant="outline" className={cn("mt-1 text-[10px] px-1.5 py-0 h-5 flex w-fit items-center gap-1", specialBadge.className)}>
                              <specialBadge.icon className="w-2.5 h-2.5" />
                              {specialBadge.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Balance card */}
                      <Link
                        to="/balance"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 hover:border-primary/30 transition-colors mb-2 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Balance</p>
                          <p className="text-base font-extrabold text-primary leading-tight">${balance.toFixed(2)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>

                      {/* Menu items */}
                      <div className="space-y-0.5">
                        {[
                          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                          { to: '/profile', label: 'Profile', icon: User },
                          { to: '/messages', label: 'Messages', icon: MessageCircle },
                          { to: '/affiliate', label: 'Affiliate', icon: HandCoins },
                        ].map((item) => (
                          <DropdownMenuItem key={item.to} asChild className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary">
                            <Link to={item.to} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        {(isAdmin || role === 'normal_admin') && (
                          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary">
                            <Link to="/admin" className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-sm">Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </div>

                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="rounded-lg px-3 py-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm">Sign Out</span>
                        </div>
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
});

AppHeader.displayName = 'AppHeader';
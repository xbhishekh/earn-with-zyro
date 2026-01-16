import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, Shield, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import NotificationsBell from '@/components/NotificationsBell';

interface Profile {
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

export const AppHeader = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);

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
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16 gap-3">
            {/* Logo */}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 md:w-9 md:h-9 gradient-bg rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="hidden sm:block font-display font-bold text-lg gradient-text">
                Zyrozo
              </span>
            </Link>

            {/* Search Button - Whop Style Pill */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 max-w-md mx-4 h-10 px-4 bg-muted/60 hover:bg-muted rounded-full flex items-center gap-3 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate hidden sm:block">
                Search campaigns, products...
              </span>
              <span className="text-sm text-muted-foreground sm:hidden">
                Search...
              </span>
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {/* Balance - Desktop */}
                  <Link
                    to="/balance"
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-muted rounded-full transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      ${balance.toFixed(2)}
                    </span>
                  </Link>

                  {/* Balance - Mobile */}
                  <Link
                    to="/balance"
                    className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-muted/60 rounded-full"
                  >
                    <span className="text-xs font-medium">
                      ${balance.toFixed(0)}
                    </span>
                  </Link>

                  {/* Notifications */}
                  <NotificationsBell />

                  {/* Admin Button - Desktop */}
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hidden md:flex"
                    >
                      <Link to="/admin">
                        <Shield className="w-4 h-4 mr-1" />
                        Admin
                      </Link>
                    </Button>
                  )}

                  {/* User Avatar Dropdown */}
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
                      {isAdmin && (
                        <DropdownMenuItem asChild className="md:hidden">
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
      </motion.header>

      {/* Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

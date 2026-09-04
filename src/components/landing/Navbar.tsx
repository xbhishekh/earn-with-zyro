import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Shield, Wallet, LogOut, User, LayoutDashboard } from "lucide-react";
import logo from "@/assets/cliperus-mark.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isBusinessSide = location.pathname.startsWith("/business") || location.pathname.startsWith("/for-business");
  const { user, isAdmin, role, signOut } = useAuth();
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
    setIsOpen(false);
  };

  const showAdminAccess = isAdmin || role === 'normal_admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <img 
                src={logo} 
                alt="Cliperus" 
                className="w-10 h-10 rounded-xl object-contain group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 gradient-bg rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl md:text-2xl gradient-text">
              Cliperus
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Side switcher: Clipper / Business */}
            <div className="hidden md:flex items-center p-1 rounded-full bg-muted/70 border border-border">
              <Link
                to="/"
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${isBusinessSide ? "text-muted-foreground hover:text-foreground" : "bg-background shadow-sm"}`}
              >
                For Clippers
              </Link>
              <Link
                to="/business"
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${isBusinessSide ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                For Business
              </Link>
            </div>

            {user ? (
              <>
                {/* Balance - Desktop & Mobile */}
                <Link
                  to="/balance"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    ${balance.toFixed(2)}
                  </span>
                </Link>

                {/* Admin Button - Desktop */}
                {showAdminAccess && (
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
                      <Avatar className="w-9 h-9 md:w-10 md:h-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/balance">
                        <Wallet className="w-4 h-4 mr-2" />
                        Balance
                      </Link>
                    </DropdownMenuItem>
                    {showAdminAccess && (
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
                {/* Not logged in - Auth buttons */}
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button - Only for non-logged in users */}
            {!user && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Only for non-logged in users */}
      {isOpen && !user && (
        <div className="sm:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Button variant="outline" asChild className="justify-center">
              <Link to="/business" onClick={() => setIsOpen(false)}>
                For Business
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-center">
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                Log In
              </Link>
            </Button>
            <Button className="gradient-bg" asChild>
              <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

import { memo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Megaphone,
  Store,
  MessageCircle,
  HandCoins,
  LayoutDashboard,
  Wallet,
  User,
  Shield,
  Settings,
  Sparkles,
} from 'lucide-react';
import logo from '@/assets/cliperus-mark.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { prefetchRoute } from '@/lib/prefetch';

interface Item {
  label: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const mainItems: Item[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Affiliate', href: '/affiliate', icon: HandCoins },
];

const workspaceItems: Item[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Balance', href: '/balance', icon: Wallet },
  { label: 'Profile', href: '/profile', icon: User },
];

export const AppSidebar = memo(() => {
  const location = useLocation();
  const { user, isAdmin, role } = useAuth();

  const isActive = useCallback(
    (href: string) => (href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)),
    [location.pathname]
  );

  const renderItem = (item: Item) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        to={item.href}
        onMouseEnter={() => prefetchRoute(item.href)}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
          active
            ? 'bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.65)]'
            : 'text-muted-foreground hover:text-foreground hover:bg-primary/8'
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0',
            active ? 'bg-primary-foreground/15' : 'bg-muted/70 group-hover:bg-primary/10'
          )}
        >
          <item.icon className={cn('w-[18px] h-[18px]', active ? '' : 'text-primary/80')} />
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-[264px] flex-col border-r border-border/60 bg-background/80 backdrop-blur-xl">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 px-5 h-[4.5rem] shrink-0">
        <img src={logo} alt="Cliperus" width={36} height={36} className="w-9 h-9 rounded-lg object-contain" />
        <span className="font-display font-extrabold text-xl tracking-tight text-primary">Cliperus</span>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Explore</p>
          {mainItems.map(renderItem)}
        </div>

        {user && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </p>
            {workspaceItems.map(renderItem)}
            {(isAdmin || role === 'normal_admin') &&
              renderItem({ label: 'Admin Panel', href: '/admin', icon: Shield })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/60 space-y-2">
        {!user && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-4">
            <Sparkles className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-bold leading-tight">Start earning per clip</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Join free and get paid for views.</p>
            <Link
              to="/auth?mode=signup"
              className="block text-center text-xs font-bold py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Create account
            </Link>
          </div>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-colors"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/70">
            <Settings className="w-[18px] h-[18px]" />
          </span>
          Settings
        </Link>
      </div>
    </aside>
  );
});

AppSidebar.displayName = 'AppSidebar';

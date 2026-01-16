import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showMobileNav?: boolean;
  className?: string;
}

export const MainLayout = ({
  children,
  showHeader = true,
  showMobileNav = true,
  className = '',
}: MainLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader />}
      
      <main className={`${showHeader ? 'pt-14 md:pt-16' : ''} ${showMobileNav && user ? 'pb-20 md:pb-0' : ''} ${className}`}>
        {children}
      </main>

      {showMobileNav && user && <MobileBottomNav />}
    </div>
  );
};

import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';

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
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppSidebar />}
      {showHeader && <AppHeader />}

      <main
        className={`${showHeader ? 'pt-16 md:pt-[4.5rem] lg:pl-[264px]' : ''} ${
          showMobileNav ? 'pb-20 md:pb-0' : ''
        } ${className}`}
      >
        {children}
      </main>

      {showMobileNav && <MobileBottomNav />}
    </div>
  );
};

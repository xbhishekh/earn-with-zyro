import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children?: ReactNode;
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
        className={`${showHeader ? 'pt-14 md:pt-16 lg:pl-[264px]' : ''} ${
          showMobileNav ? 'pb-24 lg:pb-0' : ''
        } ${className}`}
      >
        {children ?? <Outlet />}
      </main>

      {showMobileNav && <MobileBottomNav />}
    </div>
  );
};

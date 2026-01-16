import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from './AppHeader';
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
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader />}
      
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "tween",
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.2 
        }}
        className={`${showHeader ? 'pt-14 md:pt-16' : ''} ${showMobileNav ? 'pb-20 md:pb-0' : ''} ${className}`}
      >
        {children}
      </motion.main>

      {showMobileNav && <MobileBottomNav />}
    </div>
  );
};

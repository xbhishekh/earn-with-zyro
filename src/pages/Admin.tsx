import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Video,
  Megaphone,
  Wallet,
  Users,
  DollarSign,
  UserPlus,
  Activity,
  Link2,
  ClipboardList,
  MessageSquare,
  Settings,
  Globe,
  FileText,
  HelpCircle,
  Radio,
  Zap,
  LogOut,
  Menu,
  X,
  Banknote,
  Shield,
  ChevronRight,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Import all admin tab components
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminSubmissions from "@/components/admin/AdminSubmissions";
import AdminCampaigns from "@/components/admin/AdminCampaigns";
import AdminVerifications from "@/components/admin/AdminVerifications";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminWithdrawals from "@/components/admin/AdminWithdrawals";
import AdminPayoutManagement from "@/components/admin/AdminPayoutManagement";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminInvites from "@/components/admin/AdminInvites";
import AdminActivityLog from "@/components/admin/AdminActivityLog";
import AdminAffiliates from "@/components/admin/AdminAffiliates";
import AdminWaitlist from "@/components/admin/AdminWaitlist";
import AdminSupport from "@/components/admin/AdminSupport";
import AdminSupportSettings from "@/components/admin/AdminSupportSettings";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminLegalPages from "@/components/admin/AdminLegalPages";
import AdminCompanyPages from "@/components/admin/AdminCompanyPages";
import AdminFAQs from "@/components/admin/AdminFAQs";
import AdminEmailBroadcast from "@/components/admin/AdminEmailBroadcast";
import AdminMarketplace from "@/components/admin/AdminMarketplace";
import AdminPerformance from "@/components/admin/AdminPerformance";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType;
  requiresSuperAdmin?: boolean;
  requiresOwner?: boolean;
}

const tabs: Tab[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3, component: AdminAnalytics },
  { id: "performance", label: "Performance", icon: Gauge, component: AdminPerformance, requiresSuperAdmin: true },
  { id: "submissions", label: "Submissions", icon: Video, component: AdminSubmissions },
  { id: "campaigns", label: "Campaigns", icon: Video, component: AdminCampaigns },
  { id: "marketplace", label: "Marketplace", icon: DollarSign, component: AdminMarketplace },
  { id: "verifications", label: "Verifications", icon: Link2, component: AdminVerifications },
  { id: "announcements", label: "Announcements", icon: Megaphone, component: AdminAnnouncements },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet, component: AdminWithdrawals },
  { id: "payout-mgmt", label: "Payout Mgmt", icon: Banknote, component: AdminPayoutManagement },
  { id: "users", label: "Users", icon: Users, component: AdminUsers },
  { id: "payments", label: "Payments", icon: DollarSign, component: AdminPayments },
  { id: "admin-invites", label: "Admin Invites", icon: UserPlus, component: AdminInvites, requiresSuperAdmin: true },
  { id: "activity-log", label: "Activity Log", icon: Activity, component: AdminActivityLog, requiresOwner: true },
  { id: "affiliates", label: "Affiliates", icon: Link2, component: AdminAffiliates },
  { id: "waitlist", label: "Waitlist", icon: ClipboardList, component: AdminWaitlist },
  { id: "support", label: "Support", icon: MessageSquare, component: AdminSupport },
  { id: "support-settings", label: "Support Settings", icon: Settings, component: AdminSupportSettings, requiresSuperAdmin: true },
  { id: "footer", label: "Footer", icon: Globe, component: AdminFooter, requiresSuperAdmin: true },
  { id: "legal-pages", label: "Legal Pages", icon: FileText, component: AdminLegalPages, requiresSuperAdmin: true },
  { id: "company-pages", label: "Company Pages", icon: Globe, component: AdminCompanyPages, requiresSuperAdmin: true },
  { id: "faqs", label: "FAQs", icon: HelpCircle, component: AdminFAQs, requiresSuperAdmin: true },
  { id: "email-broadcast", label: "Email Broadcast", icon: Radio, component: AdminEmailBroadcast, requiresSuperAdmin: true },
];

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, isAdmin, isSuperAdmin, isOwner, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = searchParams.get("tab") || "analytics";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!authLoading && user && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Filter tabs based on user role
  const visibleTabs = tabs.filter((tab) => {
    if (tab.requiresOwner && !isOwner) return false;
    if (tab.requiresSuperAdmin && !isSuperAdmin) return false;
    return true;
  });

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || AdminAnalytics;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <span className="font-display font-bold text-lg gradient-text">Zyrozo</span>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{tab.label}</span>}
                {tab.requiresOwner && sidebarOpen && (
                  <Shield className="w-3 h-3 text-destructive ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Toggle & Logout */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronRight
              className={cn("w-4 h-4 transition-transform", sidebarOpen && "rotate-180")}
            />
            {sidebarOpen && <span className="ml-2">Collapse</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold gradient-text">Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14"
          >
            <ScrollArea className="h-full">
              <nav className="p-4 space-y-1">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.requiresOwner && <Shield className="w-3 h-3 text-destructive ml-auto" />}
                  </button>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </nav>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14 overflow-hidden">
        <ScrollArea className="h-screen">
          <div className="p-6">
            <ActiveComponent />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Admin;

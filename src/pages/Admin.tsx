import { useEffect, useState, lazy, Suspense, memo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  LogOut,
  Menu,
  X,
  Banknote,
  Shield,
  ChevronRight,
  Gauge,
  Flag,
} from "lucide-react";
import logo from "@/assets/cliperus-mark.png";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Lazy load ALL admin tab components for better performance
const AdminAnalytics = lazy(() => import("@/components/admin/AdminAnalytics"));
const AdminSubmissions = lazy(() => import("@/components/admin/AdminSubmissions"));
const AdminCampaigns = lazy(() => import("@/components/admin/AdminCampaigns"));
const AdminVerifications = lazy(() => import("@/components/admin/AdminVerifications"));
const AdminAnnouncements = lazy(() => import("@/components/admin/AdminAnnouncements"));
const AdminWithdrawals = lazy(() => import("@/components/admin/AdminWithdrawals"));
const AdminPayoutManagement = lazy(() => import("@/components/admin/AdminPayoutManagement"));
const AdminUsers = lazy(() => import("@/components/admin/AdminUsers"));
const AdminPayments = lazy(() => import("@/components/admin/AdminPayments"));
const AdminInvites = lazy(() => import("@/components/admin/AdminInvites"));
const AdminActivityLog = lazy(() => import("@/components/admin/AdminActivityLog"));
const AdminAffiliates = lazy(() => import("@/components/admin/AdminAffiliates"));
const AdminWaitlist = lazy(() => import("@/components/admin/AdminWaitlist"));
const AdminSupport = lazy(() => import("@/components/admin/AdminSupport"));
const AdminSupportSettings = lazy(() => import("@/components/admin/AdminSupportSettings"));
const AdminFooter = lazy(() => import("@/components/admin/AdminFooter"));
const AdminLegalPages = lazy(() => import("@/components/admin/AdminLegalPages"));
const AdminCompanyPages = lazy(() => import("@/components/admin/AdminCompanyPages"));
const AdminFAQs = lazy(() => import("@/components/admin/AdminFAQs"));
const AdminEmailBroadcast = lazy(() => import("@/components/admin/AdminEmailBroadcast"));
const AdminMarketplace = lazy(() => import("@/components/admin/AdminMarketplace"));
const AdminPerformance = lazy(() => import("@/components/admin/AdminPerformance"));
const AdminBusinessInquiries = lazy(() => import("@/components/admin/AdminBusinessInquiries"));
const AdminReports = lazy(() => import("@/components/admin/AdminReports").then(m => ({ default: m.AdminReports })));

// Tab loading fallback
const TabLoader = memo(() => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
TabLoader.displayName = "TabLoader";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType;
  requiresSuperAdmin?: boolean;
  requiresOwner?: boolean;
  requiresFounderOrOwner?: boolean;
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
  { id: "activity-log", label: "Activity Log", icon: Activity, component: AdminActivityLog, requiresFounderOrOwner: true },
  { id: "affiliates", label: "Affiliates", icon: Link2, component: AdminAffiliates },
  { id: "waitlist", label: "Waitlist", icon: ClipboardList, component: AdminWaitlist },
  { id: "reports", label: "User Reports", icon: Flag, component: AdminReports },
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
  const { user, loading: authLoading, isAdmin, isSuperAdmin, isOwner, isFounder, signOut } = useAuth();
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
    if (tab.requiresFounderOrOwner && !isFounder && !isOwner) return false;
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
            <img src={logo} alt="Cliperus" className="w-10 h-10 rounded-xl flex-shrink-0 object-cover" />
            {sidebarOpen && (
              <div>
                <span className="font-display font-bold text-lg gradient-text">Cliperus</span>
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
            <img src={logo} alt="Cliperus" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-display font-bold gradient-text">Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14">
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
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14 overflow-hidden">
        <ScrollArea className="h-screen">
          <div className="p-6">
            <Suspense fallback={<TabLoader />}>
              <ActiveComponent />
            </Suspense>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Admin;

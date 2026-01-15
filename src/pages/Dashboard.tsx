import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  FileVideo, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  LogOut,
  User,
  Zap,
  DollarSign,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationsBell from "@/components/NotificationsBell";

interface DashboardStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  totalViews: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    totalViews: 0,
  });
  const [profile, setProfile] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch submissions stats
      const { data: submissions } = await supabase
        .from("submissions")
        .select("status, views_count, estimated_earnings")
        .eq("user_id", user!.id);

      if (submissions) {
        const totalViews = submissions.reduce((acc, s) => acc + (s.views_count || 0), 0);
        const approved = submissions.filter(s => s.status === "approved" || s.status === "paid");
        const totalEarnings = approved.reduce((acc, s) => acc + Number(s.estimated_earnings || 0), 0);

        setStats({
          totalEarnings,
          pendingEarnings: submissions
            .filter(s => s.status === "pending")
            .reduce((acc, s) => acc + Number(s.estimated_earnings || 0), 0),
          totalSubmissions: submissions.length,
          approvedSubmissions: approved.length,
          totalViews,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Earnings",
      value: `₹${stats.totalEarnings.toLocaleString()}`,
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Earnings",
      value: `₹${stats.pendingEarnings.toLocaleString()}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Submissions",
      value: `${stats.approvedSubmissions}/${stats.totalSubmissions}`,
      icon: FileVideo,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 gradient-bg rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">
                Zyrozo
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-foreground font-medium">
                Dashboard
              </Link>
              <Link to="/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
                Campaigns
              </Link>
              <Link to="/balance" className="text-muted-foreground hover:text-foreground transition-colors">
                Balance
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <NotificationsBell />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.display_name || "Profile"}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile?.display_name || "Creator"}</span>!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your creator journey
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="hero" size="lg" className="h-auto py-4" asChild>
              <Link to="/campaigns">
                <Plus className="w-5 h-5 mr-2" />
                Join New Campaign
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-4" asChild>
              <Link to="/balance">
                <DollarSign className="w-5 h-5 mr-2" />
                Withdraw Earnings
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-4" asChild>
              <Link to="/affiliate">
                <TrendingUp className="w-5 h-5 mr-2" />
                Referral Program
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Empty State for Submissions */}
        {stats.totalSubmissions === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileVideo className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Browse our active campaigns and start creating content to earn money!
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/campaigns">
                Explore Campaigns
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

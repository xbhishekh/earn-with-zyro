import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Video,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalCampaigns: number;
  totalSubmissions: number;
  totalEarnings: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  totalViews: number;
}

const COLORS = ["#ea580c", "#10b981", "#ef4444", "#f59e0b"];

const AdminAnalytics = () => {
  const { hasFullAccess, myCampaignIds, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalSubmissions: 0,
    totalEarnings: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessLoading) fetchStats();
  }, [accessLoading, hasFullAccess, myCampaignIds, myCampaignMemberUserIds]);

  const fetchStats = async () => {
    try {
      if (!hasFullAccess && myCampaignIds.length === 0) {
        setLoading(false);
        return;
      }

      let profilesQuery = supabase.from("profiles").select("id", { count: "exact", head: true });
      let campaignsQuery = supabase.from("campaigns").select("id", { count: "exact", head: true });
      let submissionsQuery = supabase.from("submissions").select("status, views_count, estimated_earnings");
      let transactionsQuery = supabase.from("balance_transactions").select("amount, type").eq("status", "available");

      // Filter for normal admin
      if (!hasFullAccess) {
        if (myCampaignMemberUserIds.length > 0) {
          profilesQuery = supabase.from("profiles").select("id", { count: "exact", head: true }).in("user_id", myCampaignMemberUserIds);
        }
        campaignsQuery = supabase.from("campaigns").select("id", { count: "exact", head: true }).in("id", myCampaignIds);
        submissionsQuery = submissionsQuery.in("campaign_id", myCampaignIds);
        if (myCampaignMemberUserIds.length > 0) {
          transactionsQuery = transactionsQuery.in("user_id", myCampaignMemberUserIds);
        }
      }

      const [profilesRes, campaignsRes, submissionsRes, transactionsRes] = await Promise.all([
        profilesQuery,
        campaignsQuery,
        submissionsQuery,
        transactionsQuery,
      ]);

      const submissions = submissionsRes.data || [];
      const transactions = transactionsRes.data || [];

      const pendingCount = submissions.filter((s) => s.status === "pending").length;
      const approvedCount = submissions.filter((s) => s.status === "approved" || s.status === "paid").length;
      const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
      const totalViews = submissions.reduce((acc, s) => acc + (s.views_count || 0), 0);
      const totalEarnings = transactions
        .filter((t) => t.type === "pending_payout" || t.type === "deposit")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      setStats({
        totalUsers: hasFullAccess ? (profilesRes.count || 0) : myCampaignMemberUserIds.length,
        totalCampaigns: campaignsRes.count || 0,
        totalSubmissions: submissions.length,
        totalEarnings,
        pendingSubmissions: pendingCount,
        approvedSubmissions: approvedCount,
        rejectedSubmissions: rejectedCount,
        totalViews,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: hasFullAccess ? "Total Users" : "Campaign Members", value: stats.totalUsers, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: hasFullAccess ? "All Campaigns" : "My Campaigns", value: stats.totalCampaigns, icon: Video, color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Submissions", value: stats.totalSubmissions, icon: BarChart3, color: "text-success", bgColor: "bg-success/10" },
    { title: "Total Earnings", value: `$${stats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Pending", value: stats.pendingSubmissions, icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Approved", value: stats.approvedSubmissions, icon: CheckCircle, color: "text-success", bgColor: "bg-success/10" },
    { title: "Rejected", value: stats.rejectedSubmissions, icon: TrendingUp, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  const pieData = [
    { name: "Pending", value: stats.pendingSubmissions },
    { name: "Approved", value: stats.approvedSubmissions },
    { name: "Rejected", value: stats.rejectedSubmissions },
  ];

  const lineChartData = [
    { name: "Mon", submissions: 12, earnings: 5000 },
    { name: "Tue", submissions: 19, earnings: 7500 },
    { name: "Wed", submissions: 15, earnings: 6200 },
    { name: "Thu", submissions: 25, earnings: 9800 },
    { name: "Fri", submissions: 22, earnings: 8400 },
    { name: "Sat", submissions: 18, earnings: 7100 },
    { name: "Sun", submissions: 20, earnings: 8000 },
  ];

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFullAccess && myCampaignIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaigns</h3>
        <p className="text-muted-foreground">Create a campaign to see analytics for your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          {hasFullAccess ? "Overview of platform performance" : "Overview of your campaigns performance"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="font-display text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-display text-lg font-bold mb-4">Weekly Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="submissions" stroke="#ea580c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-display text-lg font-bold mb-4">Submission Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="font-display text-lg font-bold mb-4">Daily Submissions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
            />
            <Bar dataKey="submissions" fill="#ea580c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;

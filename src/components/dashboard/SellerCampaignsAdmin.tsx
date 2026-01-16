import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Video,
  Users,
  FileCheck,
  ClipboardList,
  Search,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  reward_per_1k_views: number;
  min_payout: number | null;
  max_payout: number | null;
  budget_total: number | null;
  budget_spent: number | null;
  thumbnail_url: string | null;
}

interface CampaignMember {
  id: string;
  user_id: string;
  campaign_id: string;
  status: string | null;
  joined_at: string | null;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface Submission {
  id: string;
  video_url: string;
  social_link: string | null;
  status: string | null;
  views_count: number | null;
  estimated_earnings: number | null;
  created_at: string;
  user_id: string;
  campaign_id: string;
  admin_notes: string | null;
  username?: string;
}

interface WaitlistRequest {
  id: string;
  user_id: string;
  campaign_id: string;
  status: string;
  answers: string[] | null;
  created_at: string;
  username?: string;
}

const SellerCampaignsAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Members state
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Waitlist state
  const [waitlistRequests, setWaitlistRequests] = useState<WaitlistRequest[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Approve/Update Views modal
  const [approveSubmission, setApproveSubmission] = useState<Submission | null>(null);
  const [viewsInput, setViewsInput] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [updateMode, setUpdateMode] = useState<"approve" | "update">("approve");
  const [markPaidAfterUpdate, setMarkPaidAfterUpdate] = useState(false);

  // Mark Paid modal
  const [markPaidSubmission, setMarkPaidSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyCampaigns();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignData();
    }
  }, [selectedCampaign, statusFilter]);

  const fetchMyCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, slug, status, reward_per_1k_views, min_payout, max_payout, budget_total, budget_spent, thumbnail_url")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaign(data[0]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignData = async () => {
    if (!selectedCampaign) return;

    // Fetch all data in parallel
    await Promise.all([
      fetchMembers(),
      fetchSubmissions(),
      fetchWaitlist(),
    ]);
  };

  const fetchMembers = async () => {
    if (!selectedCampaign) return;
    setMembersLoading(true);
    try {
      const { data: membersData, error } = await supabase
        .from("campaign_members")
        .select("*")
        .eq("campaign_id", selectedCampaign.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const enriched = membersData.map(m => ({
          ...m,
          username: profiles?.find(p => p.user_id === m.user_id)?.username,
          display_name: profiles?.find(p => p.user_id === m.user_id)?.display_name,
          avatar_url: profiles?.find(p => p.user_id === m.user_id)?.avatar_url,
        }));
        setMembers(enriched);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedCampaign) return;
    setSubmissionsLoading(true);
    try {
      let query = supabase
        .from("submissions")
        .select("*")
        .eq("campaign_id", selectedCampaign.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", userIds);

        const enriched = data.map(s => ({
          ...s,
          username: profiles?.find(p => p.user_id === s.user_id)?.username || 
                    profiles?.find(p => p.user_id === s.user_id)?.display_name ||
                    s.user_id.slice(0, 8),
        }));
        setSubmissions(enriched);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchWaitlist = async () => {
    if (!selectedCampaign) return;
    setWaitlistLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaign_waitlist_requests")
        .select("*")
        .eq("campaign_id", selectedCampaign.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", userIds);

        const enriched = data.map(r => ({
          ...r,
          username: profiles?.find(p => p.user_id === r.user_id)?.username ||
                    profiles?.find(p => p.user_id === r.user_id)?.display_name ||
                    r.user_id.slice(0, 8),
        }));
        setWaitlistRequests(enriched);
      } else {
        setWaitlistRequests([]);
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const calculateEarnings = (views: number): number => {
    if (!selectedCampaign) return 0;
    let earnings = (views / 1000) * selectedCampaign.reward_per_1k_views;
    if (selectedCampaign.min_payout && earnings < selectedCampaign.min_payout) {
      earnings = 0;
    }
    if (selectedCampaign.max_payout && earnings > selectedCampaign.max_payout) {
      earnings = selectedCampaign.max_payout;
    }
    return earnings;
  };

  const handleApproveOrUpdateSubmission = async () => {
    if (!approveSubmission || !viewsInput) {
      toast.error("Enter views count");
      return;
    }
    const views = parseInt(viewsInput);
    if (isNaN(views) || views < 0) {
      toast.error("Invalid views count");
      return;
    }

    setActionLoading(true);
    try {
      const earnings = calculateEarnings(views);
      const isUpdate = updateMode === "update";

      const { error } = await supabase
        .from("submissions")
        .update({
          status: isUpdate ? approveSubmission.status : "approved",
          views_count: views,
          estimated_earnings: earnings,
          admin_notes: adminNotes || approveSubmission.admin_notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", approveSubmission.id);

      if (error) throw error;

      // If updating views for approved submission, add to pending balance
      if (isUpdate && approveSubmission.status === "approved" && selectedCampaign) {
        const { error: txError } = await supabase
          .from("balance_transactions")
          .insert({
            user_id: approveSubmission.user_id,
            amount: earnings,
            type: "pending_payout",
            status: markPaidAfterUpdate ? "available" : "pending",
            campaign_id: approveSubmission.campaign_id,
            submission_id: approveSubmission.id,
            processed_by: user?.id,
            processed_at: new Date().toISOString(),
            notes: `Views update: ${views.toLocaleString()} views`,
          });

        if (txError) throw txError;

        // Update campaign budget
        const newBudgetSpent = (selectedCampaign.budget_spent || 0) + earnings;
        const updateData: any = { budget_spent: newBudgetSpent };

        if (selectedCampaign.budget_total && newBudgetSpent >= selectedCampaign.budget_total) {
          updateData.status = "paused";
          toast.warning("Campaign auto-paused: Budget depleted");
        }

        await supabase.from("campaigns").update(updateData).eq("id", selectedCampaign.id);

        // Mark submission as paid
        await supabase.from("submissions").update({ status: "paid" }).eq("id", approveSubmission.id);

        // Create notification
        await supabase.from("notifications").insert({
          user_id: approveSubmission.user_id,
          type: markPaidAfterUpdate ? "payment_available" : "payment_pending",
          title: markPaidAfterUpdate ? "Payment Available!" : "Earnings Added to Pending!",
          message: markPaidAfterUpdate 
            ? `$${earnings.toLocaleString()} is now available in your balance.`
            : `$${earnings.toLocaleString()} has been added to your pending balance.`,
          metadata: { amount: earnings, views, campaign_id: selectedCampaign.id },
        });

        toast.success(markPaidAfterUpdate 
          ? `Updated & Paid! $${earnings.toLocaleString()} added to available balance`
          : `Updated! $${earnings.toLocaleString()} added to pending balance`);
        
        fetchMyCampaigns();
      } else {
        toast.success(`Approved! Estimated earnings: $${earnings.toLocaleString()}`);
      }

      setApproveSubmission(null);
      setViewsInput("");
      setAdminNotes("");
      setMarkPaidAfterUpdate(false);
      setUpdateMode("approve");
      fetchSubmissions();
    } catch (error) {
      console.error("Error:", error);
      toast.error(updateMode === "update" ? "Failed to update views" : "Failed to approve submission");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "rejected",
          admin_notes: "Rejected by campaign admin",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Submission rejected");
      fetchSubmissions();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject");
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidSubmission || !selectedCampaign) return;

    setActionLoading(true);
    try {
      const amount = markPaidSubmission.estimated_earnings || 0;

      // Create balance transaction
      const { error: txError } = await supabase
        .from("balance_transactions")
        .insert({
          user_id: markPaidSubmission.user_id,
          amount: amount,
          type: "pending_payout",
          status: "available",
          campaign_id: markPaidSubmission.campaign_id,
          submission_id: markPaidSubmission.id,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          notes: `Payout for submission ${markPaidSubmission.id.slice(0, 8)}`,
        });

      if (txError) throw txError;

      // Update submission status
      const { error: subError } = await supabase
        .from("submissions")
        .update({ status: "paid" })
        .eq("id", markPaidSubmission.id);

      if (subError) throw subError;

      // Update campaign budget
      const newBudgetSpent = (selectedCampaign.budget_spent || 0) + amount;
      const updateData: any = { budget_spent: newBudgetSpent };

      if (selectedCampaign.budget_total && newBudgetSpent >= selectedCampaign.budget_total) {
        updateData.status = "paused";
        toast.warning("Campaign auto-paused: Budget depleted");
      }

      await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", selectedCampaign.id);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: markPaidSubmission.user_id,
        type: "payment_added",
        title: "Payment Added!",
        message: `$${amount.toLocaleString()} has been added to your available balance.`,
        metadata: {
          amount,
          campaign_id: selectedCampaign.id,
          submission_id: markPaidSubmission.id,
        },
      });

      toast.success(`Marked paid! $${amount.toLocaleString()} added to user's balance`);
      setMarkPaidSubmission(null);
      fetchSubmissions();
      fetchMyCampaigns(); // Refresh budget
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error("Failed to mark as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaign_waitlist_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Request approved!");
      fetchWaitlist();
      fetchMembers();
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaign_waitlist_requests")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Request rejected");
      fetchWaitlist();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the campaign?")) return;

    try {
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Member removed");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-500 border-yellow-500/50",
      approved: "text-blue-500 border-blue-500/50",
      paid: "text-green-500 border-green-500/50",
      rejected: "text-destructive border-destructive/50",
    };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  const filteredSubmissions = submissions.filter(s =>
    s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWaitlistCount = waitlistRequests.filter(r => r.status === "pending").length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === "pending").length;

  // CSV Export Functions
  const exportSubmissionsCSV = () => {
    if (filteredSubmissions.length === 0) return;
    
    const headers = ["Creator", "Video URL", "Status", "Views", "Earnings ($)", "Date", "Notes"];
    const rows = filteredSubmissions.map(s => [
      `@${s.username || "unknown"}`,
      s.video_url,
      s.status || "pending",
      s.views_count?.toString() || "0",
      s.estimated_earnings?.toString() || "0",
      format(new Date(s.created_at), "yyyy-MM-dd"),
      s.admin_notes || "",
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    downloadCSV(csvContent, `submissions-${selectedCampaign?.slug || "campaign"}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success(`Exported ${filteredSubmissions.length} submissions`);
  };

  const exportMembersCSV = () => {
    if (members.length === 0) return;
    
    const headers = ["Username", "Display Name", "Status", "Joined Date"];
    const rows = members.map(m => [
      `@${m.username || "unknown"}`,
      m.display_name || "",
      m.status || "active",
      m.joined_at ? format(new Date(m.joined_at), "yyyy-MM-dd") : "",
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    downloadCSV(csvContent, `members-${selectedCampaign?.slug || "campaign"}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success(`Exported ${members.length} members`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-bold text-lg mb-2">No Campaigns Yet</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          You haven't created any campaigns. Contact an admin to create campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Selector */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedCampaign?.id || ""}
          onValueChange={(id) => {
            const campaign = campaigns.find(c => c.id === id);
            setSelectedCampaign(campaign || null);
          }}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className={selectedCampaign?.status === "active" ? "text-green-500 border-green-500/50" : ""}>
          {selectedCampaign?.status || "unknown"}
        </Badge>
        <Button variant="outline" size="sm" onClick={fetchCampaignData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {selectedCampaign && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Members</span>
              </div>
              <p className="font-display text-2xl font-bold">{members.length}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Submissions</span>
              </div>
              <p className="font-display text-2xl font-bold">{submissions.length}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500">Pending</span>
              </div>
              <p className="font-display text-2xl font-bold">{pendingSubmissionsCount}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Budget</span>
              </div>
              <p className="font-display text-xl font-bold">
                ${(selectedCampaign.budget_spent || 0).toLocaleString()}
                <span className="text-sm text-muted-foreground font-normal">
                  /{selectedCampaign.budget_total ? `$${selectedCampaign.budget_total.toLocaleString()}` : "∞"}
                </span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Submissions</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="flex items-center gap-2 relative">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Waitlist</span>
                {pendingWaitlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingWaitlistCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Submissions Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportSubmissionsCSV()}
                  disabled={filteredSubmissions.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creator</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">@{s.username}</TableCell>
                          <TableCell>
                            <a
                              href={s.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell>{getStatusBadge(s.status || "pending")}</TableCell>
                          <TableCell className="text-right font-mono">
                            {s.views_count?.toLocaleString() || "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {s.estimated_earnings ? `$${s.estimated_earnings.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {s.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-500 border-green-500/50"
                                    onClick={() => {
                                      setApproveSubmission(s);
                                      setViewsInput("");
                                      setAdminNotes("");
                                      setUpdateMode("approve");
                                      setMarkPaidAfterUpdate(false);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/50"
                                    onClick={() => handleRejectSubmission(s.id)}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {s.status === "approved" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-500 border-blue-500/50"
                                    onClick={() => {
                                      setApproveSubmission(s);
                                      setViewsInput(s.views_count?.toString() || "");
                                      setAdminNotes(s.admin_notes || "");
                                      setUpdateMode("update");
                                      setMarkPaidAfterUpdate(false);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Update
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => setMarkPaidSubmission(s)}
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Pay
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/50"
                                    onClick={() => handleRejectSubmission(s.id)}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {s.status === "paid" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-500 border-blue-500/50"
                                    onClick={() => {
                                      setApproveSubmission(s);
                                      setViewsInput(s.views_count?.toString() || "");
                                      setAdminNotes(s.admin_notes || "");
                                      setUpdateMode("update");
                                      setMarkPaidAfterUpdate(false);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Update
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/50"
                                    onClick={() => handleRejectSubmission(s.id)}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-4">
              {members.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMembersCSV()}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              )}
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">@{member.username || member.display_name || "user"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {member.joined_at ? format(new Date(member.joined_at), "MMM d, yyyy") : "Recently"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Waitlist Tab */}
            <TabsContent value="waitlist" className="space-y-4 mt-4">
              {waitlistLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : waitlistRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No waitlist requests
                </div>
              ) : (
                <div className="space-y-3">
                  {waitlistRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">@{request.username}</p>
                          <Badge
                            variant="outline"
                            className={
                              request.status === "approved"
                                ? "text-green-500 border-green-500/50"
                                : request.status === "rejected"
                                ? "text-destructive border-destructive/50"
                                : "text-yellow-500 border-yellow-500/50"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.answers && request.answers.length > 0 && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.answers.join(" | ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(request.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 border-green-500/50"
                            onClick={() => handleApproveWaitlist(request.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/50"
                            onClick={() => handleRejectWaitlist(request.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Approve/Update Views Modal */}
      <Dialog open={!!approveSubmission} onOpenChange={() => { setApproveSubmission(null); setUpdateMode("approve"); setMarkPaidAfterUpdate(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{updateMode === "update" ? "Update Views" : "Approve Submission"}</DialogTitle>
            <DialogDescription>
              {updateMode === "update" 
                ? "Update views to recalculate earnings → adds to pending balance" 
                : "Enter the verified view count for this submission."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Views Count</label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={viewsInput}
                onChange={(e) => setViewsInput(e.target.value)}
              />
              {viewsInput && selectedCampaign && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-2">
                  <p className="text-sm text-muted-foreground">
                    {updateMode === "update" ? "Earnings (→ Pending Balance)" : "Estimated earnings"}
                  </p>
                  <p className="text-lg font-bold text-green-500">
                    ${calculateEarnings(parseInt(viewsInput) || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {updateMode === "update" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={markPaidAfterUpdate}
                  onChange={(e) => setMarkPaidAfterUpdate(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Also move to Available Balance (Mark Paid)</span>
              </label>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Notes (optional)</label>
              <Textarea
                placeholder="Add notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveSubmission(null); setUpdateMode("approve"); setMarkPaidAfterUpdate(false); }}>
              Cancel
            </Button>
            <Button onClick={handleApproveOrUpdateSubmission} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {updateMode === "update" 
                ? (markPaidAfterUpdate ? "Update & Pay" : "Update Views") 
                : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidSubmission} onOpenChange={() => setMarkPaidSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              This will add ${markPaidSubmission?.estimated_earnings?.toLocaleString() || 0} to the creator's available balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidSubmission(null)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={actionLoading} className="bg-green-500 hover:bg-green-600">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerCampaignsAdmin;

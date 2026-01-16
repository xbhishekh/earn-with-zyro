import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle, ExternalLink, Download, RefreshCw, DollarSign, Ban, Play, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { toast } from "sonner";
import { format } from "date-fns";

interface Submission {
  id: string;
  video_url: string;
  social_link: string | null;
  status: string;
  views_count: number;
  estimated_earnings: number;
  created_at: string;
  user_id: string;
  campaign_id: string;
  admin_notes: string | null;
}

interface Campaign {
  id: string;
  name: string;
  reward_per_1k_views: number;
  min_payout: number | null;
  max_payout: number | null;
  budget_total: number | null;
  budget_spent: number | null;
  status: string | null;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
}

const AdminSubmissions = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignIds, loading: accessLoading } = useAdminAccess();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Approve/Update Views modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [viewsInput, setViewsInput] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [updateMode, setUpdateMode] = useState<"approve" | "update">("approve");
  const [markPaidAfterUpdate, setMarkPaidAfterUpdate] = useState(false);
  
  // Mark Paid modal
  const [markPaidSubmission, setMarkPaidSubmission] = useState<Submission | null>(null);
  
  // Video Preview modal
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  useEffect(() => { 
    if (!accessLoading) fetchData(); 
  }, [statusFilter, accessLoading, hasFullAccess, myCampaignIds]);

  const fetchData = async () => {
    try {
      let submissionsQuery = supabase.from("submissions").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") submissionsQuery = submissionsQuery.eq("status", statusFilter);
      
      // Filter by campaigns for normal admin
      if (!hasFullAccess && myCampaignIds.length > 0) {
        submissionsQuery = submissionsQuery.in("campaign_id", myCampaignIds);
      } else if (!hasFullAccess && myCampaignIds.length === 0) {
        setSubmissions([]);
        setCampaigns([]);
        setProfiles([]);
        setLoading(false);
        return;
      }
      
      const [submissionsRes, campaignsRes, profilesRes] = await Promise.all([
        submissionsQuery,
        hasFullAccess 
          ? supabase.from("campaigns").select("id, name, reward_per_1k_views, min_payout, max_payout, budget_total, budget_spent, status")
          : supabase.from("campaigns").select("id, name, reward_per_1k_views, min_payout, max_payout, budget_total, budget_spent, status").in("id", myCampaignIds),
        supabase.from("profiles").select("user_id, username, display_name"),
      ]);

      if (submissionsRes.error) throw submissionsRes.error;
      setSubmissions(submissionsRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getCampaign = (campaignId: string): Campaign | undefined => {
    return campaigns.find(c => c.id === campaignId);
  };

  const getUsername = (userId: string): string => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.username || profile?.display_name || userId.slice(0, 8);
  };

  const calculateEarnings = (views: number, campaign: Campaign): number => {
    let earnings = (views / 1000) * campaign.reward_per_1k_views;
    if (campaign.min_payout && earnings < campaign.min_payout) {
      earnings = 0;
    }
    if (campaign.max_payout && earnings > campaign.max_payout) {
      earnings = campaign.max_payout;
    }
    return earnings;
  };

  const handleApproveOrUpdate = async () => {
    if (!selectedSubmission || !viewsInput) { 
      toast.error("Enter views count"); 
      return; 
    }
    const views = parseInt(viewsInput);
    if (isNaN(views) || views < 0) { 
      toast.error("Invalid views count"); 
      return; 
    }

    const campaign = getCampaign(selectedSubmission.campaign_id);
    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    setActionLoading(true);
    try {
      const earnings = calculateEarnings(views, campaign);
      const isUpdate = updateMode === "update";
      
      // Update submission with new views and earnings
      const { error } = await supabase
        .from("submissions")
        .update({ 
          status: isUpdate ? selectedSubmission.status : "approved", 
          views_count: views, 
          estimated_earnings: earnings,
          admin_notes: adminNotes || selectedSubmission.admin_notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;
      
      // If updating views for approved submission, create pending balance transaction
      if (isUpdate && selectedSubmission.status === "approved") {
        // Add earnings to pending balance
        const { error: txError } = await supabase
          .from("balance_transactions")
          .insert({
            user_id: selectedSubmission.user_id,
            amount: earnings,
            type: "pending_payout",
            status: "pending",
            campaign_id: selectedSubmission.campaign_id,
            submission_id: selectedSubmission.id,
            processed_by: user?.id,
            processed_at: new Date().toISOString(),
            notes: `Views update: ${views.toLocaleString()} views`,
          });

        if (txError) throw txError;

        // Update campaign budget
        const newBudgetSpent = (campaign.budget_spent || 0) + earnings;
        const updateData: any = { budget_spent: newBudgetSpent };

        if (campaign.budget_total && newBudgetSpent >= campaign.budget_total) {
          updateData.status = "paused";
          toast.warning("Campaign auto-paused: Budget depleted");
        }

        await supabase.from("campaigns").update(updateData).eq("id", campaign.id);

        // Notify user
        await supabase.from("notifications").insert({
          user_id: selectedSubmission.user_id,
          type: "payment_pending",
          title: "Earnings Added to Pending!",
          message: `$${earnings.toLocaleString()} has been added to your pending balance for ${views.toLocaleString()} views.`,
          metadata: { 
            amount: earnings, 
            views,
            campaign_id: campaign.id,
            submission_id: selectedSubmission.id,
          },
        });

        // Update submission to paid status after adding to pending
        await supabase.from("submissions").update({ status: "paid" }).eq("id", selectedSubmission.id);

        // If mark paid after update is checked, also move to available
        if (markPaidAfterUpdate) {
          await supabase
            .from("balance_transactions")
            .update({ status: "available" })
            .eq("submission_id", selectedSubmission.id)
            .eq("status", "pending");

          await supabase.from("notifications").insert({
            user_id: selectedSubmission.user_id,
            type: "payment_available",
            title: "Payment Available!",
            message: `$${earnings.toLocaleString()} is now available in your balance.`,
            metadata: { amount: earnings },
          });

          toast.success(`Updated & Paid! $${earnings.toLocaleString()} added to available balance`);
        } else {
          toast.success(`Updated! $${earnings.toLocaleString()} added to pending balance`);
        }
      } else {
        toast.success(`Approved! Estimated earnings: $${earnings.toLocaleString()}`);
      }
      
      setSelectedSubmission(null);
      setViewsInput("");
      setAdminNotes("");
      setMarkPaidAfterUpdate(false);
      setUpdateMode("approve");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error(updateMode === "update" ? "Failed to update views" : "Failed to approve submission");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ 
          status: "rejected",
          admin_notes: reason || "Rejected by admin",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Submission rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject");
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidSubmission) return;

    const campaign = getCampaign(markPaidSubmission.campaign_id);
    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    setActionLoading(true);
    try {
      const amount = markPaidSubmission.estimated_earnings;

      // Check if there's already a pending transaction for this submission
      const { data: existingTx } = await supabase
        .from("balance_transactions")
        .select("id, status")
        .eq("submission_id", markPaidSubmission.id)
        .eq("status", "pending")
        .single();

      if (existingTx) {
        // Move existing pending to available
        const { error: updateError } = await supabase
          .from("balance_transactions")
          .update({ 
            status: "available",
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
          })
          .eq("id", existingTx.id);

        if (updateError) throw updateError;

        toast.success(`Moved $${amount.toLocaleString()} from pending to available balance`);
      } else {
        // Create new available balance transaction directly
        const { error: txError } = await supabase
          .from("balance_transactions")
          .insert({
            user_id: markPaidSubmission.user_id,
            amount: amount,
            type: "payout",
            status: "available",
            campaign_id: markPaidSubmission.campaign_id,
            submission_id: markPaidSubmission.id,
            processed_by: user?.id,
            processed_at: new Date().toISOString(),
            notes: `Payout for submission ${markPaidSubmission.id.slice(0, 8)}`,
          });

        if (txError) throw txError;

        // Update campaign budget only for new transactions
        const newBudgetSpent = (campaign.budget_spent || 0) + amount;
        const updateData: any = { budget_spent: newBudgetSpent };

        if (campaign.budget_total && newBudgetSpent >= campaign.budget_total) {
          updateData.status = "paused";
          toast.warning("Campaign auto-paused: Budget depleted");
        }

        await supabase.from("campaigns").update(updateData).eq("id", campaign.id);

        toast.success(`Marked paid! $${amount.toLocaleString()} added to available balance`);
      }

      const { error: subError } = await supabase
        .from("submissions")
        .update({ status: "paid" })
        .eq("id", markPaidSubmission.id);

      if (subError) throw subError;

      await supabase.from("notifications").insert({
        user_id: markPaidSubmission.user_id,
        type: "payment_available",
        title: "Payment Available!",
        message: `$${amount.toLocaleString()} is now available in your balance for withdrawal.`,
        metadata: { 
          amount, 
          campaign_id: campaign.id,
          submission_id: markPaidSubmission.id,
        },
      });

      setMarkPaidSubmission(null);
      fetchData();
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error("Failed to mark as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { 
      pending: "text-yellow-500 border-yellow-500/50", 
      approved: "text-blue-500 border-blue-500/50", 
      paid: "text-green-500 border-green-500/50",
      rejected: "text-destructive border-destructive/50" 
    };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  const filteredSubmissions = submissions.filter(s => 
    getUsername(s.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state for normal admin
  if (!hasFullAccess && myCampaignIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Campaigns Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Create your first campaign to start receiving submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Submissions</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Review and manage all submissions" : "Review submissions for your campaigns"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="font-display text-2xl font-bold">{submissions.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-yellow-500">Pending</p>
          <p className="font-display text-2xl font-bold">{submissions.filter(s => s.status === "pending").length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-blue-500">Approved</p>
          <p className="font-display text-2xl font-bold">{submissions.filter(s => s.status === "approved").length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-green-500">Paid</p>
          <p className="font-display text-2xl font-bold">{submissions.filter(s => s.status === "paid").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by username or ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((s) => {
                const campaign = getCampaign(s.campaign_id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">@{getUsername(s.user_id)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {campaign?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.video_url && (s.video_url.includes('supabase') || s.video_url.endsWith('.mp4') || s.video_url.endsWith('.webm') || s.video_url.endsWith('.mov')) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => setVideoPreviewUrl(s.video_url)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                        ) : null}
                        <a 
                          href={s.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status || "pending")}</TableCell>
                    <TableCell className="text-right font-mono">
                      {s.views_count?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {s.estimated_earnings ? `$${s.estimated_earnings.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(s.created_at), "dd MMM")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {s.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-500 border-green-500/50 hover:bg-green-500/10" 
                              onClick={() => { 
                                setSelectedSubmission(s); 
                                setViewsInput(""); 
                                setAdminNotes("");
                                setUpdateMode("approve");
                                setMarkPaidAfterUpdate(false);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-destructive border-destructive/50 hover:bg-destructive/10" 
                              onClick={() => handleReject(s.id)}
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
                              className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                              onClick={() => { 
                                setSelectedSubmission(s); 
                                setViewsInput(s.views_count?.toString() || ""); 
                                setAdminNotes(s.admin_notes || "");
                                setUpdateMode("update");
                                setMarkPaidAfterUpdate(false);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Update Views
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => setMarkPaidSubmission(s)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          </>
                        )}
                        {s.status === "paid" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                            onClick={() => { 
                              setSelectedSubmission(s); 
                              setViewsInput(s.views_count?.toString() || ""); 
                              setAdminNotes(s.admin_notes || "");
                              setUpdateMode("update");
                              setMarkPaidAfterUpdate(false);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Update Views
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Approve/Update Views Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => { setSelectedSubmission(null); setUpdateMode("approve"); setMarkPaidAfterUpdate(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{updateMode === "update" ? "Update Views" : "Approve Submission"}</DialogTitle>
            <DialogDescription>
              {updateMode === "update" 
                ? "Update views to recalculate earnings → adds to pending balance" 
                : "Enter the view count to calculate earnings"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Views Count</label>
              <Input 
                type="number" 
                placeholder="Enter views" 
                value={viewsInput} 
                onChange={(e) => setViewsInput(e.target.value)} 
              />
            </div>
            
            {viewsInput && selectedSubmission && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {updateMode === "update" ? "Earnings (→ Pending Balance)" : "Estimated Earnings"}
                </p>
                <p className="font-display text-2xl font-bold text-green-500">
                  ${(() => {
                    const campaign = getCampaign(selectedSubmission.campaign_id);
                    if (!campaign) return 0;
                    return calculateEarnings(parseInt(viewsInput) || 0, campaign).toLocaleString();
                  })()}
                </p>
              </div>
            )}

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
              <label className="text-sm text-muted-foreground mb-2 block">Admin Notes (optional)</label>
              <Textarea 
                placeholder="Add any notes..." 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedSubmission(null); setUpdateMode("approve"); setMarkPaidAfterUpdate(false); }}>Cancel</Button>
            <Button onClick={handleApproveOrUpdate} disabled={actionLoading || !viewsInput}>
              {actionLoading 
                ? (updateMode === "update" ? "Updating..." : "Approving...") 
                : (updateMode === "update" 
                    ? (markPaidAfterUpdate ? "Update & Pay" : "Update Views") 
                    : "Approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidSubmission} onOpenChange={() => setMarkPaidSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Available Balance</DialogTitle>
            <DialogDescription>This will make funds available for withdrawal</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="font-display text-4xl font-bold text-green-500">
              ${markPaidSubmission?.estimated_earnings?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              to @{markPaidSubmission ? getUsername(markPaidSubmission.user_id) : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              → Moves to Available Balance (Withdrawable)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidSubmission(null)}>Cancel</Button>
            <Button 
              className="bg-green-500 hover:bg-green-600" 
              onClick={handleMarkPaid} 
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog open={!!videoPreviewUrl} onOpenChange={() => setVideoPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              Video Preview
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setVideoPreviewUrl(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {videoPreviewUrl && (
              <video 
                src={videoPreviewUrl} 
                controls 
                autoPlay
                className="w-full max-h-[70vh] rounded-lg bg-black"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;

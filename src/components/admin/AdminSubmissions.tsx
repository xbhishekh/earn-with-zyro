import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle, ExternalLink, Download, RefreshCw, DollarSign, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Approve modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [viewsInput, setViewsInput] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Mark Paid modal
  const [markPaidSubmission, setMarkPaidSubmission] = useState<Submission | null>(null);

  useEffect(() => { 
    fetchData(); 
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      let query = supabase.from("submissions").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      
      const [submissionsRes, campaignsRes, profilesRes] = await Promise.all([
        query,
        supabase.from("campaigns").select("id, name, reward_per_1k_views, min_payout, max_payout, budget_total, budget_spent, status"),
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
    
    // Apply min/max caps
    if (campaign.min_payout && earnings < campaign.min_payout) {
      earnings = 0; // Below minimum, no payout
    }
    if (campaign.max_payout && earnings > campaign.max_payout) {
      earnings = campaign.max_payout;
    }
    
    return earnings;
  };

  const handleApprove = async () => {
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
      
      const { error } = await supabase
        .from("submissions")
        .update({ 
          status: "approved", 
          views_count: views, 
          estimated_earnings: earnings,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;
      
      toast.success(`Approved! Estimated earnings: ₹${earnings.toLocaleString()}`);
      setSelectedSubmission(null);
      setViewsInput("");
      setAdminNotes("");
      fetchData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve submission");
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

      // 1. Create balance transaction (pending -> available)
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

      // 2. Update submission status to paid
      const { error: subError } = await supabase
        .from("submissions")
        .update({ status: "paid" })
        .eq("id", markPaidSubmission.id);

      if (subError) throw subError;

      // 3. Update campaign budget_spent
      const newBudgetSpent = (campaign.budget_spent || 0) + amount;
      const updateData: any = { budget_spent: newBudgetSpent };

      // 4. Auto-pause campaign if budget depleted
      if (campaign.budget_total && newBudgetSpent >= campaign.budget_total) {
        updateData.status = "paused";
        toast.warning("Campaign auto-paused: Budget depleted");
      }

      const { error: campError } = await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", campaign.id);

      if (campError) throw campError;

      // 5. Create notification for user
      await supabase.from("notifications").insert({
        user_id: markPaidSubmission.user_id,
        type: "payment_added",
        title: "Payment Added!",
        message: `₹${amount.toLocaleString()} has been added to your available balance.`,
        metadata: { 
          amount, 
          campaign_id: campaign.id,
          submission_id: markPaidSubmission.id,
        },
      });

      toast.success(`Marked paid! ₹${amount.toLocaleString()} added to user's balance`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Submissions</h1>
          <p className="text-muted-foreground">Review and manage creator submissions</p>
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
                      {s.estimated_earnings ? `₹${s.estimated_earnings.toLocaleString()}` : "-"}
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
                          <Button 
                            size="sm" 
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => setMarkPaidSubmission(s)}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Mark Paid
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

      {/* Approve Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Enter the view count to calculate earnings
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
                <p className="text-sm text-muted-foreground">Estimated Earnings</p>
                <p className="font-display text-2xl font-bold text-green-500">
                  ₹{(() => {
                    const campaign = getCampaign(selectedSubmission.campaign_id);
                    if (!campaign) return 0;
                    return calculateEarnings(parseInt(viewsInput) || 0, campaign).toLocaleString();
                  })()}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Notes (Optional)</label>
              <Textarea 
                placeholder="Add notes..." 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidSubmission} onOpenChange={() => setMarkPaidSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              This will add the earnings to the user's available balance
            </DialogDescription>
          </DialogHeader>
          {markPaidSubmission && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="font-medium">@{getUsername(markPaidSubmission.user_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{markPaidSubmission.views_count?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-display text-xl font-bold text-green-500">
                    ₹{markPaidSubmission.estimated_earnings?.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Budget warning */}
              {(() => {
                const campaign = getCampaign(markPaidSubmission.campaign_id);
                if (campaign?.budget_total) {
                  const newSpent = (campaign.budget_spent || 0) + markPaidSubmission.estimated_earnings;
                  const percentUsed = (newSpent / campaign.budget_total) * 100;
                  
                  if (newSpent >= campaign.budget_total) {
                    return (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                        <p className="text-yellow-600 font-medium">⚠️ Budget will be depleted</p>
                        <p className="text-muted-foreground">
                          Campaign will be auto-paused after this payment
                        </p>
                      </div>
                    );
                  } else if (percentUsed > 80) {
                    return (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                        <p className="text-yellow-600">
                          Budget: ₹{newSpent.toLocaleString()} / ₹{campaign.budget_total.toLocaleString()} ({percentUsed.toFixed(0)}% used)
                        </p>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidSubmission(null)}>Cancel</Button>
            <Button 
              onClick={handleMarkPaid} 
              disabled={actionLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              {actionLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;

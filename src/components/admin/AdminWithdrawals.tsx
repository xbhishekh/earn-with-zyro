import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, DollarSign, Clock, RefreshCw, Building2, Coins, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_details: any;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const AdminWithdrawals = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { 
    if (!accessLoading) fetchData(); 
  }, [accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  const fetchData = async () => {
    try {
      let withdrawalsQuery = supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
      
      // Filter for normal admin
      if (!hasFullAccess && myCampaignMemberUserIds.length > 0) {
        withdrawalsQuery = withdrawalsQuery.in("user_id", myCampaignMemberUserIds);
      } else if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
        setWithdrawals([]);
        setProfiles([]);
        setLoading(false);
        return;
      }
      
      const [withdrawalsRes, profilesRes] = await Promise.all([
        withdrawalsQuery,
        supabase.from("profiles").select("user_id, username, display_name, avatar_url"),
      ]);
      
      setWithdrawals(withdrawalsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const getProfile = (userId: string): Profile | undefined => {
    return profiles.find(p => p.user_id === userId);
  };

  const getUsername = (userId: string): string => {
    const profile = getProfile(userId);
    return profile?.username || profile?.display_name || userId.slice(0, 8);
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ 
          status: "completed",
          admin_notes: notes || null,
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      await supabase.from("balance_transactions").insert({
        user_id: selectedWithdrawal.user_id,
        amount: -selectedWithdrawal.amount,
        type: "withdrawal",
        status: "paid",
        notes: `Withdrawal completed - ${selectedWithdrawal.payment_method}`,
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      });

      await supabase.from("notifications").insert({
        user_id: selectedWithdrawal.user_id,
        type: "withdrawal_completed",
        title: "Withdrawal Completed! 💰",
        message: `Your withdrawal of $${selectedWithdrawal.amount.toLocaleString()} has been processed.`,
        metadata: { amount: selectedWithdrawal.amount, method: selectedWithdrawal.payment_method },
      });

      toast.success("Withdrawal completed!");
      setSelectedWithdrawal(null);
      setNotes("");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to complete withdrawal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !notes.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ 
          status: "rejected",
          admin_notes: notes,
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedWithdrawal.user_id,
        type: "withdrawal_rejected",
        title: "Withdrawal Rejected",
        message: `Your withdrawal request was rejected: ${notes}`,
      });

      toast.success("Withdrawal rejected");
      setSelectedWithdrawal(null);
      setNotes("");
      fetchData();
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const completedWithdrawals = withdrawals.filter(w => w.status === "completed");
  const totalPending = pendingWithdrawals.reduce((a, w) => a + Number(w.amount), 0);
  const totalCompleted = completedWithdrawals.reduce((a, w) => a + Number(w.amount), 0);

  const filteredWithdrawals = withdrawals.filter(w =>
    getUsername(w.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaign Members</h3>
        <p className="text-muted-foreground">Create a campaign and get members to see withdrawal requests here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Withdrawals</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Process all withdrawal requests" : "Process withdrawals from your campaign members"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-display text-xl font-bold">{pendingWithdrawals.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="font-display text-xl font-bold">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-display text-xl font-bold">{completedWithdrawals.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="font-display text-xl font-bold">${totalCompleted.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by username..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10" 
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWithdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No withdrawals found
                </TableCell>
              </TableRow>
            ) : (
              filteredWithdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {getProfile(w.user_id)?.avatar_url ? (
                          <img 
                            src={getProfile(w.user_id)?.avatar_url!} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs font-medium">{getUsername(w.user_id).charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium">@{getUsername(w.user_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-display font-bold">${Number(w.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {w.payment_method === "bank" ? (
                        <Building2 className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Coins className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="capitalize">{w.payment_method}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        w.status === "pending" ? "text-yellow-500 border-yellow-500/50" :
                        w.status === "completed" ? "text-green-500 border-green-500/50" :
                        "text-destructive border-destructive/50"
                      }
                    >
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(w.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setSelectedWithdrawal(w); setNotes(""); }}
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Withdrawal Request</DialogTitle>
            <DialogDescription>
              Process this withdrawal after verifying payment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {getProfile(selectedWithdrawal?.user_id || "")?.avatar_url ? (
                  <img 
                    src={getProfile(selectedWithdrawal?.user_id || "")?.avatar_url!} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <span className="font-medium">{getUsername(selectedWithdrawal?.user_id || "").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-medium">@{getUsername(selectedWithdrawal?.user_id || "")}</p>
                <p className="text-sm text-muted-foreground">Requested {selectedWithdrawal?.created_at && format(new Date(selectedWithdrawal.created_at), "dd MMM yyyy 'at' h:mm a")}</p>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-display text-3xl font-bold text-green-500">
                ${selectedWithdrawal?.amount?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {selectedWithdrawal?.payment_method === "bank" ? (
                  <Building2 className="w-5 h-5 text-blue-500" />
                ) : (
                  <Coins className="w-5 h-5 text-yellow-500" />
                )}
                <h4 className="font-medium capitalize">{selectedWithdrawal?.payment_method} Details</h4>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                {selectedWithdrawal?.payment_method === "bank" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Holder</span>
                      <span className="font-medium">{selectedWithdrawal?.payment_details?.accountHolder || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IFSC Code</span>
                      <span className="font-mono">{selectedWithdrawal?.payment_details?.ifscCode || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Number</span>
                      <span className="font-mono">{selectedWithdrawal?.payment_details?.accountNumber || "-"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="font-medium">{selectedWithdrawal?.payment_details?.network || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Wallet Address</span>
                      <p className="font-mono text-sm break-all mt-1">{selectedWithdrawal?.payment_details?.walletAddress || "-"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Notes (required for rejection)</label>
              <Textarea 
                placeholder="Enter notes..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              className="text-destructive" 
              onClick={handleReject} 
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600" 
              onClick={handleComplete} 
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;

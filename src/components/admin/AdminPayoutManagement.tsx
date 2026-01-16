import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Clock, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const AdminPayoutManagement = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ user_id: "", amount: "", type: "pending_payout", notes: "" });

  useEffect(() => { 
    if (!accessLoading) fetchData(); 
  }, [accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  const fetchData = async () => {
    try {
      let transactionsQuery = supabase.from("balance_transactions").select("*").order("created_at", { ascending: false }).limit(100);
      let profilesQuery = supabase.from("profiles").select("user_id, username, display_name").limit(500);
      
      // Filter for normal admin
      if (!hasFullAccess && myCampaignMemberUserIds.length > 0) {
        transactionsQuery = transactionsQuery.in("user_id", myCampaignMemberUserIds);
        profilesQuery = profilesQuery.in("user_id", myCampaignMemberUserIds);
      } else if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
        setTransactions([]);
        setProfiles([]);
        setLoading(false);
        return;
      }
      
      const [t, p] = await Promise.all([
        transactionsQuery,
        profilesQuery,
      ]);
      setTransactions(t.data || []);
      setProfiles(p.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.user_id || !formData.amount) { toast.error("User and amount required"); return; }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) { toast.error("Invalid amount"); return; }

    try {
      await supabase.from("balance_transactions").insert({
        user_id: formData.user_id,
        amount: formData.type === "deduction" ? -amount : amount,
        type: formData.type,
        status: formData.type === "pending_payout" ? "pending" : "available",
        notes: formData.notes || null,
      });
      toast.success("Created!");
      setIsModalOpen(false);
      setFormData({ user_id: "", amount: "", type: "pending_payout", notes: "" });
      fetchData();
    } catch { toast.error("Failed"); }
  };

  const totalPending = transactions.filter(t => t.status === "pending").reduce((a, t) => a + t.amount, 0);
  const totalAvailable = transactions.filter(t => t.status === "available").reduce((a, t) => a + t.amount, 0);

  if (loading || accessLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaign Members</h3>
        <p className="text-muted-foreground">Create a campaign and get members to manage payouts here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Payout Management</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Manage all transactions" : "Manage transactions for your campaign members"}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-xl font-bold">₹{totalPending.toLocaleString()}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Available</p><p className="font-display text-xl font-bold">₹{totalAvailable.toLocaleString()}</p></div></div>
        </motion.div>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
              </TableRow>
            ) : transactions.slice(0, 20).map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.user_id.slice(0, 8)}</TableCell>
                <TableCell className={`font-display font-bold ${t.amount < 0 ? "text-destructive" : "text-success"}`}>{t.amount < 0 ? "-" : "+"}₹{Math.abs(t.amount).toLocaleString()}</TableCell>
                <TableCell className="capitalize">{t.type.replace("_", " ")}</TableCell>
                <TableCell><Badge variant="outline" className={t.status === "pending" ? "text-warning border-warning" : "text-success border-success"}>{t.status}</Badge></TableCell>
                <TableCell>{format(new Date(t.created_at), "dd MMM")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || p.username || p.user_id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_payout">Pending Payout</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="deduction">Deduction</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayoutManagement;

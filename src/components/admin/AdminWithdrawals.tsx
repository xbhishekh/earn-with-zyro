import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const AdminWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchWithdrawals(); }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data } = await supabase.from("balance_transactions").select("*").eq("type", "withdrawal").order("created_at", { ascending: false });
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    setActionLoading(true);
    try {
      await supabase.from("balance_transactions").update({ status: "paid", notes, processed_by: user?.id, processed_at: new Date().toISOString() }).eq("id", selectedWithdrawal.id);
      toast.success("Approved!");
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch { toast.error("Failed"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    setActionLoading(true);
    try {
      await supabase.from("balance_transactions").update({ status: "rejected", notes, processed_by: user?.id }).eq("id", selectedWithdrawal.id);
      toast.success("Rejected");
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch { toast.error("Failed"); }
    finally { setActionLoading(false); }
  };

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const totalPending = withdrawals.filter(w => w.status === "pending").reduce((a, w) => a + Math.abs(w.amount), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Withdrawals</h1><p className="text-muted-foreground">Process withdrawal requests</p></div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-xl font-bold">{pendingCount}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Pending</p><p className="font-display text-xl font-bold">₹{totalPending.toLocaleString()}</p></div></div>
        </motion.div>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {withdrawals.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No withdrawals</TableCell></TableRow> : withdrawals.map(w => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}</TableCell>
                <TableCell className="font-display font-bold">₹{Math.abs(w.amount).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline" className={w.status === "pending" ? "text-warning border-warning" : w.status === "paid" ? "text-success border-success" : "text-destructive border-destructive"}>{w.status}</Badge></TableCell>
                <TableCell>{format(new Date(w.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right">{w.status === "pending" && <Button size="sm" variant="outline" onClick={() => { setSelectedWithdrawal(w); setNotes(""); }}>Review</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-display text-2xl font-bold">₹{Math.abs(selectedWithdrawal?.amount || 0).toLocaleString()}</p></div>
            <Textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="text-destructive" onClick={handleReject} disabled={actionLoading}><XCircle className="w-4 h-4 mr-2" />Reject</Button>
            <Button className="bg-success hover:bg-success/90" onClick={handleApprove} disabled={actionLoading}><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;

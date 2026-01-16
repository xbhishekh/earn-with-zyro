import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const AdminPayments = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { 
    if (!accessLoading) fetchTransactions(); 
  }, [accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  const fetchTransactions = async () => {
    try {
      let query = supabase.from("balance_transactions").select("*").in("status", ["pending", "available"]).order("created_at", { ascending: false });
      
      // Filter for normal admin - only show transactions from their campaign members
      if (!hasFullAccess && myCampaignMemberUserIds.length > 0) {
        query = query.in("user_id", myCampaignMemberUserIds);
      } else if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      const { data } = await query;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await supabase.from("balance_transactions").update({ status: "paid", processed_by: user?.id, processed_at: new Date().toISOString() }).eq("id", id);
      toast.success("Marked as paid!");
      fetchTransactions();
    } catch { toast.error("Failed"); }
  };

  const pendingAmount = transactions.filter(t => t.status === "pending").reduce((a, t) => a + t.amount, 0);
  const availableAmount = transactions.filter(t => t.status === "available").reduce((a, t) => a + t.amount, 0);

  if (loading || accessLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Show message for normal admins with no campaigns
  if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaign Members</h3>
        <p className="text-muted-foreground">Create a campaign and get members to see payment data here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Payments</h1>
        <p className="text-muted-foreground">
          {hasFullAccess ? "Process all pending payments" : "Process payments for your campaign members"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-xl font-bold">${pendingAmount.toLocaleString()}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Available</p><p className="font-display text-xl font-bold">${availableAmount.toLocaleString()}</p></div></div>
        </motion.div>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {transactions.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending</TableCell></TableRow> : transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.user_id.slice(0, 8)}</TableCell>
                <TableCell className="font-display font-bold text-success">${t.amount.toLocaleString()}</TableCell>
                <TableCell className="capitalize">{t.type.replace("_", " ")}</TableCell>
                <TableCell><Badge variant="outline" className={t.status === "pending" ? "text-warning border-warning" : "text-success border-success"}>{t.status}</Badge></TableCell>
                <TableCell>{format(new Date(t.created_at), "dd MMM")}</TableCell>
                <TableCell className="text-right">
                  {(t.status === "pending" || t.status === "available") && <Button size="sm" variant="outline" className="text-success border-success" onClick={() => handleMarkAsPaid(t.id)}><CheckCircle className="w-4 h-4 mr-1" />Paid</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default AdminPayments;

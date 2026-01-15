import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle, ExternalLink, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Submission {
  id: string;
  video_url: string;
  status: string;
  views_count: number;
  estimated_earnings: number;
  created_at: string;
  user_id: string;
  campaign_id: string;
}

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [viewsInput, setViewsInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchSubmissions(); }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      let query = supabase.from("submissions").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !viewsInput) { toast.error("Enter views count"); return; }
    const views = parseInt(viewsInput);
    if (isNaN(views) || views < 0) { toast.error("Invalid views"); return; }

    setActionLoading(true);
    try {
      const earnings = (views / 1000) * 10; // Default rate
      await supabase.from("submissions").update({ status: "approved", views_count: views, estimated_earnings: earnings }).eq("id", selectedSubmission.id);
      toast.success("Approved!");
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      toast.error("Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase.from("submissions").update({ status: "rejected" }).eq("id", id);
      toast.success("Rejected");
      fetchSubmissions();
    } catch (error) {
      toast.error("Failed");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: "text-warning border-warning", approved: "text-success border-success", rejected: "text-destructive border-destructive" };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold mb-1">Submissions</h1><p className="text-muted-foreground">Review creator submissions</p></div>
        <Button variant="outline" size="sm" onClick={fetchSubmissions}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Video</TableHead><TableHead>Status</TableHead><TableHead>Views</TableHead><TableHead>Earnings</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No submissions</TableCell></TableRow>
            ) : submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}</TableCell>
                <TableCell><a href={s.video_url} target="_blank" className="text-primary hover:underline flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a></TableCell>
                <TableCell>{getStatusBadge(s.status || "pending")}</TableCell>
                <TableCell>{s.views_count?.toLocaleString() || 0}</TableCell>
                <TableCell>₹{s.estimated_earnings?.toLocaleString() || 0}</TableCell>
                <TableCell>{format(new Date(s.created_at), "dd MMM")}</TableCell>
                <TableCell className="text-right">
                  {s.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-success border-success" onClick={() => { setSelectedSubmission(s); setViewsInput(""); }}><CheckCircle className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleReject(s.id)}><XCircle className="w-4 h-4" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm text-muted-foreground">Views Count</label><Input type="number" placeholder="Enter views" value={viewsInput} onChange={(e) => setViewsInput(e.target.value)} /></div>
            {viewsInput && <div className="p-4 bg-success/10 rounded-lg"><p className="text-sm text-muted-foreground">Estimated Earnings</p><p className="font-display text-2xl font-bold text-success">₹{((parseInt(viewsInput) || 0) / 1000 * 10).toLocaleString()}</p></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button><Button onClick={handleApprove} disabled={actionLoading}>{actionLoading ? "..." : "Approve"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;

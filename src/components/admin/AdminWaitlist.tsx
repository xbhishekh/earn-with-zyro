import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// Note: This component requires campaign_waitlist_requests table to be created
const AdminWaitlist = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const requests: any[] = []; // Will be populated when table is created

  const handleApprove = (id: string) => toast.success("Approved!");
  const handleReject = (id: string) => toast.success("Rejected");

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Waitlist Requests</h1><p className="text-muted-foreground">Review campaign join requests</p></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Campaign waitlist table (campaign_waitlist_requests) needs to be created for full functionality.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 inline-block">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-xl font-bold">{requests.length}</p></div></div>
      </motion.div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Campaign</TableHead><TableHead>Status</TableHead><TableHead>Answers</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests</TableCell></TableRow>
            ) : requests.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">@{r.username}</TableCell>
                <TableCell>{r.campaign}</TableCell>
                <TableCell><Badge variant="outline" className="text-warning border-warning">{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.answers?.join(", ")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="text-success border-success" onClick={() => handleApprove(r.id)}><CheckCircle className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleReject(r.id)}><XCircle className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default AdminWaitlist;

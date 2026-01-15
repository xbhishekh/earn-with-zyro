import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WaitlistRequest {
  id: string;
  user_id: string;
  campaign_id: string;
  status: string;
  answers: string[];
  created_at: string;
  username?: string;
  campaign_name?: string;
}

const AdminWaitlist = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<WaitlistRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_waitlist_requests")
        .select(`
          *,
          profiles!campaign_waitlist_requests_user_id_fkey(username),
          campaigns!campaign_waitlist_requests_campaign_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        // If foreign key relationship doesn't exist, fetch without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from("campaign_waitlist_requests")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (simpleError) throw simpleError;
        setRequests(simpleData || []);
      } else {
        const formatted = data?.map((r: any) => ({
          ...r,
          username: r.profiles?.username || "Unknown",
          campaign_name: r.campaigns?.name || "Unknown Campaign"
        })) || [];
        setRequests(formatted);
      }
    } catch (error) {
      console.error("Error fetching waitlist requests:", error);
      toast.error("Failed to load waitlist requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaign_waitlist_requests")
        .update({ 
          status: "approved", 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Request approved!");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaign_waitlist_requests")
        .update({ 
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const filteredRequests = requests.filter(r => 
    r.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Waitlist Requests</h1><p className="text-muted-foreground">Review campaign join requests</p></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 inline-block">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-xl font-bold">{pendingCount}</p></div></div>
      </motion.div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Campaign</TableHead><TableHead>Status</TableHead><TableHead>Answers</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No waitlist requests</TableCell></TableRow>
            ) : filteredRequests.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">@{r.username || "Unknown"}</TableCell>
                <TableCell>{r.campaign_name || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    r.status === "approved" ? "text-success border-success" :
                    r.status === "rejected" ? "text-destructive border-destructive" :
                    "text-warning border-warning"
                  }>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.answers?.join(", ") || "-"}</TableCell>
                <TableCell className="text-right">
                  {r.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-success border-success" onClick={() => handleApprove(r.id)}><CheckCircle className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleReject(r.id)}><XCircle className="w-4 h-4" /></Button>
                    </div>
                  )}
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

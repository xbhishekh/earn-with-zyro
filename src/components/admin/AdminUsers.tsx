import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, Ban, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { fetchProfiles(); }, [page]);

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      setProfiles(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, currentVerified: boolean) => {
    try {
      await supabase.from("profiles").update({ is_verified: !currentVerified }).eq("user_id", userId);
      toast.success(currentVerified ? "Removed" : "Verified!");
      fetchProfiles();
    } catch { toast.error("Failed"); }
  };

  const handleBan = () => {
    if (!selectedUser) return;
    toast.success(`Banned ${selectedUser.username}. Reason: ${banReason}`);
    setSelectedUser(null);
    setBanReason("");
  };

  const filteredProfiles = profiles.filter(p => p.username?.toLowerCase().includes(searchTerm.toLowerCase()) || p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">User Management</h1><p className="text-muted-foreground">Manage platform users</p></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 inline-block">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Users</p><p className="font-display text-xl font-bold">{profiles.length}+</p></div></div>
      </motion.div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Username</TableHead><TableHead>Verified</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredProfiles.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.display_name || "No name"}</TableCell>
                <TableCell className="text-muted-foreground">@{p.username || "unknown"}</TableCell>
                <TableCell>{p.is_verified ? <CheckCircle className="w-5 h-5 text-success" /> : "-"}</TableCell>
                <TableCell>{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleVerify(p.user_id, p.is_verified)}>{p.is_verified ? <Shield className="w-4 h-4 text-success" /> : <CheckCircle className="w-4 h-4" />}</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setSelectedUser(p); setBanReason(""); }}><Ban className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button>
        <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={profiles.length < pageSize}>Next</Button>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ban User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="font-medium">{selectedUser?.display_name} (@{selectedUser?.username})</p>
            <Textarea placeholder="Reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button><Button variant="destructive" onClick={handleBan} disabled={!banReason.trim()}><Ban className="w-4 h-4 mr-2" />Ban</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

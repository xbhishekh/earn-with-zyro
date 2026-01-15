import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Clock, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Invite {
  id: string;
  email: string;
  invite_code: string;
  invite_type: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const AdminInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    invite_type: "normal_admin",
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }

    setSubmitting(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase.from("admin_invites").insert({
        email: formData.email,
        invite_code: inviteCode,
        invite_type: formData.invite_type as "normal_admin" | "admin" | "super_admin",
        invited_by: user?.id!,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
      
      toast.success(`Invite created! Code: ${inviteCode}`);
      setIsModalOpen(false);
      setFormData({ email: "", invite_type: "normal_admin" });
      fetchInvites();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invite?")) return;
    
    try {
      const { error } = await supabase.from("admin_invites").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      fetchInvites();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired && status === "pending") {
      return <Badge variant="outline" className="text-destructive border-destructive">Expired</Badge>;
    }
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="text-success border-success">Accepted</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-destructive border-destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "super_admin":
        return <Badge className="bg-destructive text-white">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-primary text-white">Admin</Badge>;
      case "normal_admin":
        return <Badge variant="outline" className="text-primary border-primary">Normal Admin</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Admin Invites</h1>
          <p className="text-muted-foreground">Invite new administrators to the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInvites}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Invites</p>
          <p className="font-display text-2xl font-bold">{invites.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="font-display text-2xl font-bold text-warning">
            {invites.filter(i => i.status === "pending").length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="font-display text-2xl font-bold text-success">
            {invites.filter(i => i.status === "accepted").length}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No pending invites
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {invite.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{invite.invite_code}</code>
                  </TableCell>
                  <TableCell>{getTypeBadge(invite.invite_type)}</TableCell>
                  <TableCell>{getStatusBadge(invite.status, invite.expires_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(invite.expires_at), "dd MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {invite.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(invite.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Email *</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Type</label>
              <Select
                value={formData.invite_type}
                onValueChange={(v) => setFormData({ ...formData, invite_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select admin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal_admin">Normal Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Role Permissions:</p>
              <ul className="text-muted-foreground space-y-1">
                <li><strong>Normal Admin:</strong> Limited to assigned campaigns only</li>
                <li><strong>Admin:</strong> Full admin access except sensitive areas</li>
                <li><strong>Super Admin:</strong> Full access including user management</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending..." : "Create Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvites;

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
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

// Placeholder component - admin_invites table needs to be created
const AdminInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    invite_type: "normal_admin",
  });

  // Placeholder data
  const placeholderInvites = [
    {
      id: "1",
      email: "admin@example.com",
      invite_code: "ABC123",
      invite_type: "normal_admin",
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    setInvites(placeholderInvites);
    setLoading(false);
  }, []);

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, this would call an edge function to send the invite
      toast.success(`Invite sent to ${formData.email}!`);
      setIsModalOpen(false);
      setFormData({ email: "", invite_type: "normal_admin" });
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Admin
        </Button>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-4 border-l-4 border-l-primary"
      >
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Admin invites table needs to be created. This UI shows how invites will work:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
          <li>Send invites to email addresses</li>
          <li>Invites expire after 7 days</li>
          <li>Users join via unique invite link</li>
        </ul>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>{getTypeBadge(invite.invite_type)}</TableCell>
                  <TableCell>{getStatusBadge(invite.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(invite.expires_at), "dd MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(invite.created_at), "dd MMM yyyy")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Invite Modal */}
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
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Role Permissions:</p>
              <ul className="text-muted-foreground space-y-1">
                <li><strong>Normal Admin:</strong> Limited to assigned campaigns only</li>
                <li><strong>Super Admin:</strong> Full access to all admin features</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvites;

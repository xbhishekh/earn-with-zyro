import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, RefreshCw, Trash2, Building2, Loader2, CheckCircle, Clock } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface AdminEntry {
  id: string;
  email: string;
  invite_type: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

interface Campaign {
  id: string;
  name: string;
}

const AdminInvites = () => {
  const { user, isFounder, isOwner } = useAuth();
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    invite_type: "normal_admin",
    selected_campaigns: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, campaignsRes] = await Promise.all([
        supabase
          .from("admin_invites")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("campaigns")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      if (adminsRes.error) throw adminsRes.error;
      if (campaignsRes.error) throw campaignsRes.error;
      
      setAdmins(adminsRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
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

    if (formData.invite_type === "normal_admin" && formData.selected_campaigns.length === 0) {
      toast.error("Please select at least one campaign for Normal Admin");
      return;
    }

    // Check if email already exists in admin list
    const existingAdmin = admins.find(a => a.email.toLowerCase() === formData.email.toLowerCase());
    if (existingAdmin) {
      toast.error("This email is already in the admin list");
      return;
    }

    setSubmitting(true);
    try {
      // Generate a simple code (not used for verification, just for tracking)
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create the admin entry
      const { data: inviteData, error: inviteError } = await supabase.from("admin_invites").insert({
        email: formData.email,
        invite_code: inviteCode,
        invite_type: formData.invite_type as "normal_admin" | "admin" | "super_admin" | "founder" | "owner",
        invited_by: user?.id!,
        status: 'pending',
      }).select().single();

      if (inviteError) throw inviteError;

      // Try to assign role immediately if user already exists
      const { data: assignResultRaw, error: assignError } = await supabase.rpc(
        'assign_admin_role_if_user_exists',
        {
          invite_email: formData.email,
          invite_type: formData.invite_type,
          invited_by_user: user?.id!,
        }
      );

      if (assignError) {
        console.error("Error checking user:", assignError);
      }

      // Parse the result safely
      const assignResult = assignResultRaw as { user_exists?: boolean; user_id?: string; message?: string } | null;

      // If user exists and role was assigned, update invite status
      if (assignResult?.user_exists && assignResult?.user_id) {
        await supabase
          .from("admin_invites")
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq("id", inviteData.id);

        // If normal_admin, create campaign assignments
        if (formData.invite_type === "normal_admin" && formData.selected_campaigns.length > 0) {
          const assignments = formData.selected_campaigns.map(campaignId => ({
            admin_user_id: assignResult.user_id!,
            campaign_id: campaignId,
            assigned_by: user?.id!,
          }));

          await supabase.from("admin_campaign_assignments").insert(assignments);
        }

        toast.success(`${formData.email} is now an admin! They can access the admin panel immediately.`);
      } else {
        // User doesn't exist yet, store pending campaign assignments
        if (formData.invite_type === "normal_admin" && formData.selected_campaigns.length > 0) {
          const existingAssignments = JSON.parse(localStorage.getItem('pending_campaign_assignments') || '{}');
          existingAssignments[formData.email.toLowerCase()] = {
            campaigns: formData.selected_campaigns,
            assigned_by: user?.id,
          };
          localStorage.setItem('pending_campaign_assignments', JSON.stringify(existingAssignments));
        }

        toast.success(`${formData.email} added. They'll become admin when they sign up.`);
      }
      
      setIsModalOpen(false);
      setFormData({ email: "", invite_type: "normal_admin", selected_campaigns: [] });
      fetchData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to add admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from admin list?`)) return;
    
    try {
      const { error } = await supabase.from("admin_invites").delete().eq("id", id);
      if (error) throw error;
      toast.success("Removed from admin list");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const toggleCampaign = (campaignId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_campaigns: prev.selected_campaigns.includes(campaignId)
        ? prev.selected_campaigns.filter(id => id !== campaignId)
        : [...prev.selected_campaigns, campaignId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-warning border-warning">
            <Clock className="w-3 h-3 mr-1" />
            Waiting for Signup
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="text-success border-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active Admin
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "founder":
        return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">👑 Founder</Badge>;
      case "owner":
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white">🏆 Owner</Badge>;
      case "super_admin":
        return <Badge className="bg-destructive text-white">⭐ Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-primary text-white">Admin</Badge>;
      case "normal_admin":
        return <Badge variant="outline" className="text-primary border-primary">🛡️ Normal Admin</Badge>;
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
          <h1 className="font-display text-2xl font-bold mb-1">Manage Admins</h1>
          <p className="text-muted-foreground">Add or remove platform administrators</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Admins</p>
          <p className="font-display text-2xl font-bold">{admins.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Waiting for Signup</p>
          <p className="font-display text-2xl font-bold text-warning">
            {admins.filter(i => i.status === "pending").length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Active Admins</p>
          <p className="font-display text-2xl font-bold text-success">
            {admins.filter(i => i.status === "accepted").length}
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
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No admins added yet
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {admin.email}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(admin.invite_type)}</TableCell>
                  <TableCell>{getStatusBadge(admin.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(admin.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(admin.id, admin.email)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Email Address *</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If this user has an account, they'll become admin immediately. Otherwise, they'll become admin when they sign up.
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Type</label>
              <Select
                value={formData.invite_type}
                onValueChange={(v) => setFormData({ ...formData, invite_type: v, selected_campaigns: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select admin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal_admin">🛡️ Normal Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">⭐ Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.invite_type === "normal_admin" && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Assign Campaigns *
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No campaigns available
                    </p>
                  ) : (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleCampaign(campaign.id)}
                      >
                        <Checkbox
                          checked={formData.selected_campaigns.includes(campaign.id)}
                          onCheckedChange={() => toggleCampaign(campaign.id)}
                        />
                        <span className="text-sm">{campaign.name}</span>
                      </div>
                    ))
                  )}
                </div>
                {formData.selected_campaigns.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.selected_campaigns.length} campaign(s) selected
                  </p>
                )}
              </div>
            )}

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
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvites;
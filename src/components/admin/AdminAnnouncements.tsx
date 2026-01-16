import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Trash2, Pin, PinOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  campaign_id: string | null;
  admin_id: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignIds, loading: accessLoading } = useAdminAccess();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_pinned: false,
    campaign_id: "",
  });

  useEffect(() => {
    if (!accessLoading) fetchData();
  }, [accessLoading, hasFullAccess, myCampaignIds]);

  const fetchData = async () => {
    try {
      let announcementsQuery = supabase.from("announcements").select("*").order("created_at", { ascending: false });
      let campaignsQuery = supabase.from("campaigns").select("id, name");
      
      // Filter for normal admin - only show announcements for their campaigns
      if (!hasFullAccess) {
        if (myCampaignIds.length > 0) {
          announcementsQuery = announcementsQuery.in("campaign_id", myCampaignIds);
          campaignsQuery = campaignsQuery.in("id", myCampaignIds);
        } else {
          setAnnouncements([]);
          setCampaigns([]);
          setLoading(false);
          return;
        }
      }

      const [announcementsRes, campaignsRes] = await Promise.all([
        announcementsQuery,
        campaignsQuery,
      ]);

      if (announcementsRes.error) throw announcementsRes.error;
      setAnnouncements(announcementsRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content required");
      return;
    }

    // Normal admins must select one of their campaigns (no global announcements)
    if (!hasFullAccess && !formData.campaign_id) {
      toast.error("Please select a campaign for your announcement");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        content: formData.content,
        is_pinned: formData.is_pinned,
        campaign_id: formData.campaign_id || null,
        admin_id: user?.id,
      });

      if (error) throw error;
      toast.success("Announcement created!");
      setIsModalOpen(false);
      setFormData({ title: "", content: "", is_pinned: false, campaign_id: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: !currentPinned })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentPinned ? "Unpinned" : "Pinned!");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return "Global";
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign?.name || "Unknown";
  };

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFullAccess && myCampaignIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaigns</h3>
        <p className="text-muted-foreground">Create a campaign first to send announcements to your members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Announcements</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Broadcast messages to all creators" : "Send announcements to your campaign members"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">No announcements yet</h3>
          <p className="text-muted-foreground">Create your first announcement to broadcast to creators</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                    <h3 className="font-display font-bold">{a.title}</h3>
                    <Badge variant="outline">{getCampaignName(a.campaign_id)}</Badge>
                  </div>
                  <p className="text-muted-foreground">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(a.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePin(a.id, a.is_pinned)}
                  >
                    {a.is_pinned ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Title *</label>
              <Input
                placeholder="Announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Content *</label>
              <Textarea
                placeholder="Announcement content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Campaign {hasFullAccess ? "(optional)" : "*"}
              </label>
              <Select
                value={formData.campaign_id}
                onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={hasFullAccess ? "Global (all users)" : "Select campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {hasFullAccess && <SelectItem value="">Global (all users)</SelectItem>}
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_pinned" className="text-sm">Pin this announcement</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;

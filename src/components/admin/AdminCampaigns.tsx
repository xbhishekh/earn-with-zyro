import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Video,
  Users,
  DollarSign,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  reward_per_1k_views: number;
  min_payout: number | null;
  max_payout: number | null;
  budget_total: number | null;
  budget_spent: number | null;
  status: string | null;
  category: string | null;
  campaign_type: string | null;
  platforms: string[] | null;
  join_type: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const initialFormState = {
  name: "",
  slug: "",
  description: "",
  reward_per_1k_views: 0,
  min_payout: 0,
  max_payout: 0,
  budget_spent: 0,
  budget_total: 0,
  status: "active",
  category: "gaming",
  campaign_type: "ugc",
  platforms: [] as string[],
  join_type: "direct",
  thumbnail_url: "",
  rules_guidelines: "",
  rules_link: "",
};

const categories = ["gaming", "lifestyle", "tech", "food", "travel", "fashion", "education", "entertainment"];
const platformOptions = ["YouTube", "Instagram", "TikTok", "Twitter", "Facebook"];

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setSubmitting(true);
    try {
      const slug = formData.slug.trim() || generateSlug(formData.name);
      const campaignData = {
        name: formData.name,
        slug: slug,
        description: formData.description || null,
        reward_per_1k_views: formData.reward_per_1k_views,
        min_payout: formData.min_payout || null,
        max_payout: formData.max_payout || null,
        budget_total: formData.budget_total || null,
        status: formData.status,
        category: formData.category,
        campaign_type: formData.campaign_type,
        platforms: formData.platforms,
        join_type: formData.join_type,
        thumbnail_url: formData.thumbnail_url || null,
        rules_guidelines: formData.rules_guidelines || null,
        rules_link: formData.rules_link || null,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", editingCampaign.id);

        if (error) throw error;
        toast.success("Campaign updated!");
      } else {
        const { error } = await supabase.from("campaigns").insert(campaignData);
        if (error) throw error;
        toast.success("Campaign created!");
      }

      setIsModalOpen(false);
      setEditingCampaign(null);
      setFormData(initialFormState);
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error("Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      slug: campaign.slug || "",
      description: campaign.description || "",
      reward_per_1k_views: campaign.reward_per_1k_views,
      min_payout: campaign.min_payout || 0,
      max_payout: campaign.max_payout || 0,
      budget_total: campaign.budget_total || 0,
      budget_spent: campaign.budget_spent || 0,
      status: campaign.status || "active",
      category: campaign.category || "gaming",
      campaign_type: campaign.campaign_type || "ugc",
      platforms: campaign.platforms || [],
      join_type: campaign.join_type || "direct",
      thumbnail_url: campaign.thumbnail_url || "",
      rules_guidelines: "",
      rules_link: "",
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="font-display text-2xl font-bold mb-1">Campaigns</h1>
          <p className="text-muted-foreground">Manage all campaigns</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            {campaign.thumbnail_url ? (
              <img
                src={campaign.thumbnail_url}
                alt={campaign.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display font-bold text-lg line-clamp-1">{campaign.name}</h3>
                <Badge
                  variant="outline"
                  className={
                    campaign.status === "active"
                      ? "text-success border-success"
                      : "text-muted-foreground"
                  }
                >
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {campaign.description || "No description"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  ₹{campaign.reward_per_1k_views}/1K
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  {campaign.campaign_type?.toUpperCase()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(campaign)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(campaign.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create Campaign"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Name *</label>
              <Input
                placeholder="Campaign name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">zyrozo.com/</span>
                <Input
                  placeholder={formData.name ? generateSlug(formData.name) : "campaign-slug"}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from name</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description</label>
              <Textarea
                placeholder="Campaign description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Reward per 1K Views (₹)</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.reward_per_1k_views}
                  onChange={(e) => setFormData({ ...formData, reward_per_1k_views: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Min Payout (₹)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.min_payout}
                  onChange={(e) => setFormData({ ...formData, min_payout: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Max Payout (₹)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.max_payout}
                  onChange={(e) => setFormData({ ...formData, max_payout: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Total Budget (₹)</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.budget_total}
                  onChange={(e) => setFormData({ ...formData, budget_total: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {editingCampaign && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium block">Budget Spent</label>
                    <p className="text-2xl font-bold text-primary">₹{formData.budget_spent.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-sm text-muted-foreground block">Remaining</label>
                    <p className="text-lg font-semibold text-success">
                      ₹{(formData.budget_total - formData.budget_spent).toLocaleString()}
                    </p>
                  </div>
                </div>
                {formData.budget_total > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((formData.budget_spent / formData.budget_total) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((formData.budget_spent / formData.budget_total) * 100).toFixed(1)}% used
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Type</label>
                <Select value={formData.campaign_type} onValueChange={(v) => setFormData({ ...formData, campaign_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ugc">UGC</SelectItem>
                    <SelectItem value="clipping">Clipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Join Type</label>
                <Select value={formData.join_type} onValueChange={(v) => setFormData({ ...formData, join_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select join type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((platform) => (
                  <Badge
                    key={platform}
                    variant={formData.platforms.includes(platform) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Thumbnail URL</label>
              <Input
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingCampaign ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaigns;

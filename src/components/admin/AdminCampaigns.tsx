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
  Upload,
  X,
  ImageIcon,
  FileText,
  Link,
  Bold,
  List,
  Package,
  MessageCircle,
} from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { CampaignAssetsManager } from "./CampaignAssetsManager";
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
  video_url: string | null;
  rules_guidelines: string | null;
  rules_link: string | null;
  created_at: string;
}

interface CampaignAsset {
  id: string;
  campaign_id: string;
  asset_type: 'video' | 'image' | 'file' | 'link';
  title: string;
  description: string | null;
  url: string;
  file_name: string | null;
  file_size: number | null;
  is_required: boolean;
  sort_order: number;
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
  video_url: "",
  rules_guidelines: "",
  rules_link: "",
  welcome_message: "",
};

const categories = ["music", "personal-brand", "technology", "product", "entertainment", "logo", "slideshow", "fitness-health", "other"];
const platformOptions = ["YouTube", "Instagram", "TikTok", "Twitter", "Facebook"];

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRulesPreview, setShowRulesPreview] = useState(false);

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a campaign");
        setSubmitting(false);
        return;
      }

      const slug = formData.slug.trim() || generateSlug(formData.name);
      const campaignData = {
        name: formData.name,
        slug: slug,
        description: formData.description || null,
        reward_per_1k_views: formData.reward_per_1k_views || 0,
        min_payout: formData.min_payout || null,
        max_payout: formData.max_payout || null,
        budget_total: formData.budget_total || null,
        status: formData.status,
        category: formData.category,
        campaign_type: formData.campaign_type,
        platforms: formData.platforms.length > 0 ? formData.platforms : [],
        join_type: formData.join_type,
        thumbnail_url: formData.thumbnail_url || null,
        video_url: formData.video_url || null,
        rules_guidelines: formData.rules_guidelines || null,
        rules_link: formData.rules_link || null,
        welcome_message: formData.welcome_message || null,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", editingCampaign.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        toast.success("Campaign updated!");
      } else {
        const { error } = await supabase.from("campaigns").insert({
          ...campaignData,
          created_by: user.id,
        });
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        toast.success("Campaign created!");
      }

      setIsModalOpen(false);
      setEditingCampaign(null);
      setFormData(initialFormState);
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error?.message || "Failed to save campaign");
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
      video_url: campaign.video_url || "",
      rules_guidelines: campaign.rules_guidelines || "",
      rules_link: campaign.rules_link || "",
      welcome_message: (campaign as any).welcome_message || "",
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
              <img loading="lazy" decoding="async"
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
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  ${campaign.reward_per_1k_views}/1K
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  {campaign.campaign_type?.toUpperCase()}
                </div>
              </div>
              {campaign.budget_total && campaign.budget_total > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">
                      ${(campaign.budget_spent || 0).toLocaleString()} / ${campaign.budget_total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        ((campaign.budget_spent || 0) / campaign.budget_total) >= 0.9 
                          ? 'bg-destructive' 
                          : ((campaign.budget_spent || 0) / campaign.budget_total) >= 0.7 
                            ? 'bg-yellow-500' 
                            : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(((campaign.budget_spent || 0) / campaign.budget_total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
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
                <span className="text-sm text-muted-foreground">cliporax.com/</span>
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
                <label className="text-sm text-muted-foreground mb-2 block">Reward per 1K Views ($)</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.reward_per_1k_views}
                  onChange={(e) => setFormData({ ...formData, reward_per_1k_views: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Min Payout ($)</label>
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
                <label className="text-sm text-muted-foreground mb-2 block">Max Payout ($)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.max_payout}
                  onChange={(e) => setFormData({ ...formData, max_payout: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Total Budget ($)</label>
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
                    <p className="text-2xl font-bold text-primary">${formData.budget_spent.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-sm text-muted-foreground block">Remaining</label>
                    <p className="text-lg font-semibold text-success">
                      ${(formData.budget_total - formData.budget_spent).toLocaleString()}
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
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
                    onClick={() => togglePlatform(platform)}
                  >
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Campaign Thumbnail</label>
              {formData.thumbnail_url ? (
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img loading="lazy" decoding="async" 
                    src={formData.thumbnail_url} 
                    alt="Thumbnail preview" 
                    className="w-full h-40 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      
                      setUploading(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('campaign-thumbnails')
                          .upload(fileName, file);
                          
                        if (uploadError) throw uploadError;
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from('campaign-thumbnails')
                          .getPublicUrl(fileName);
                          
                        setFormData({ ...formData, thumbnail_url: publicUrl });
                        toast.success("Thumbnail uploaded!");
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast.error("Failed to upload thumbnail");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground mt-2">Or enter URL directly:</p>
              <Input
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="mt-1"
              />
            </div>
            
            {/* Video Preview URL */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Preview URL (optional)
              </label>
              <Input
                placeholder="https://example.com/video.mp4"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Add a video URL for campaign preview (MP4, WebM)</p>
              {formData.video_url && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <video 
                    src={formData.video_url} 
                    className="w-full h-32 object-cover" 
                    muted 
                    loop 
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Rules & Guidelines */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Rules & Guidelines
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!showRulesPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRulesPreview(false)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={showRulesPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRulesPreview(true)}
                  >
                    Preview
                  </Button>
                </div>
              </div>
              
              {!showRulesPreview ? (
                <div className="space-y-3">
                  {/* Formatting toolbar */}
                  <div className="flex gap-1 p-2 bg-muted rounded-lg">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const textarea = document.getElementById('rules-textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = formData.rules_guidelines;
                          const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                          setFormData({ ...formData, rules_guidelines: newText });
                        }
                      }}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          rules_guidelines: formData.rules_guidelines + '\n- ' 
                        });
                      }}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          rules_guidelines: formData.rules_guidelines + '\n## ' 
                        });
                      }}
                    >
                      H2
                    </Button>
                  </div>
                  <Textarea
                    id="rules-textarea"
                    placeholder="Enter campaign rules and guidelines...

Example:
## Content Requirements
- Videos must be at least 60 seconds long
- Must mention the brand name
- Include the product in frame

## Prohibited Content
- No competitor mentions
- No explicit content"
                    value={formData.rules_guidelines}
                    onChange={(e) => setFormData({ ...formData, rules_guidelines: e.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Markdown formatting: **bold**, ## headings, - bullet points
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 min-h-[200px] bg-muted/30 prose prose-sm max-w-none dark:prose-invert">
                  {formData.rules_guidelines ? (
                    <div className="whitespace-pre-wrap">
                      {formData.rules_guidelines.split('\n').map((line, index) => {
                        if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={index} className="ml-4">{line.replace('- ', '')}</li>;
                        }
                        if (line.includes('**')) {
                          const parts = line.split(/\*\*(.*?)\*\*/g);
                          return (
                            <p key={index}>
                              {parts.map((part, i) => 
                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        return line ? <p key={index}>{line}</p> : <br key={index} />;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No rules/guidelines added yet</p>
                  )}
                </div>
              )}
              
              {/* External rules link */}
              <div className="mt-3">
                <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                  <Link className="w-3 h-3" />
                  External Rules Link (optional)
                </label>
                <Input
                  placeholder="https://notion.so/your-rules-page"
                  value={formData.rules_link}
                  onChange={(e) => setFormData({ ...formData, rules_link: e.target.value })}
                />
              </div>
            </div>

            {/* Welcome Message - Auto DM on Join */}
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Welcome Message (Auto DM)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                This message will be automatically sent to the user's DM when they join this campaign
              </p>
              <Textarea
                placeholder="Welcome to our campaign! 🎉

Here's how to get started:
1. Read the campaign rules carefully
2. Create your content following our guidelines
3. Submit your video for review

If you have any questions, feel free to reach out to our support team. Good luck!"
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                rows={6}
              />
            </div>

            {/* Campaign Assets Manager - Only show when editing */}
            {editingCampaign && (
              <div className="border-t pt-4 mt-4">
                <CampaignAssetsManager 
                  campaignId={editingCampaign.id} 
                  campaignName={editingCampaign.name}
                />
              </div>
            )}
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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Video,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  GripVertical,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface CampaignAssetsManagerProps {
  campaignId: string;
  campaignName: string;
}

const assetTypeIcons = {
  video: Video,
  image: ImageIcon,
  file: FileText,
  link: LinkIcon,
};

const initialAssetForm = {
  asset_type: 'link' as 'video' | 'image' | 'file' | 'link',
  title: '',
  description: '',
  url: '',
  is_required: false,
};

export const CampaignAssetsManager = ({ campaignId, campaignName }: CampaignAssetsManagerProps) => {
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(initialAssetForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [campaignId]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_assets")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAssets(data as CampaignAsset[] || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!assetForm.title.trim() || !assetForm.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_assets").insert({
        campaign_id: campaignId,
        asset_type: assetForm.asset_type,
        title: assetForm.title,
        description: assetForm.description || null,
        url: assetForm.url,
        is_required: assetForm.is_required,
        sort_order: assets.length,
      });

      if (error) throw error;
      toast.success("Asset added!");
      setIsAddModalOpen(false);
      setAssetForm(initialAssetForm);
      fetchAssets();
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error("Failed to add asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const { error } = await supabase
        .from("campaign_assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;
      toast.success("Asset deleted");
      fetchAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(fileName);

      setAssetForm({
        ...assetForm,
        url: publicUrl,
        title: assetForm.title || file.name.replace(/\.[^/.]+$/, ''),
      });
      toast.success("File uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const getAssetIcon = (type: CampaignAsset['asset_type']) => {
    const Icon = assetTypeIcons[type];
    return <Icon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Campaign Assets</h3>
          <p className="text-sm text-muted-foreground">Manage downloadable files and links for {campaignName}</p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No assets added yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsAddModalOpen(true)}>
            Add First Asset
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                {getAssetIcon(asset.asset_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{asset.title}</p>
                  {asset.is_required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">{asset.asset_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {asset.description || asset.url}
                  {asset.file_size && ` • ${formatFileSize(asset.file_size)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Campaign Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Asset Type</label>
              <Select 
                value={assetForm.asset_type} 
                onValueChange={(v: 'video' | 'image' | 'file' | 'link') => setAssetForm({ ...assetForm, asset_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      External Link
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      File / Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Title *</label>
              <Input
                placeholder="Asset title"
                value={assetForm.title}
                onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description</label>
              <Textarea
                placeholder="Brief description of the asset"
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">URL *</label>
              {assetForm.asset_type !== 'link' && (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mb-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              )}
              <Input
                placeholder="https://..."
                value={assetForm.url}
                onChange={(e) => setAssetForm({ ...assetForm, url: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Mark as Required</label>
              <Switch
                checked={assetForm.is_required}
                onCheckedChange={(checked) => setAssetForm({ ...assetForm, is_required: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Video,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  GripVertical,
  Upload,
  Loader2,
  X,
  CheckCircle2,
  Files,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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

interface BulkUploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

const assetTypeIcons = {
  video: Video,
  image: ImageIcon,
  file: FileText,
  link: LinkIcon,
};

const initialAssetForm = {
  asset_type: 'file' as 'video' | 'image' | 'file' | 'link',
  title: '',
  description: '',
  url: '',
  is_required: false,
};

// Sortable Asset Item Component
const SortableAssetItem = ({ 
  asset, 
  onDelete, 
  formatFileSize 
}: { 
  asset: CampaignAsset; 
  onDelete: (id: string) => void;
  formatFileSize: (bytes: number | null) => string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getAssetIcon = (type: CampaignAsset['asset_type']) => {
    const Icon = assetTypeIcons[type];
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
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
          onClick={() => onDelete(asset.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const CampaignAssetsManager = ({ campaignId, campaignName }: CampaignAssetsManagerProps) => {
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(initialAssetForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<BulkUploadFile[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = assets.findIndex((a) => a.id === active.id);
      const newIndex = assets.findIndex((a) => a.id === over.id);

      const newAssets = arrayMove(assets, oldIndex, newIndex);
      setAssets(newAssets);

      // Update sort_order in database
      try {
        const updates = newAssets.map((asset, index) => ({
          id: asset.id,
          campaign_id: asset.campaign_id,
          asset_type: asset.asset_type,
          title: asset.title,
          url: asset.url,
          sort_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from("campaign_assets")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);
        }
        
        toast.success("Order updated!");
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Failed to update order");
        fetchAssets(); // Revert on error
      }
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

  // Bulk upload functions
  const handleBulkFilesSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: BulkUploadFile[] = Array.from(files).map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setBulkFiles(prev => [...prev, ...newFiles]);
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileAssetType = (file: File): 'video' | 'image' | 'file' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    return 'file';
  };

  const uploadBulkFiles = async () => {
    if (bulkFiles.length === 0) return;
    
    setBulkUploading(true);
    
    for (let i = 0; i < bulkFiles.length; i++) {
      const bulkFile = bulkFiles[i];
      if (bulkFile.status !== 'pending') continue;
      
      setBulkFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));
      
      try {
        if (bulkFile.file.size > 50 * 1024 * 1024) {
          throw new Error("File size must be less than 50MB");
        }

        const fileExt = bulkFile.file.name.split('.').pop();
        const fileName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-assets')
          .upload(fileName, bulkFile.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-assets')
          .getPublicUrl(fileName);

        // Create asset record
        const { error: insertError } = await supabase.from("campaign_assets").insert({
          campaign_id: campaignId,
          asset_type: getFileAssetType(bulkFile.file),
          title: bulkFile.file.name.replace(/\.[^/.]+$/, ''),
          url: publicUrl,
          file_name: bulkFile.file.name,
          file_size: bulkFile.file.size,
          is_required: false,
          sort_order: assets.length + i,
        });

        if (insertError) throw insertError;

        setBulkFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' as const, progress: 100, url: publicUrl } : f
        ));
      } catch (error: any) {
        console.error("Bulk upload error:", error);
        setBulkFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, error: error.message } : f
        ));
      }
    }
    
    setBulkUploading(false);
    toast.success("Bulk upload complete!");
    fetchAssets();
  };

  const closeBulkModal = () => {
    if (!bulkUploading) {
      setIsBulkModalOpen(false);
      setBulkFiles([]);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleBulkFilesSelect(e.dataTransfer.files);
  }, []);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)}>
            <Files className="w-4 h-4 mr-1" />
            Bulk Upload
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Asset
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <div 
          className="text-center py-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setIsBulkModalOpen(true)}
          onDragOver={handleDragOver}
          onDrop={(e) => {
            handleDrop(e);
            setIsBulkModalOpen(true);
          }}
        >
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No assets added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Drop files here or click to upload</p>
          <Button variant="outline" size="sm" className="mt-3">
            Add Assets
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={assets.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {assets.map((asset) => (
                <SortableAssetItem
                  key={asset.id}
                  asset={asset}
                  onDelete={handleDeleteAsset}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Drag and drop to reorder assets
      </p>

      {/* Add Asset Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Campaign Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload File First Section */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Upload File <span className="text-xs">(Video, Image, or Document)</span>
              </label>
              <label 
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : assetForm.url ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-green-500">File Uploaded!</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{assetForm.title || 'File ready'}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-medium text-primary">Click to upload</span> from your device
                      <br />or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Video, Image, PDF, ZIP • Max 50MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  accept="video/*,image/*,.pdf,.zip,.rar,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">OR paste a link</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">External URL</label>
              <Input
                placeholder="https://example.com/file.mp4"
                value={assetForm.url}
                onChange={(e) => setAssetForm({ ...assetForm, url: e.target.value, asset_type: 'link' })}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Title *</label>
              <Input
                placeholder="Asset title (auto-filled from file name)"
                value={assetForm.title}
                onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of the asset"
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                rows={2}
              />
            </div>

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
                  <SelectItem value="link">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      External Link
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={closeBulkModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Files className="w-5 h-5" />
              Bulk Upload Assets
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drop Zone */}
            <label
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-primary">Click to select files</span>
                <br />or drag and drop multiple files
              </p>
              <p className="text-xs text-muted-foreground mt-2">Max 50MB per file</p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleBulkFilesSelect(e.target.files)}
                disabled={bulkUploading}
              />
            </label>

            {/* File List */}
            {bulkFiles.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bulkFiles.map((bf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                      {bf.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {bf.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {bf.status === 'error' && <X className="w-4 h-4 text-destructive" />}
                      {bf.status === 'pending' && (
                        getFileAssetType(bf.file) === 'image' ? <ImageIcon className="w-4 h-4" /> :
                        getFileAssetType(bf.file) === 'video' ? <Video className="w-4 h-4" /> :
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bf.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(bf.file.size)}
                        {bf.error && <span className="text-destructive ml-2">{bf.error}</span>}
                      </p>
                      {bf.status === 'uploading' && (
                        <Progress value={bf.progress} className="h-1 mt-1" />
                      )}
                    </div>
                    {bf.status === 'pending' && !bulkUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeBulkModal} disabled={bulkUploading}>
              {bulkFiles.every(f => f.status === 'success') ? 'Done' : 'Cancel'}
            </Button>
            {bulkFiles.some(f => f.status === 'pending') && (
              <Button onClick={uploadBulkFiles} disabled={bulkUploading || bulkFiles.length === 0}>
                {bulkUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Upload {bulkFiles.filter(f => f.status === 'pending').length} Files
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

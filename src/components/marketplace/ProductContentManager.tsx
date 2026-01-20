import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, GripVertical, FileText, Video, Link as LinkIcon,
  Youtube, Radio, Code, Download, ChevronDown, ChevronUp, Edit2,
  Folder, Eye, EyeOff, Loader2, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentModule {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
}

interface ContentItem {
  id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  content_data: Record<string, any> | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  is_free_preview: boolean;
}

interface ProductContentManagerProps {
  productId: string;
  onContentChange?: () => void;
}

const CONTENT_TYPES = [
  { id: "text", label: "Text/Article", icon: FileText },
  { id: "video", label: "Video Upload", icon: Video },
  { id: "youtube", label: "YouTube Video", icon: Youtube },
  { id: "file", label: "Downloadable File", icon: Download },
  { id: "link", label: "External Link", icon: LinkIcon },
  { id: "livestream", label: "Live Stream", icon: Radio },
  { id: "embed", label: "Custom Embed", icon: Code },
];

const ProductContentManager = ({ productId, onContentChange }: ProductContentManagerProps) => {
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ContentModule | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    content_type: "text",
    content_data: {} as Record<string, any>,
    is_published: true,
    is_free_preview: false,
  });

  useEffect(() => {
    if (productId) {
      fetchContent();
    }
  }, [productId]);

  const fetchContent = async () => {
    setLoading(true);
    
    const [modulesRes, itemsRes] = await Promise.all([
      supabase
        .from("product_content_modules")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_content_items")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
    ]);

    if (modulesRes.data) setModules(modulesRes.data);
    if (itemsRes.data) {
      setItems(itemsRes.data.map(item => ({
        ...item,
        content_data: item.content_data as Record<string, any> | null
      })));
    }
    
    setLoading(false);
  };

  // Module CRUD
  const openModuleModal = (module?: ContentModule) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({ title: module.title, description: module.description || "" });
    } else {
      setEditingModule(null);
      setModuleForm({ title: "", description: "" });
    }
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }

    setSaving(true);

    try {
      if (editingModule) {
        const { error } = await supabase
          .from("product_content_modules")
          .update({
            title: moduleForm.title,
            description: moduleForm.description || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingModule.id);

        if (error) throw error;
        toast.success("Module updated");
      } else {
        const { error } = await supabase
          .from("product_content_modules")
          .insert({
            product_id: productId,
            title: moduleForm.title,
            description: moduleForm.description || null,
            sort_order: modules.length
          });

        if (error) throw error;
        toast.success("Module created");
      }

      setShowModuleModal(false);
      fetchContent();
      onContentChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its content?")) return;

    try {
      const { error } = await supabase
        .from("product_content_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;
      toast.success("Module deleted");
      fetchContent();
      onContentChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete module");
    }
  };

  const toggleModulePublished = async (module: ContentModule) => {
    try {
      const { error } = await supabase
        .from("product_content_modules")
        .update({ is_published: !module.is_published })
        .eq("id", module.id);

      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Item CRUD
  const openItemModal = (moduleId: string | null, item?: ContentItem) => {
    setSelectedModuleId(moduleId);
    if (item) {
      setEditingItem(item);
      setItemForm({
        title: item.title,
        description: item.description || "",
        content_type: item.content_type,
        content_data: item.content_data || {},
        is_published: item.is_published,
        is_free_preview: item.is_free_preview,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        title: "",
        description: "",
        content_type: "text",
        content_data: {},
        is_published: true,
        is_free_preview: false,
      });
    }
    setShowItemModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-content")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("product-content")
        .getPublicUrl(fileName);

      setItemForm(prev => ({
        ...prev,
        content_data: {
          ...prev.content_data,
          [field]: urlData.publicUrl,
          file_size: file.size,
          file_name: file.name
        }
      }));

      toast.success("File uploaded");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveItem = async () => {
    if (!itemForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    try {
      const moduleItems = items.filter(i => i.module_id === selectedModuleId);

      if (editingItem) {
        const { error } = await supabase
          .from("product_content_items")
          .update({
            title: itemForm.title,
            description: itemForm.description || null,
            content_type: itemForm.content_type,
            content_data: itemForm.content_data,
            is_published: itemForm.is_published,
            is_free_preview: itemForm.is_free_preview,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Content updated");
      } else {
        const { error } = await supabase
          .from("product_content_items")
          .insert({
            product_id: productId,
            module_id: selectedModuleId,
            title: itemForm.title,
            description: itemForm.description || null,
            content_type: itemForm.content_type,
            content_data: itemForm.content_data,
            is_published: itemForm.is_published,
            is_free_preview: itemForm.is_free_preview,
            sort_order: moduleItems.length
          });

        if (error) throw error;
        toast.success("Content added");
      }

      setShowItemModal(false);
      fetchContent();
      onContentChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Delete this content item?")) return;

    try {
      const { error } = await supabase
        .from("product_content_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Content deleted");
      fetchContent();
      onContentChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete content");
    }
  };

  const toggleItemPublished = async (item: ContentItem) => {
    try {
      const { error } = await supabase
        .from("product_content_items")
        .update({ is_published: !item.is_published })
        .eq("id", item.id);

      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const found = CONTENT_TYPES.find(t => t.id === type);
    return found?.icon || FileText;
  };

  const renderContentFields = () => {
    switch (itemForm.content_type) {
      case "text":
        return (
          <div>
            <Label>Content</Label>
            <Textarea
              value={itemForm.content_data.text_content || ""}
              onChange={(e) => setItemForm(prev => ({
                ...prev,
                content_data: { ...prev.content_data, text_content: e.target.value }
              }))}
              placeholder="Enter your text content here..."
              rows={8}
              className="mt-1"
            />
          </div>
        );

      case "youtube":
        return (
          <div>
            <Label>YouTube URL or Video ID</Label>
            <Input
              value={itemForm.content_data.url || ""}
              onChange={(e) => setItemForm(prev => ({
                ...prev,
                content_data: { ...prev.content_data, url: e.target.value }
              }))}
              placeholder="https://youtube.com/watch?v=... or video ID"
              className="mt-1"
            />
          </div>
        );

      case "video":
        return (
          <div className="space-y-3">
            <Label>Upload Video</Label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e, "url")}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={uploading}
            />
            {itemForm.content_data.url && (
              <p className="text-sm text-muted-foreground truncate">
                Uploaded: {itemForm.content_data.file_name || "Video"}
              </p>
            )}
          </div>
        );

      case "file":
        return (
          <div className="space-y-3">
            <Label>Upload File</Label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, "url")}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={uploading}
            />
            {itemForm.content_data.url && (
              <p className="text-sm text-muted-foreground truncate">
                Uploaded: {itemForm.content_data.file_name || "File"}
              </p>
            )}
          </div>
        );

      case "link":
        return (
          <div>
            <Label>External URL</Label>
            <Input
              value={itemForm.content_data.url || ""}
              onChange={(e) => setItemForm(prev => ({
                ...prev,
                content_data: { ...prev.content_data, url: e.target.value }
              }))}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>
        );

      case "livestream":
        return (
          <div className="space-y-4">
            <div>
              <Label>Stream URL (optional)</Label>
              <Input
                value={itemForm.content_data.url || ""}
                onChange={(e) => setItemForm(prev => ({
                  ...prev,
                  content_data: { ...prev.content_data, url: e.target.value }
                }))}
                placeholder="https://youtube.com/live/... or other stream URL"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Embed Code (optional)</Label>
              <Textarea
                value={itemForm.content_data.embed_code || ""}
                onChange={(e) => setItemForm(prev => ({
                  ...prev,
                  content_data: { ...prev.content_data, embed_code: e.target.value }
                }))}
                placeholder="<iframe>...</iframe>"
                rows={4}
                className="mt-1 font-mono text-sm"
              />
            </div>
          </div>
        );

      case "embed":
        return (
          <div>
            <Label>Embed Code</Label>
            <Textarea
              value={itemForm.content_data.embed_code || ""}
              onChange={(e) => setItemForm(prev => ({
                ...prev,
                content_data: { ...prev.content_data, embed_code: e.target.value }
              }))}
              placeholder="<iframe>...</iframe> or any HTML embed code"
              rows={6}
              className="mt-1 font-mono text-sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const standaloneItems = items.filter(i => !i.module_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Content</h3>
          <p className="text-sm text-muted-foreground">
            Add lessons, videos, files, and more for your members
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openModuleModal()}>
            <Folder className="w-4 h-4 mr-2" />
            Add Module
          </Button>
          <Button size="sm" onClick={() => openItemModal(null)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Standalone Items */}
      {standaloneItems.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Standalone Content
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {standaloneItems.map(item => {
                const Icon = getContentTypeIcon(item.content_type);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="flex-1 font-medium truncate">{item.title}</span>
                    <div className="flex items-center gap-2">
                      {item.is_free_preview && (
                        <Badge variant="secondary" className="text-xs">Free Preview</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleItemPublished(item)}
                      >
                        {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openItemModal(null, item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      {modules.map(module => {
        const moduleItems = items.filter(i => i.module_id === module.id);
        
        return (
          <Card key={module.id} className={!module.is_published ? "opacity-60" : ""}>
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <Folder className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <CardTitle className="text-base">{module.title}</CardTitle>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
                  )}
                </div>
                <Badge variant="outline">{moduleItems.length} items</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleModulePublished(module)}
                >
                  {module.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openModuleModal(module)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteModule(module.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {moduleItems.map(item => {
                  const Icon = getContentTypeIcon(item.content_type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="flex-1 font-medium truncate">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.is_free_preview && (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleItemPublished(item)}
                        >
                          {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openItemModal(module.id, item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full border-2 border-dashed"
                onClick={() => openItemModal(module.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Content to Module
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {modules.length === 0 && standaloneItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-semibold mb-2">No content yet</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add modules and content for your members to access after purchase
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openModuleModal()}>
                <Folder className="w-4 h-4 mr-2" />
                Create Module
              </Button>
              <Button onClick={() => openItemModal(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Modal */}
      <Dialog open={showModuleModal} onOpenChange={setShowModuleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Getting Started"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="module-desc">Description (optional)</Label>
              <Textarea
                id="module-desc"
                value={moduleForm.description}
                onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this module"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleModal(false)}>Cancel</Button>
            <Button onClick={saveModule} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingModule ? "Save Changes" : "Create Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Content" : "Add Content"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="item-title">Title *</Label>
              <Input
                id="item-title"
                value={itemForm.title}
                onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Introduction Video"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="item-desc">Description (optional)</Label>
              <Textarea
                id="item-desc"
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Content Type</Label>
              <Select
                value={itemForm.content_type}
                onValueChange={(v) => setItemForm(prev => ({ 
                  ...prev, 
                  content_type: v,
                  content_data: {} // Reset content data when type changes
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderContentFields()}

            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={itemForm.is_published}
                  onCheckedChange={(c) => setItemForm(prev => ({ ...prev, is_published: c }))}
                />
                <Label htmlFor="published" className="font-normal">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="free-preview"
                  checked={itemForm.is_free_preview}
                  onCheckedChange={(c) => setItemForm(prev => ({ ...prev, is_free_preview: c }))}
                />
                <Label htmlFor="free-preview" className="font-normal">Free Preview</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Save Changes" : "Add Content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductContentManager;

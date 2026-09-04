import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, Plus, Trash2, Loader2, Image as ImageIcon,
  BookOpen, Crown, Wrench, MessageSquare, FileText, Users, Package, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/landing/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductContentManager from "@/components/marketplace/ProductContentManager";

const CATEGORIES = [
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "memberships", label: "Memberships", icon: Crown },
  { id: "software", label: "Software", icon: Wrench },
  { id: "communities", label: "Communities", icon: MessageSquare },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "services", label: "Services", icon: Users },
  { id: "coaching", label: "Coaching", icon: Users },
  { id: "ebooks", label: "Ebooks", icon: BookOpen },
];

const PRODUCT_TYPES = [
  { id: "free", label: "Free" },
  { id: "one_time", label: "One-time Payment" },
  { id: "subscription", label: "Subscription" },
];

const MarketplaceCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isSuperAdmin, isOwner, role } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    category: "courses",
    product_type: "one_time",
    price: 0,
    subscription_interval: "month",
    thumbnail_url: "",
    gallery_images: [] as string[],
    features: [""],
    faqs: [{ question: "", answer: "" }],
    is_active: true,
  });

  const isAdminUser = isAdmin || isSuperAdmin || isOwner || role === "normal_admin" || role === "founder";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Only admins can create products
    if (!isAdminUser) {
      navigate("/marketplace");
      return;
    }
    if (isEditing) {
      fetchProduct();
    }
  }, [user, id, isAdminUser]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Product not found");
      navigate("/marketplace");
      return;
    }

    if (data.seller_id !== user?.id) {
      toast.error("You can only edit your own products");
      navigate("/marketplace");
      return;
    }

    // Parse FAQs
    let parsedFaqs = [{ question: "", answer: "" }];
    try {
      parsedFaqs = typeof data.faqs === 'string' ? JSON.parse(data.faqs) : data.faqs || parsedFaqs;
    } catch {
      parsedFaqs = [{ question: "", answer: "" }];
    }

    setFormData({
      title: data.title || "",
      slug: data.slug || "",
      short_description: data.short_description || "",
      description: data.description || "",
      category: data.category || "courses",
      product_type: data.product_type || "one_time",
      price: data.price || 0,
      subscription_interval: data.subscription_interval || "month",
      thumbnail_url: data.thumbnail_url || "",
      gallery_images: data.gallery_images || [],
      features: data.features?.length > 0 ? data.features : [""],
      faqs: parsedFaqs.length > 0 ? parsedFaqs : [{ question: "", answer: "" }],
      is_active: data.is_active ?? true,
    });
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "gallery") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (error) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    if (type === "thumbnail") {
      setFormData(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
    } else {
      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, urlData.publicUrl],
      }));
    }
    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setLoading(true);

    const productData = {
      seller_id: user.id,
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      short_description: formData.short_description,
      description: formData.description,
      category: formData.category,
      product_type: formData.product_type,
      price: formData.product_type === "free" ? 0 : formData.price,
      subscription_interval: formData.product_type === "subscription" ? formData.subscription_interval : null,
      thumbnail_url: formData.thumbnail_url,
      gallery_images: formData.gallery_images,
      features: formData.features.filter(f => f.trim()),
      faqs: formData.faqs.filter(f => f.question.trim() && f.answer.trim()),
      is_active: formData.is_active,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("marketplace_products")
          .update(productData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Product updated successfully!");
      } else {
        const { error } = await supabase
          .from("marketplace_products")
          .insert(productData);

        if (error) throw error;
        toast.success("Product created successfully!");
      }

      navigate("/marketplace");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Edit Product" : "Create a Product"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Sell courses, memberships, software, services and more
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Content Management for Editing */}
            {isEditing && (
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Member Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add videos, lessons, files, and more for members who purchase this product.
                  </p>
                  <ProductContentManager productId={id!} />
                </CardContent>
              </Card>
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Trading Masterclass"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="trading-masterclass"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    /marketplace/{formData.slug || "your-product-slug"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="A brief tagline for your product"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your product includes..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Type</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, product_type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.product_type !== "free" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        min={0}
                        className="mt-1"
                      />
                    </div>

                    {formData.product_type === "subscription" && (
                      <div>
                        <Label>Billing Interval</Label>
                        <Select
                          value={formData.subscription_interval}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, subscription_interval: v }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                            <SelectItem value="year">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Thumbnail</Label>
                  <div className="mt-2">
                    {formData.thumbnail_url ? (
                      <div className="relative w-full max-w-md">
                        <img loading="lazy" decoding="async"
                          src={formData.thumbnail_url}
                          alt="Thumbnail"
                          className="w-full aspect-video object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: "" }))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full max-w-md aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "thumbnail")}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Gallery Images</Label>
                  <div className="mt-2 grid grid-cols-4 gap-3">
                    {formData.gallery_images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img loading="lazy" decoding="async"
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 w-6 h-6"
                          onClick={() => removeGalleryImage(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "gallery")}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      placeholder="e.g., Lifetime access to course content"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFeature(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card>
              <CardHeader>
                <CardTitle>FAQs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.faqs.map((faq, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-3">
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFaq(idx, "question", e.target.value)}
                          placeholder="Question"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                          placeholder="Answer"
                          rows={2}
                        />
                      </div>
                      {formData.faqs.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFaq(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFaq}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this product visible in the marketplace
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default MarketplaceCreate;

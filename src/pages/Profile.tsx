import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, 
  Camera, 
  Save, 
  MapPin,
  AtSign,
  FileText,
  CreditCard,
  Shield,
  Loader2,
  Share2,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Tags,
  Plus,
  Eye,
  Edit,
  Trash2,
  Video,
  DollarSign,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import LinkedSocialAccounts from "@/components/dashboard/LinkedSocialAccounts";
import { MainLayout } from "@/components/layout/MainLayout";
import SupportChatWidget from "@/components/SupportChatWidget";
import SellerAnalytics from "@/components/dashboard/SellerAnalytics";
import SellerBuyersManager from "@/components/dashboard/SellerBuyersManager";
import DiscountCodesManager from "@/components/dashboard/DiscountCodesManager";
import SellerCampaignsAdmin from "@/components/dashboard/SellerCampaignsAdmin";
import AffiliateCenter from "@/components/dashboard/AffiliateCenter";
import AccountSwitcher from "@/components/profile/AccountSwitcher";
import PayUserModal from "@/components/profile/PayUserModal";
import TransactionHistory from "@/components/profile/TransactionHistory";

interface ProfileData {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  show_total_earned: boolean;
  show_location: boolean;
  show_owned_products: boolean;
  show_joined_products: boolean;
  payment_details: {
    upi_id?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
  } | null;
}

interface MyProduct {
  id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  price: number;
  product_type: string;
  subscription_interval: string | null;
  members_count: number;
  views_count: number;
  is_active: boolean;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin, isSuperAdmin, isOwner, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  
  // Check if user is an admin (can create products/campaigns)
  const isAdminUser = isAdmin || isSuperAdmin || isOwner || role === "normal_admin";
  
  // Seller Dashboard states
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sellerDashboardTab, setSellerDashboardTab] = useState("products");
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [showTotalEarned, setShowTotalEarned] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showOwnedProducts, setShowOwnedProducts] = useState(false);
  const [showJoinedProducts, setShowJoinedProducts] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyProducts();
      fetchAvailableBalance();
    }
  }, [user]);

  const fetchAvailableBalance = async () => {
    try {
      const { data, error } = await supabase
        .from("balance_transactions")
        .select("amount, status")
        .eq("user_id", user!.id)
        .eq("status", "completed");

      if (error) throw error;

      const total = (data || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
      setAvailableBalance(Math.max(0, total));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as ProfileData);
        setDisplayName(data.display_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setShowTotalEarned(data.show_total_earned || false);
        setShowLocation(data.show_location || false);
        setShowOwnedProducts(data.show_owned_products || false);
        setShowJoinedProducts(data.show_joined_products || false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    setProductsLoading(true);
    const { data } = await supabase
      .from("marketplace_products")
      .select("id, title, slug, thumbnail_url, price, product_type, subscription_interval, members_count, views_count, is_active, created_at")
      .eq("seller_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMyProducts(data);
    }
    setProductsLoading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    const { error } = await supabase
      .from("marketplace_products")
      .delete()
      .eq("id", productId)
      .eq("seller_id", user!.id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      setMyProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const formatPrice = (price: number, type: string, interval: string | null) => {
    if (type === "free" || price === 0) return "Free";
    const formatted = `₹${price.toLocaleString()}`;
    if (type === "subscription" && interval) {
      return `${formatted}/${interval}`;
    }
    return formatted;
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user!.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          username: username,
          bio: bio,
          location: location,
          show_total_earned: showTotalEarned,
          show_location: showLocation,
          show_owned_products: showOwnedProducts,
          show_joined_products: showJoinedProducts,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };



  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{displayName || "Creator"}</h2>
              <p className="text-muted-foreground">@{username || "username"}</p>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={cn(
              "grid w-full lg:w-auto lg:inline-grid",
              isAdminUser ? "grid-cols-7" : "grid-cols-6"
            )}>
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Affiliate</span>
              </TabsTrigger>
              {isAdminUser && (
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Help</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <UserCog className="w-4 h-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <AtSign className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-6">
              <LinkedSocialAccounts isOwnProfile={true} />
            </TabsContent>

            {/* Affiliate Tab - Available for ALL users */}
            <TabsContent value="affiliate" className="space-y-6">
              <AffiliateCenter />
            </TabsContent>

            {/* Dashboard Tab - Only for Admin Users */}
            {isAdminUser && (
              <TabsContent value="dashboard" className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold">Seller Dashboard</h2>
                        <p className="text-sm text-muted-foreground">Manage your products, buyers & analytics</p>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/marketplace/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Link>
                    </Button>
                  </div>

                  <Tabs value={sellerDashboardTab} onValueChange={setSellerDashboardTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-5 mb-6">
                      <TabsTrigger value="products" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">Products</span>
                      </TabsTrigger>
                      <TabsTrigger value="campaigns" className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span className="hidden sm:inline">Campaigns</span>
                      </TabsTrigger>
                      <TabsTrigger value="buyers" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Buyers</span>
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Analytics</span>
                      </TabsTrigger>
                      <TabsTrigger value="discounts" className="flex items-center gap-2">
                        <Tags className="w-4 h-4" />
                        <span className="hidden sm:inline">Discounts</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Products Sub-Tab */}
                    <TabsContent value="products">
                      {productsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : myProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-bold mb-2">No products yet</h3>
                          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                            Start selling your courses, memberships, or digital products
                          </p>
                          <Button variant="outline" asChild>
                            <Link to="/marketplace/create">Create your first product</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myProducts.map((product) => (
                            <div
                              key={product.id}
                              className="bg-muted/50 rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
                            >
                              {/* Thumbnail */}
                              <div className="relative aspect-video overflow-hidden bg-muted">
                                {product.thumbnail_url ? (
                                  <img
                                    src={product.thumbnail_url}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                {!product.is_active && (
                                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-bold line-clamp-1">{product.title}</h3>
                                  <span className="text-sm font-medium text-primary whitespace-nowrap">
                                    {formatPrice(product.price, product.product_type, product.subscription_interval)}
                                  </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {product.members_count || 0}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {product.views_count || 0}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <Link to={`/marketplace/edit/${product.id}`}>
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Link>
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/marketplace/${product.slug || product.id}`}>
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Campaigns Sub-Tab */}
                    <TabsContent value="campaigns">
                      <SellerCampaignsAdmin />
                    </TabsContent>

                    {/* Buyers Sub-Tab */}
                    <TabsContent value="buyers">
                      <SellerBuyersManager />
                    </TabsContent>

                    {/* Analytics Sub-Tab */}
                    <TabsContent value="analytics">
                      <SellerAnalytics />
                    </TabsContent>

                    {/* Discounts Sub-Tab */}
                    <TabsContent value="discounts">
                      <DiscountCodesManager />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
            )}

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">More details</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose what appears on your profile and other discovery surfaces.
                  </p>

                  <div className="space-y-4">
                    {/* Total Earned Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">Total earned</span>
                      </div>
                      <Switch
                        checked={showTotalEarned}
                        onCheckedChange={setShowTotalEarned}
                      />
                    </div>

                    {/* Location Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">Location</span>
                      </div>
                      <Switch
                        checked={showLocation}
                        onCheckedChange={setShowLocation}
                      />
                    </div>

                    {/* Owned Products Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Shield className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">Owned products</span>
                      </div>
                      <Switch
                        checked={showOwnedProducts}
                        onCheckedChange={setShowOwnedProducts}
                      />
                    </div>

                    {/* Joined Products Toggle */}
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">Joined products</span>
                      </div>
                      <Switch
                        checked={showJoinedProducts}
                        onCheckedChange={setShowJoinedProducts}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Privacy Settings
                </Button>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">Help & Support</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get help with your account, campaigns, or payments
                  </p>
                </div>

                {/* Live Chat Button */}
                <button
                  onClick={() => setShowSupportChat(true)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 rounded-xl border border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold">Live Chat Support</h4>
                      <p className="text-sm text-muted-foreground">Chat with our team in real-time</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Help Center Link */}
                <Link
                  to="/support"
                  className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold">Help Center</h4>
                      <p className="text-sm text-muted-foreground">Browse FAQs and guides</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                {/* Contact Info */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Other ways to reach us</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>📧 Email: support@zyrozo.com</p>
                    <p>💬 Response time: Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Account Tab - Logout & Account Switching */}
            <TabsContent value="account" className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">Account Management</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Switch accounts or log out
                  </p>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={() => setShowPayModal(true)}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Send Payment</p>
                      <p className="text-sm text-muted-foreground">Transfer balance to another user</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">₹{availableBalance.toLocaleString()} available</span>
                </Button>

                {/* Transaction History */}
                <TransactionHistory userId={user?.id || ""} />

                {/* Account Switcher */}
                <AccountSwitcher
                  currentEmail={user?.email || ""}
                  currentAvatar={profile?.avatar_url || null}
                  currentDisplayName={profile?.display_name || null}
                  onLogout={signOut}
                />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Support Chat Widget - Only shown when triggered from this page */}
      {showSupportChat && <SupportChatWidget forceOpen onClose={() => setShowSupportChat(false)} />}

      {/* Pay User Modal */}
      <PayUserModal
        open={showPayModal}
        onOpenChange={setShowPayModal}
        currentUserId={user?.id || ""}
        availableBalance={availableBalance}
        onSuccess={fetchAvailableBalance}
      />
    </MainLayout>
  );
};

export default Profile;
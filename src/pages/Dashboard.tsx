import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  FileVideo, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  DollarSign,
  Eye,
  Package,
  Edit,
  Users,
  Trash2,
  BarChart3,
  ShoppingBag,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import SellerAnalytics from "@/components/dashboard/SellerAnalytics";
import SellerBuyersManager from "@/components/dashboard/SellerBuyersManager";
import DiscountCodesManager from "@/components/dashboard/DiscountCodesManager";

interface DashboardStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  totalViews: number;
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin, isSuperAdmin, isOwner, role } = useAuth();
  const isAdminUser = isAdmin || isSuperAdmin || isOwner || role === "normal_admin" || role === "founder";
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    totalViews: 0,
  });
  const [profile, setProfile] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      if (isAdminUser) {
        fetchMyProducts();
      }
    }
  }, [user, isAdminUser]);

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
    const formatted = `$${price.toLocaleString()}`;
    if (type === "subscription" && interval) {
      return `${formatted}/${interval}`;
    }
    return formatted;
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch submissions stats
      const { data: submissions } = await supabase
        .from("submissions")
        .select("status, views_count, estimated_earnings")
        .eq("user_id", user!.id);

      if (submissions) {
        const totalViews = submissions.reduce((acc, s) => acc + (s.views_count || 0), 0);
        const approved = submissions.filter(s => s.status === "approved" || s.status === "paid");
        const totalEarnings = approved.reduce((acc, s) => acc + Number(s.estimated_earnings || 0), 0);

        setStats({
          totalEarnings,
          pendingEarnings: submissions
            .filter(s => s.status === "pending")
            .reduce((acc, s) => acc + Number(s.estimated_earnings || 0), 0),
          totalSubmissions: submissions.length,
          approvedSubmissions: approved.length,
          totalViews,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Earnings",
      value: `$${stats.pendingEarnings.toLocaleString()}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Submissions",
      value: `${stats.approvedSubmissions}/${stats.totalSubmissions}`,
      icon: FileVideo,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile?.display_name || "Creator"}</span>!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your creator journey
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="hero" size="lg" className="h-auto py-4" asChild>
              <Link to="/campaigns">
                <Plus className="w-5 h-5 mr-2" />
                Join New Campaign
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-4" asChild>
              <Link to="/balance">
                <DollarSign className="w-5 h-5 mr-2" />
                Withdraw Earnings
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-4" asChild>
              <Link to="/affiliate">
                <TrendingUp className="w-5 h-5 mr-2" />
                Referral Program
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Seller Dashboard Section */}
        {isAdminUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Seller Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Manage your products, buyers & analytics</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/marketplace/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Link>
              </Button>
            </div>

            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Products</span>
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

              {/* Products Tab */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
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

              {/* Buyers Tab */}
              <TabsContent value="buyers">
                <SellerBuyersManager />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <SellerAnalytics />
              </TabsContent>

              {/* Discounts Tab */}
              <TabsContent value="discounts">
                <DiscountCodesManager />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Empty State for Submissions */}
        {stats.totalSubmissions === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileVideo className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Browse our active campaigns and start creating content to earn money!
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/campaigns">
                Explore Campaigns
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;

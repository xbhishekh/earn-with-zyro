import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Search, Star, Users, Tag, Filter, Plus, BookOpen, 
  Wrench, Crown, MessageSquare, FileText, Package,
  Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  short_description: string;
  category: string;
  product_type: string;
  price: number;
  currency: string;
  subscription_interval: string | null;
  thumbnail_url: string | null;
  members_count: number;
  is_featured: boolean;
  avg_rating?: number;
  review_count?: number;
  seller?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Package },
  { id: "courses", label: "Coaching and courses", icon: BookOpen },
  { id: "memberships", label: "Paid groups", icon: Crown },
  { id: "software", label: "Software", icon: Wrench },
  { id: "communities", label: "Communities", icon: MessageSquare },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "services", label: "Services", icon: Users },
];

const Marketplace = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, [selectedCategory, searchParams]);

  const fetchFeaturedProducts = async () => {
    const { data: productsData } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("members_count", { ascending: false })
      .limit(6);

    if (!productsData || productsData.length === 0) return;

    const sellerIds = [...new Set(productsData.map(p => p.seller_id))];
    const productIds = productsData.map(p => p.id);

    const [profilesResult, reviewsResult] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", sellerIds),
      supabase.from("product_reviews").select("product_id, rating").in("product_id", productIds)
    ]);

    const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
    const ratingsMap = new Map<string, { total: number; count: number }>();
    reviewsResult.data?.forEach(review => {
      const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
      ratingsMap.set(review.product_id, { total: existing.total + review.rating, count: existing.count + 1 });
    });

    const enriched: Product[] = productsData.map(product => {
      const ratings = ratingsMap.get(product.id);
      return {
        ...product,
        seller: profilesMap.get(product.seller_id),
        avg_rating: ratings ? ratings.total / ratings.count : 0,
        review_count: ratings?.count || 0
      };
    });

    setFeaturedProducts(enriched);
  };

  const fetchProducts = async () => {
    setLoading(true);
    
    let query = supabase
      .from("marketplace_products")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("members_count", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const searchQ = searchParams.get("q");
    if (searchQ) {
      query = query.ilike("title", `%${searchQ}%`);
    }

    const { data: productsData, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
      return;
    }

    // Fetch seller profiles and reviews
    const sellerIds = [...new Set(productsData?.map(p => p.seller_id) || [])];
    const productIds = productsData?.map(p => p.id) || [];

    const [profilesResult, reviewsResult] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", sellerIds),
      supabase.from("product_reviews").select("product_id, rating").in("product_id", productIds)
    ]);

    const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
    
    // Calculate average ratings
    const ratingsMap = new Map<string, { total: number; count: number }>();
    reviewsResult.data?.forEach(review => {
      const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
      ratingsMap.set(review.product_id, {
        total: existing.total + review.rating,
        count: existing.count + 1
      });
    });

    const enrichedProducts: Product[] = productsData?.map(product => {
      const ratings = ratingsMap.get(product.id);
      return {
        ...product,
        seller: profilesMap.get(product.seller_id),
        avg_rating: ratings ? ratings.total / ratings.count : 0,
        review_count: ratings?.count || 0
      };
    }) || [];

    setProducts(enrichedProducts);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery, category: selectedCategory });
    } else {
      setSearchParams({ category: selectedCategory });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newParams: Record<string, string> = { category };
    if (searchQuery.trim()) {
      newParams.q = searchQuery;
    }
    setSearchParams(newParams);
  };

  const formatPrice = (price: number, type: string, interval: string | null) => {
    if (type === "free" || price === 0) return "Free";
    const formatted = `₹${price.toLocaleString()}`;
    if (type === "subscription" && interval) {
      return `${formatted} / ${interval}`;
    }
    return formatted;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-4">
          {/* Search Header */}
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-4 border-b border-border mb-6">
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products, creators, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-10 h-12 rounded-full border-2 focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchParams({ category: selectedCategory });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </form>
              
              {user && (
                <Link to="/marketplace/create">
                  <Button className="h-12 px-6 rounded-full">
                    <Plus className="w-5 h-5 mr-2" />
                    Create a business
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className={`whitespace-nowrap rounded-full ${
                  selectedCategory === category.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Featured Section */}
          {featuredProducts.length > 0 && selectedCategory === "all" && !searchParams.get("q") && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl">Featured Products</h2>
                  <p className="text-sm text-muted-foreground">Top picks curated by our team</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/marketplace/${product.slug || product.id}`}
                      className="block bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                    >
                      {/* Featured Badge */}
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        {product.thumbnail_url ? (
                          <img
                            src={product.thumbnail_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        
                        <Badge 
                          className={`absolute bottom-3 right-3 ${
                            product.product_type === "free" || product.price === 0
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-primary hover:bg-primary/90"
                          }`}
                        >
                          {formatPrice(product.price, product.product_type, product.subscription_interval)}
                        </Badge>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        
                        {product.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                            {product.short_description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={product.seller?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {product.seller?.display_name?.[0] || product.seller?.username?.[0] || "S"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {product.seller?.display_name || product.seller?.username || "Seller"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {product.review_count && product.review_count > 0 ? (
                            <div className="flex items-center gap-1">
                              {renderStars(product.avg_rating || 0)}
                              <span className="text-sm font-medium ml-1">
                                {(product.avg_rating || 0).toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No reviews yet</span>
                          )}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {product.members_count || 0}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Results Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Best products</h2>
                <p className="text-sm text-muted-foreground">
                  {products.length} results • Based on our ranking system
                </p>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to list a product in this category!
              </p>
              {user && (
                <Link to="/marketplace/create">
                  <Button>Create your first product</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/marketplace/${product.slug || product.id}`}
                    className="block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <Badge 
                        className={`absolute bottom-3 right-3 ${
                          product.product_type === "free" || product.price === 0
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-primary hover:bg-primary/90"
                        }`}
                      >
                        {formatPrice(product.price, product.product_type, product.subscription_interval)}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      
                      {product.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {product.short_description}
                        </p>
                      )}

                      {/* Seller Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={product.seller?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {product.seller?.display_name?.[0] || product.seller?.username?.[0] || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {product.seller?.display_name || product.seller?.username || "Seller"}
                        </span>
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex items-center gap-4">
                        {product.review_count && product.review_count > 0 ? (
                          <div className="flex items-center gap-1">
                            {renderStars(product.avg_rating || 0)}
                            <span className="text-sm font-medium ml-1">
                              {(product.avg_rating || 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({product.review_count})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews yet</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
    </MainLayout>
  );
};

export default Marketplace;

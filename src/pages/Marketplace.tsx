import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Search, Star, Users, Tag, Filter, Plus, BookOpen, 
  Wrench, Crown, MessageSquare, FileText, Package,
  Loader2, X
} from "lucide-react";
import { ProductCardSkeleton, FeaturedProductSkeleton } from "@/components/ui/card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SEO } from "@/components/SEO";
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
  const { user, isAdmin, isSuperAdmin, isOwner, role } = useAuth();
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
    // Fetch products first (without join since no FK relationship)
    const { data: productsData, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("members_count", { ascending: false })
      .limit(6);

    if (error || !productsData || productsData.length === 0) return;

    // Fetch seller profiles separately
    const sellerIds = [...new Set(productsData.map(p => p.seller_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", sellerIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Show featured products immediately
    const initialFeatured: Product[] = productsData.map(product => ({
      ...product,
      seller: profilesMap.get(product.seller_id) || undefined,
      avg_rating: 0,
      review_count: 0
    }));
    setFeaturedProducts(initialFeatured);

    // Load ratings in background
    const productIds = productsData.map(p => p.id);
    const { data: reviewsData } = await supabase
      .from("product_reviews")
      .select("product_id, rating")
      .in("product_id", productIds);

    if (reviewsData && reviewsData.length > 0) {
      const ratingsMap = new Map<string, { total: number; count: number }>();
      reviewsData.forEach(review => {
        const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
        ratingsMap.set(review.product_id, { total: existing.total + review.rating, count: existing.count + 1 });
      });

      setFeaturedProducts(prev => prev.map(product => {
        const ratings = ratingsMap.get(product.id);
        return {
          ...product,
          avg_rating: ratings ? ratings.total / ratings.count : 0,
          review_count: ratings?.count || 0
        };
      }));
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    
    // Fetch products first (without join since no FK relationship)
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

    if (!productsData || productsData.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Fetch seller profiles separately
    const sellerIds = [...new Set(productsData.map(p => p.seller_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", sellerIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Show products immediately (fast first paint)
    const initialProducts: Product[] = productsData.map(product => ({
      ...product,
      seller: profilesMap.get(product.seller_id) || undefined,
      avg_rating: 0,
      review_count: 0
    }));

    setProducts(initialProducts);
    setLoading(false);

    // Load ratings in background
    const productIds = productsData.map(p => p.id);
    if (productIds.length === 0) return;

    const { data: reviewsData } = await supabase
      .from("product_reviews")
      .select("product_id, rating")
      .in("product_id", productIds);

    if (reviewsData && reviewsData.length > 0) {
      const ratingsMap = new Map<string, { total: number; count: number }>();
      reviewsData.forEach(review => {
        const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
        ratingsMap.set(review.product_id, { total: existing.total + review.rating, count: existing.count + 1 });
      });

      setProducts(prev => prev.map(product => {
        const ratings = ratingsMap.get(product.id);
        return {
          ...product,
          avg_rating: ratings ? ratings.total / ratings.count : 0,
          review_count: ratings?.count || 0
        };
      }));
    }
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
    const formatted = `$${price.toLocaleString()}`;
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
      <SEO
        title="Creator Marketplace - Buy & Sell Digital Products"
        description="Discover courses, templates, and digital products from top creators. Buy or sell on CliporaX's marketplace. Coaching, software, communities, and more."
        keywords="creator marketplace, digital products, online courses, creator economy, templates, coaching, memberships"
        canonical="/marketplace"
      />
      <div className="container mx-auto px-4 py-4">
          <h1 className="sr-only">Creator Marketplace — Buy and Sell Digital Products from Top Creators</h1>
          {/* Search Header */}
          <div className="sticky top-[4.5rem] z-40 bg-background/95 backdrop-blur-sm py-4 border-b border-border mb-6">
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
                      aria-label="Clear search"
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
              
              {(isAdmin || isSuperAdmin || isOwner || role === "normal_admin" || role === "founder") && (
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
                  <div key={product.id}>
                    <Link
                      to={`/marketplace/${product.slug || product.id}`}
                      className="block bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                    >
                      {/* Featured Badge */}
                      <div className="relative">
                        <OptimizedImage
                          src={product.thumbnail_url}
                          alt={product.title}
                          aspectRatio="video"
                          className="group-hover:scale-105"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-muted-foreground" />
                            </div>
                          }
                        />
                        
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
                  </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="relative text-center py-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-primary/20">
              {/* Decorative gradient blobs */}
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Package className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to list a product in this category!
                </p>
                {(isAdmin || isSuperAdmin || isOwner || role === "normal_admin" || role === "founder") && (
                  <Link to="/marketplace/create">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Create your first product
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div key={product.id}>
                  <Link
                    to={`/marketplace/${product.slug || product.id}`}
                    className="block rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group bg-gradient-to-br from-card via-card to-primary/5"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Package className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Price Badge */}
                      <Badge 
                        className={`absolute bottom-3 right-3 shadow-lg ${
                          product.product_type === "free" || product.price === 0
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 border-0"
                            : "bg-gradient-to-r from-primary to-accent border-0"
                        }`}
                      >
                        {formatPrice(product.price, product.product_type, product.subscription_interval)}
                      </Badge>
                      
                      {/* Featured indicator */}
                      {product.is_featured && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 border-0 shadow-lg">
                          <Crown className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 relative">
                      {/* Subtle gradient accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      
                      {product.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {product.short_description}
                        </p>
                      )}

                      {/* Seller Info */}
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50 group-hover:bg-primary/5 transition-colors">
                        <Avatar className="w-6 h-6 ring-2 ring-primary/20">
                          <AvatarImage src={product.seller?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
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
                            <span className="text-sm font-medium ml-1 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                              {(product.avg_rating || 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({product.review_count})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No reviews yet</span>
                        )}
                        
                        <div className="flex items-center gap-1 ml-auto text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{product.members_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
    </MainLayout>
  );
};

export default Marketplace;

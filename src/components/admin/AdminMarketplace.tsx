import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Star, 
  Crown, 
  Eye, 
  Users, 
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Product {
  id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  price: number;
  product_type: string;
  category: string;
  members_count: number;
  views_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  seller: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const AdminMarketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_products")
      .select(`
        id, title, slug, thumbnail_url, price, product_type, category,
        members_count, views_count, is_featured, is_active, created_at, seller_id
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
      setLoading(false);
      return;
    }

    // Fetch seller profiles
    const sellerIds = [...new Set(data?.map(p => p.seller_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", sellerIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const productsWithSellers = data?.map(product => ({
      ...product,
      seller: profileMap.get(product.seller_id) || null,
    })) || [];

    setProducts(productsWithSellers);
    setLoading(false);
  };

  const toggleFeatured = async (productId: string, currentValue: boolean) => {
    setUpdating(productId);
    
    const product = products.find(p => p.id === productId);
    
    const { error } = await supabase
      .from("marketplace_products")
      .update({ is_featured: !currentValue })
      .eq("id", productId);

    if (error) {
      toast.error("Failed to update featured status");
    } else {
      toast.success(currentValue ? "Removed from featured" : "Added to featured");
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_featured: !currentValue } : p
      ));
      
      // Send email notification when product is marked as featured
      if (!currentValue && product) {
        try {
          // Get seller_id from the product
          const { data: productData } = await supabase
            .from("marketplace_products")
            .select("seller_id")
            .eq("id", productId)
            .single();
          
          if (productData?.seller_id) {
            await supabase.functions.invoke("notify-product-featured", {
              body: {
                productId,
                productTitle: product.title,
                sellerId: productData.seller_id
              }
            });
          }
        } catch (notifyError) {
          console.error("Failed to send featured notification:", notifyError);
        }
      }
    }
    setUpdating(null);
  };

  const toggleActive = async (productId: string, currentValue: boolean) => {
    setUpdating(productId);
    const { error } = await supabase
      .from("marketplace_products")
      .update({ is_active: !currentValue })
      .eq("id", productId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(currentValue ? "Product deactivated" : "Product activated");
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: !currentValue } : p
      ));
    }
    setUpdating(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesFeatured = featuredFilter === "all" || 
      (featuredFilter === "featured" && product.is_featured) ||
      (featuredFilter === "not-featured" && !product.is_featured);

    return matchesSearch && matchesCategory && matchesFeatured;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const featuredCount = products.filter(p => p.is_featured).length;
  const activeCount = products.filter(p => p.is_active).length;

  const formatPrice = (price: number, type: string) => {
    if (type === "free" || price === 0) return "Free";
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Marketplace Management</h1>
        <p className="text-muted-foreground">Manage products and featured listings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Featured</p>
              <p className="text-2xl font-bold">{featuredCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{products.length - activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products or sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not-featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <img 
                              src={product.thumbnail_url} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(product.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.seller?.avatar_url ? (
                          <img 
                            src={product.seller.avatar_url} 
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {product.seller?.display_name?.[0] || "?"}
                            </span>
                          </div>
                        )}
                        <span className="text-sm">
                          {product.seller?.display_name || product.seller?.username || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatPrice(product.price, product.product_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {product.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {product.members_count || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_featured}
                          onCheckedChange={() => toggleFeatured(product.id, product.is_featured)}
                          disabled={updating === product.id}
                        />
                        {product.is_featured && (
                          <Crown className="w-4 h-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={() => toggleActive(product.id, product.is_active)}
                        disabled={updating === product.id}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/marketplace/${product.slug || product.id}`} target="_blank">
                              View Product
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleFeatured(product.id, product.is_featured)}
                          >
                            {product.is_featured ? "Remove from Featured" : "Add to Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleActive(product.id, product.is_active)}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketplace;

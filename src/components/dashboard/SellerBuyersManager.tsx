import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  Mail, 
  Calendar,
  Package,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  Crown,
  Filter,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Buyer {
  id: string;
  buyer_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  product_id: string;
  product_title: string;
  product_type: string;
  buyer_profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  buyer_email?: string;
}

interface ProductWithBuyers {
  id: string;
  title: string;
  product_type: string;
  price: number;
  members_count: number;
  buyers: Buyer[];
  totalRevenue: number;
}

const SellerBuyersManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productsWithBuyers, setProductsWithBuyers] = useState<ProductWithBuyers[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [allBuyers, setAllBuyers] = useState<Buyer[]>([]);

  useEffect(() => {
    if (user) {
      fetchBuyersData();
    }
  }, [user]);

  const fetchBuyersData = async () => {
    setLoading(true);
    try {
      // Fetch seller's products
      const { data: products } = await supabase
        .from("marketplace_products")
        .select("id, title, product_type, price, members_count")
        .eq("seller_id", user!.id);

      if (!products || products.length === 0) {
        setProductsWithBuyers([]);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Fetch all purchases for seller's products
      const { data: purchases } = await supabase
        .from("product_purchases")
        .select("*")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      if (!purchases || purchases.length === 0) {
        setProductsWithBuyers(products.map(p => ({
          ...p,
          buyers: [],
          totalRevenue: 0
        })));
        setLoading(false);
        return;
      }

      // Get unique buyer IDs
      const buyerIds = [...new Set(purchases.map(p => p.buyer_id))];

      // Fetch buyer profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", buyerIds);

      // Map profiles by user_id
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build buyers list with product info
      const buyersWithDetails: Buyer[] = purchases.map(purchase => {
        const product = products.find(p => p.id === purchase.product_id);
        return {
          id: purchase.id,
          buyer_id: purchase.buyer_id,
          amount: purchase.amount,
          payment_method: purchase.payment_method,
          status: purchase.status || 'completed',
          created_at: purchase.created_at || '',
          product_id: purchase.product_id,
          product_title: product?.title || 'Unknown Product',
          product_type: product?.product_type || 'one_time',
          buyer_profile: profileMap.get(purchase.buyer_id) || null
        };
      });

      setAllBuyers(buyersWithDetails);

      // Group buyers by product
      const productsData: ProductWithBuyers[] = products.map(product => {
        const productBuyers = buyersWithDetails.filter(b => b.product_id === product.id);
        const totalRevenue = productBuyers.reduce((acc, b) => acc + Number(b.amount) * 0.9, 0);
        return {
          ...product,
          buyers: productBuyers,
          totalRevenue
        };
      });

      setProductsWithBuyers(productsData);
    } catch (error) {
      console.error("Error fetching buyers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const filteredBuyers = allBuyers.filter(buyer => {
    const matchesSearch = searchQuery === "" || 
      buyer.buyer_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.buyer_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.product_title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProduct = filterProduct === "all" || buyer.product_id === filterProduct;
    
    return matchesSearch && matchesProduct;
  });

  const totalBuyers = new Set(allBuyers.map(b => b.buyer_id)).size;
  const totalRevenue = allBuyers.reduce((acc, b) => acc + Number(b.amount) * 0.9, 0);
  const totalSales = allBuyers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">My Buyers</h2>
            <p className="text-sm text-muted-foreground">View all customers who purchased your products</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="font-display text-2xl font-bold">{totalBuyers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="font-display text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="font-display text-2xl font-bold">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search buyers by name or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {productsWithBuyers.map(product => (
              <SelectItem key={product.id} value={product.id}>
                {product.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products with Buyers */}
      {productsWithBuyers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold mb-2">No products yet</h3>
            <p className="text-muted-foreground">
              Create products to start tracking your buyers
            </p>
          </CardContent>
        </Card>
      ) : allBuyers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold mb-2">No buyers yet</h3>
            <p className="text-muted-foreground">
              Once someone purchases your products, they'll appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {productsWithBuyers.filter(p => filterProduct === "all" || p.id === filterProduct).map((product) => (
            <Collapsible
              key={product.id}
              open={expandedProducts.has(product.id)}
              onOpenChange={() => toggleProductExpanded(product.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{product.title}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {product.buyers.length} buyers
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ₹{product.totalRevenue.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {product.product_type === 'subscription' ? 'Subscription' : 
                               product.product_type === 'free' ? 'Free' : 'One-time'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {expandedProducts.has(product.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {product.buyers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No buyers for this product yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount Paid</TableHead>
                              <TableHead>Payment Method</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.buyers
                              .filter(b => searchQuery === "" || 
                                b.buyer_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.buyer_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((buyer) => (
                                <TableRow key={buyer.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={buyer.buyer_profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                          {buyer.buyer_profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {buyer.buyer_profile?.display_name || 'Anonymous'}
                                        </p>
                                        {buyer.buyer_profile?.username && (
                                          <p className="text-xs text-muted-foreground">
                                            @{buyer.buyer_profile.username}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    ₹{Number(buyer.amount).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {buyer.payment_method === 'balance' ? 'Wallet' : 'External'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={buyer.status === 'completed' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {buyer.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {format(new Date(buyer.created_at), "MMM dd, yyyy")}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* All Buyers Table (if filtering by search) */}
      {searchQuery && filteredBuyers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Results ({filteredBuyers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuyers.slice(0, 10).map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={buyer.buyer_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {buyer.buyer_profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {buyer.buyer_profile?.display_name || 'Anonymous'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{buyer.product_title}</TableCell>
                      <TableCell>₹{Number(buyer.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(buyer.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerBuyersManager;

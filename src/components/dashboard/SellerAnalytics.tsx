import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Eye, 
  Users, 
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

interface AnalyticsData {
  totalViews: number;
  totalSales: number;
  totalEarnings: number;
  totalMembers: number;
  viewsChange: number;
  salesChange: number;
  earningsChange: number;
}

interface ProductStat {
  id: string;
  title: string;
  views: number;
  sales: number;
  earnings: number;
}

interface TimeSeriesData {
  date: string;
  sales: number;
  earnings: number;
}

const SellerAnalytics = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalSales: 0,
    totalEarnings: 0,
    totalMembers: 0,
    viewsChange: 0,
    salesChange: 0,
    earningsChange: 0,
  });
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), days));
    const previousStartDate = startOfDay(subDays(new Date(), days * 2));

    try {
      // Fetch products with their stats
      const { data: products } = await supabase
        .from("marketplace_products")
        .select("id, title, views_count, members_count")
        .eq("seller_id", user!.id);

      // Fetch purchases in current period
      const { data: currentPurchases } = await supabase
        .from("product_purchases")
        .select("id, amount, product_id, created_at")
        .eq("seller_id", user!.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString());

      // Fetch purchases in previous period for comparison
      const { data: previousPurchases } = await supabase
        .from("product_purchases")
        .select("id, amount")
        .eq("seller_id", user!.id)
        .eq("status", "completed")
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Calculate totals
      const totalViews = products?.reduce((acc, p) => acc + (p.views_count || 0), 0) || 0;
      const totalMembers = products?.reduce((acc, p) => acc + (p.members_count || 0), 0) || 0;
      
      const currentSales = currentPurchases?.length || 0;
      const currentEarnings = currentPurchases?.reduce((acc, p) => acc + Number(p.amount) * 0.9, 0) || 0;
      
      const previousSales = previousPurchases?.length || 0;
      const previousEarnings = previousPurchases?.reduce((acc, p) => acc + Number(p.amount) * 0.9, 0) || 0;

      // Calculate change percentages
      const salesChange = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;
      const earningsChange = previousEarnings > 0 ? ((currentEarnings - previousEarnings) / previousEarnings) * 100 : 0;

      setAnalytics({
        totalViews,
        totalSales: currentSales,
        totalEarnings: currentEarnings,
        totalMembers,
        viewsChange: 0, // Views don't have historical tracking
        salesChange,
        earningsChange,
      });

      // Calculate product-level stats
      const productStatsData: ProductStat[] = (products || []).map(product => {
        const productPurchases = currentPurchases?.filter(p => p.product_id === product.id) || [];
        return {
          id: product.id,
          title: product.title,
          views: product.views_count || 0,
          sales: productPurchases.length,
          earnings: productPurchases.reduce((acc, p) => acc + Number(p.amount) * 0.9, 0),
        };
      }).sort((a, b) => b.earnings - a.earnings);

      setProductStats(productStatsData);

      // Generate time series data
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
      const seriesData = dateRange.map(date => {
        const dayPurchases = currentPurchases?.filter(p => {
          const purchaseDate = new Date(p.created_at);
          return purchaseDate >= startOfDay(date) && purchaseDate <= endOfDay(date);
        }) || [];

        return {
          date: format(date, "MMM dd"),
          sales: dayPurchases.length,
          earnings: dayPurchases.reduce((acc, p) => acc + Number(p.amount) * 0.9, 0),
        };
      });

      setTimeSeriesData(seriesData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: null,
    },
    {
      title: "Total Sales",
      value: analytics.totalSales.toLocaleString(),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      change: analytics.salesChange,
    },
    {
      title: `Earnings (${period}d)`,
      value: `₹${analytics.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/10",
      change: analytics.earningsChange,
    },
    {
      title: "Total Members",
      value: analytics.totalMembers.toLocaleString(),
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      change: null,
    },
  ];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Seller Analytics</h2>
            <p className="text-sm text-muted-foreground">Track your product performance</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.change !== null && (
                    <div className={`flex items-center text-xs font-medium ${stat.change >= 0 ? "text-success" : "text-destructive"}`}>
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(stat.change).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{stat.title}</p>
                <p className="font-display text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Earnings Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, "Earnings"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      {productStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productStats.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {product.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {product.sales} sales
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">₹{product.earnings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">earnings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {productStats.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first product to start tracking analytics
            </p>
            <Button asChild>
              <a href="/marketplace/create">Create Product</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerAnalytics;

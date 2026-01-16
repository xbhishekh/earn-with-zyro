import { Link } from "react-router-dom";
import { ArrowRight, Download, Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  title: string;
  price: number | null;
  thumbnail_url: string | null;
  category: string;
  product_type: string;
}

const categoryGradients: Record<string, string> = {
  "clips": "from-blue-500 to-purple-500",
  "courses": "from-orange-500 to-pink-500",
  "tools": "from-green-500 to-teal-500",
  "templates": "from-purple-500 to-indigo-500",
  "presets": "from-cyan-500 to-blue-500",
  "default": "from-primary to-secondary",
};

export const MarketplaceShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase
          .from("marketplace_products")
          .select("id, title, price, thumbnail_url, category, product_type")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("views_count", { ascending: false })
          .limit(8);
        
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Placeholder products if none exist
  const placeholderProducts = [
    { id: "1", title: "Premium Clip Pack Vol. 1", price: 29, category: "clips", thumbnail_url: null, product_type: "digital" },
    { id: "2", title: "Complete Editing Course", price: 99, category: "courses", thumbnail_url: null, product_type: "course" },
    { id: "3", title: "Sound FX Bundle Pro", price: 19, category: "tools", thumbnail_url: null, product_type: "digital" },
    { id: "4", title: "Viral Video Templates", price: 39, category: "templates", thumbnail_url: null, product_type: "digital" },
    { id: "5", title: "Color Grading Presets", price: 24, category: "presets", thumbnail_url: null, product_type: "digital" },
    { id: "6", title: "Transition Pack Ultimate", price: 34, category: "clips", thumbnail_url: null, product_type: "digital" },
    { id: "7", title: "Beginner to Pro Guide", price: 49, category: "courses", thumbnail_url: null, product_type: "course" },
    { id: "8", title: "Audio Mastering Tools", price: 29, category: "tools", thumbnail_url: null, product_type: "digital" },
  ];

  const displayProducts = products.length > 0 ? products : placeholderProducts;

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Featured Products</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
              Trending <span className="gradient-text">Right Now</span>
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Discover what creators are buying and selling on our marketplace.
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="shrink-0">
            <Link to="/marketplace">
              View All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.map((product) => {
            const gradient = categoryGradients[product.category.toLowerCase()] || categoryGradients.default;
            
            return (
              <Link
                key={product.id}
                to={products.length > 0 ? `/marketplace/${product.id}` : "/marketplace"}
                className="group"
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
                  {/* Image/Thumbnail */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {product.thumbnail_url ? (
                      <img 
                        src={product.thumbnail_url} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Download className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium text-white uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-bold gradient-text">
                        ${product.price || 0}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

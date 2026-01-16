import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Users, Tag, Check, ChevronDown, ChevronUp,
  Share2, Heart, Loader2, ShoppingCart, Wallet, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Product {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  product_type: string;
  price: number;
  currency: string;
  subscription_interval: string | null;
  thumbnail_url: string | null;
  gallery_images: string[];
  features: string[];
  faqs: Array<{ question: string; answer: string }>;
  members_count: number;
  is_featured: boolean;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface Seller {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const MarketplaceProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, user]);

  const fetchProductDetails = async () => {
    setLoading(true);

    // Try to find by slug first, then by id
    let query = supabase.from("marketplace_products").select("*");
    
    if (id?.includes("-")) {
      query = query.eq("slug", id);
    } else {
      query = query.eq("id", id);
    }

    const { data: productData, error: productError } = await query.single();

    if (productError || !productData) {
      console.error("Error fetching product:", productError);
      setLoading(false);
      return;
    }

    // Parse FAQs if it's a string
    let parsedFaqs = [];
    try {
      parsedFaqs = typeof productData.faqs === 'string' 
        ? JSON.parse(productData.faqs) 
        : productData.faqs || [];
    } catch {
      parsedFaqs = [];
    }

    setProduct({ ...productData, faqs: parsedFaqs });

    // Fetch seller, reviews, and check purchase status in parallel
    const [sellerResult, reviewsResult, purchaseResult, balanceResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", productData.seller_id).single(),
      supabase.from("product_reviews").select("*").eq("product_id", productData.id).order("created_at", { ascending: false }),
      user ? supabase.from("product_purchases").select("id").eq("product_id", productData.id).eq("buyer_id", user.id).single() : Promise.resolve({ data: null }),
      user ? supabase.from("balance_transactions").select("amount, status").eq("user_id", user.id) : Promise.resolve({ data: [] })
    ]);

    if (sellerResult.data) {
      setSeller(sellerResult.data);
    }

    if (reviewsResult.data) {
      // Fetch reviewer profiles
      const reviewerIds = reviewsResult.data.map(r => r.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", reviewerIds);

      const profilesMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);

      const enrichedReviews: Review[] = reviewsResult.data.map(review => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        created_at: review.created_at,
        reviewer: profilesMap.get(review.reviewer_id) || null
      }));

      setReviews(enrichedReviews);

      // Calculate average rating
      if (enrichedReviews.length > 0) {
        const avg = enrichedReviews.reduce((sum, r) => sum + r.rating, 0) / enrichedReviews.length;
        setAvgRating(avg);
      }
    }

    if (purchaseResult.data) {
      setHasPurchased(true);
    }

    // Calculate available balance
    if (balanceResult.data) {
      const available = balanceResult.data
        .filter((t: any) => t.status === "available")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      setUserBalance(available);
    }

    setLoading(false);
  };

  const handlePurchase = async (paymentMethod: "balance" | "external") => {
    if (!user || !product) return;

    if (paymentMethod === "balance" && userBalance < product.price) {
      toast.error("Insufficient balance");
      return;
    }

    setPurchasing(true);

    try {
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from("product_purchases")
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: product.price,
          payment_method: paymentMethod,
          status: "completed"
        });

      if (purchaseError) throw purchaseError;

      // If paying with balance, deduct from balance
      if (paymentMethod === "balance") {
        const { error: transactionError } = await supabase
          .from("balance_transactions")
          .insert({
            user_id: user.id,
            amount: -product.price,
            type: "product_purchase",
            status: "available",
            notes: `Purchase: ${product.title}`
          });

        if (transactionError) throw transactionError;
      }

      toast.success("Purchase successful!");
      setHasPurchased(true);
      setShowPurchaseModal(false);
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number, type: string, interval: string | null) => {
    if (type === "free" || price === 0) return "Free";
    const formatted = `₹${price.toLocaleString()}`;
    if (type === "subscription" && interval) {
      return `${formatted} / ${interval}`;
    }
    return formatted;
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [product.thumbnail_url, ...product.gallery_images].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={seller?.avatar_url || undefined} />
                  <AvatarFallback>{seller?.display_name?.[0] || "S"}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{seller?.display_name || seller?.username}</span>
              </div>
            </button>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Image Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                {allImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                      <img
                        src={allImages[selectedImage]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {allImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                              selectedImage === idx ? "border-primary" : "border-transparent"
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center">
                    <Tag className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                {/* Stats Bar */}
                <div className="flex items-center gap-4 mt-4 p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatPrice(product.price, product.product_type, product.subscription_interval)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {product.members_count.toLocaleString()} members
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={seller?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{seller?.display_name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">By {seller?.display_name || seller?.username}</span>
                  </div>
                </div>
              </motion.div>

              {/* Title & Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                </div>
              </motion.div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-8"
                >
                  <h2 className="text-xl font-bold mb-4">What's included</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <span className="text-xl font-bold">
                      {avgRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  </div>
                  {reviews.length > 4 && (
                    <Button variant="ghost" size="sm">View all</Button>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {reviews.slice(0, 4).map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                              <AvatarFallback>
                                {review.reviewer?.display_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">
                                {review.reviewer?.display_name || review.reviewer?.username || "User"}
                              </p>
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {review.review_text}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24"
              >
                <Card className="overflow-hidden">
                  {product.thumbnail_url && (
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <CardContent className="p-6">
                    {/* Rating */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(avgRating, "lg")}
                        <span className="font-medium">{avgRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({reviews.length})</span>
                      </div>
                    )}

                    <h3 className="font-bold text-lg mb-3">{product.short_description || product.category}</h3>

                    {/* Price */}
                    <div className="text-2xl font-bold mb-4">
                      {formatPrice(product.price, product.product_type, product.subscription_interval)}
                      {product.product_type === "subscription" && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          +1 option
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    {hasPurchased ? (
                      <Button className="w-full h-12 text-lg" disabled>
                        <Check className="w-5 h-5 mr-2" />
                        Purchased
                      </Button>
                    ) : product.seller_id === user?.id ? (
                      <Link to={`/marketplace/edit/${product.id}`}>
                        <Button className="w-full h-12 text-lg" variant="outline">
                          Edit Product
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full h-12 text-lg"
                        onClick={() => {
                          if (!user) {
                            navigate("/auth");
                            return;
                          }
                          if (product.price === 0 || product.product_type === "free") {
                            handlePurchase("balance");
                          } else {
                            setShowPurchaseModal(true);
                          }
                        }}
                      >
                        {product.price === 0 || product.product_type === "free"
                          ? "Join for free"
                          : "Get offer"}
                      </Button>
                    )}

                    {/* FAQs */}
                    {product.faqs && product.faqs.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <Accordion type="single" collapsible>
                          {product.faqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`faq-${idx}`}>
                              <AccordionTrigger className="text-left text-sm">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
              {product.thumbnail_url && (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="w-16 h-12 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="text-lg font-bold">
                  {formatPrice(product.price, product.product_type, product.subscription_interval)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4"
                onClick={() => handlePurchase("balance")}
                disabled={purchasing || userBalance < product.price}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Pay with Balance</p>
                  <p className="text-sm text-muted-foreground">
                    Available: ₹{userBalance.toLocaleString()}
                  </p>
                </div>
                {userBalance < product.price && (
                  <Badge variant="destructive">Insufficient</Badge>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4"
                onClick={() => handlePurchase("external")}
                disabled={purchasing}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Pay with UPI/Card</p>
                  <p className="text-sm text-muted-foreground">Secure payment</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {purchasing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplaceProductDetail;

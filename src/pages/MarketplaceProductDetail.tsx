import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Users, Tag, Check, 
  Share2, Heart, Loader2, Wallet, Ticket, X, MessageSquare, Send
} from "lucide-react";
import { SEO, createProductSchema, createBreadcrumbSchema } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { calculateAvailableBalance } from "@/lib/balance-utils";

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

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
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
  
  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

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
    const [sellerResult, reviewsResult, purchaseResult, balanceResult, userReviewResult] = await Promise.all([
      supabase.from("profiles").select("user_id, username, display_name, avatar_url, bio, is_verified, cover_image_url").eq("user_id", productData.seller_id).single(),
      supabase.from("product_reviews").select("*").eq("product_id", productData.id).order("created_at", { ascending: false }),
      user ? supabase.from("product_purchases").select("id").eq("product_id", productData.id).eq("buyer_id", user.id).single() : Promise.resolve({ data: null }),
      user ? supabase.from("balance_transactions").select("amount, type, status").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from("product_reviews").select("id").eq("product_id", productData.id).eq("reviewer_id", user.id).single() : Promise.resolve({ data: null, error: null })
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
    
    // Check if user has already reviewed
    if (userReviewResult.data) {
      setHasReviewed(true);
    }

    // Calculate available balance using centralized utility
    if (balanceResult.data) {
      const available = calculateAvailableBalance(balanceResult.data);
      setUserBalance(available);
    }

    setLoading(false);
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim() || !product) return;
    
    setApplyingDiscount(true);
    setDiscountError("");
    
    try {
      const now = new Date().toISOString();
      
      const { data: discount, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.toUpperCase().trim())
        .eq("is_active", true)
        .or(`product_id.is.null,product_id.eq.${product.id}`)
        .single();
      
      if (error || !discount) {
        setDiscountError("Invalid discount code");
        setApplyingDiscount(false);
        return;
      }
      
      // Check if code is from this seller or applies to all
      if (discount.product_id && discount.product_id !== product.id) {
        setDiscountError("This code doesn't apply to this product");
        setApplyingDiscount(false);
        return;
      }
      
      // Check if code has expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        setDiscountError("This code has expired");
        setApplyingDiscount(false);
        return;
      }
      
      // Check if code has started
      if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
        setDiscountError("This code is not yet active");
        setApplyingDiscount(false);
        return;
      }
      
      // Check usage limit
      if (discount.max_uses && discount.current_uses >= discount.max_uses) {
        setDiscountError("This code has reached its usage limit");
        setApplyingDiscount(false);
        return;
      }
      
      // Check minimum purchase amount
      if (discount.min_purchase_amount && product.price < discount.min_purchase_amount) {
        setDiscountError(`Minimum purchase of $${discount.min_purchase_amount} required`);
        setApplyingDiscount(false);
        return;
      }
      
      setAppliedDiscount(discount);
      toast.success("Discount code applied!");
    } catch (err) {
      setDiscountError("Failed to apply discount code");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const getDiscountedPrice = () => {
    if (!product || !appliedDiscount) return product?.price || 0;
    
    if (appliedDiscount.discount_type === "percentage") {
      const discount = (product.price * appliedDiscount.discount_value) / 100;
      return Math.max(0, product.price - discount);
    } else {
      return Math.max(0, product.price - appliedDiscount.discount_value);
    }
  };

  const getDiscountAmount = () => {
    if (!product || !appliedDiscount) return 0;
    return product.price - getDiscountedPrice();
  };

  const handleSubmitReview = async () => {
    if (!user || !product) return;
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: product.id,
        reviewer_id: user.id,
        rating: reviewRating,
        review_text: reviewText.trim() || null,
        is_verified_purchase: hasPurchased
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setHasReviewed(true);
      setShowReviewForm(false);
      setReviewText("");
      setReviewRating(5);
      
      // Refresh reviews
      fetchProductDetails();
    } catch (error: any) {
      console.error("Review error:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };
  const handlePurchase = async () => {
    if (!user || !product) return;

    const finalPrice = getDiscountedPrice();

    // Check balance for paid products
    if (finalPrice > 0 && userBalance < finalPrice) {
      toast.error("Insufficient balance. Please add funds to your Zyrozo Balance.", {
        action: {
          label: "Add Funds",
          onClick: () => navigate("/balance")
        }
      });
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
          amount: finalPrice,
          original_price: product.price || 0,
          discount_code_id: appliedDiscount?.id || null,
          discount_amount: getDiscountAmount(),
          payment_method: "balance",
          status: "completed"
        });

      if (purchaseError) throw purchaseError;

      // Deduct from balance if paid product
      if (finalPrice > 0) {
        const { error: transactionError } = await supabase
          .from("balance_transactions")
          .insert({
            user_id: user.id,
            amount: -finalPrice,
            type: "product_purchase",
            status: "available",
            notes: `Purchase: ${product.title}${appliedDiscount ? ` (Discount: ${appliedDiscount.code})` : ""}`
          });

        if (transactionError) throw transactionError;
      }

      // Get buyer profile for notification
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .single();

      const buyerName = buyerProfile?.display_name || buyerProfile?.username || "A user";
      const platformFee = finalPrice * 0.10;
      const sellerEarnings = finalPrice - platformFee;

      // Send notification to seller
      await supabase.from("notifications").insert({
        user_id: product.seller_id,
        type: "product_sale",
        title: finalPrice === 0 ? "New Member Joined!" : "New Sale! 🎉",
        message: finalPrice === 0 
          ? `${buyerName} joined your product "${product.title}" for free.`
          : `${buyerName} purchased "${product.title}" for $${finalPrice.toLocaleString()}. You earned $${sellerEarnings.toLocaleString()} (after 10% platform fee).`,
        metadata: {
          product_id: product.id,
          product_title: product.title,
          buyer_id: user.id,
          buyer_name: buyerName,
          amount: finalPrice,
          seller_earnings: sellerEarnings,
          discount_applied: appliedDiscount?.code || null
        }
      });

      toast.success(finalPrice === 0 ? "Successfully joined!" : "Purchase successful!");
      setHasPurchased(true);
      setShowPurchaseModal(false);
      setAppliedDiscount(null);
      setDiscountCode("");
      
      // Update local balance
      setUserBalance(prev => prev - finalPrice);
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number, type: string, interval: string | null) => {
    if (type === "free" || price === 0) return "Free";
    const formatted = `$${price.toLocaleString()}`;
    if (type === "subscription" && interval) {
      return `${formatted} / ${interval}`;
    }
    return formatted;
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "w-6 h-6" : "w-5 h-5";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(rating);
          const isPartial = !isFilled && star === Math.ceil(rating) && rating % 1 > 0;
          
          return (
            <Star
              key={star}
              className={`${starSize} transition-all ${
                isFilled
                  ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                  : isPartial
                  ? "text-amber-400 fill-amber-400/50"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          );
        })}
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
        <SEO 
          title="Product Not Found"
          description="The product you're looking for doesn't exist or has been removed."
          noindex={true}
        />
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

  // Generate dynamic SEO data
  const productUrl = `/marketplace/${product.slug || product.id}`;
  const productDescription = product.short_description || product.description 
    ? (product.short_description || product.description || '').substring(0, 155) + ((product.short_description || product.description || '').length > 155 ? '...' : '')
    : `${product.title} by ${seller?.display_name || 'Zyrozo seller'} - ${product.price === 0 ? 'Free' : `$${product.price}`}. Join ${product.members_count.toLocaleString()} members on Zyrozo Marketplace.`;
  
  const seoTitle = product.price === 0 
    ? `${product.title} - Free on Zyrozo Marketplace`
    : `${product.title} - $${product.price} | Zyrozo Marketplace`;
  
  const seoKeywords = [
    product.title,
    product.category,
    seller?.display_name,
    'creator marketplace',
    'digital product',
    product.product_type
  ].filter(Boolean).join(', ');

  const productSchema = createProductSchema({
    name: product.title,
    description: productDescription,
    price: product.price,
    image: product.thumbnail_url || undefined,
    seller: seller?.display_name || undefined,
    rating: avgRating > 0 ? avgRating : undefined,
    reviewCount: reviews.length > 0 ? reviews.length : undefined,
    url: productUrl
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: product.title, url: productUrl }
  ]);

  const allImages = [product.thumbnail_url, ...product.gallery_images].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-purple-50/50 dark:from-orange-950/20 dark:via-background dark:to-purple-950/20 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-pink-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-3xl translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      
      <SEO
        title={seoTitle}
        description={productDescription}
        keywords={seoKeywords}
        canonical={productUrl}
        type="product"
        image={product.thumbnail_url || undefined}
        structuredData={[productSchema, breadcrumbSchema]}
      />
      <Navbar />
      
      <main className="pt-20 pb-16 relative z-10">
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
                <div className="flex flex-wrap items-center gap-3 mt-4 p-4 bg-gradient-to-r from-white/80 via-orange-50/50 to-purple-50/50 dark:from-gray-800/80 dark:via-orange-950/30 dark:to-purple-950/30 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700/50 shadow-lg">
                  <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 px-3 py-1.5 text-sm font-bold shadow-md">
                    <Tag className="w-4 h-4 mr-1.5" />
                    {formatPrice(product.price, product.product_type, product.subscription_interval)}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 px-3 py-1.5 text-sm font-medium shadow-md">
                    <Users className="w-4 h-4 mr-1.5" />
                    {product.members_count.toLocaleString()} members
                  </Badge>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-full px-3 py-1.5 shadow-sm">
                    <Avatar className="w-6 h-6 ring-2 ring-white dark:ring-gray-700 shadow-sm">
                      <AvatarImage src={seller?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-400 to-teal-500 text-white">{seller?.display_name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">By {seller?.display_name || seller?.username}</span>
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
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </span>
                    What's included
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 p-5 bg-gradient-to-br from-white/70 to-emerald-50/50 dark:from-gray-800/70 dark:to-emerald-950/30 rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-lg">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-medium">{feature}</span>
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
                {/* Compact Rating Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/80 dark:bg-amber-900/30 rounded-xl">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {avgRating.toFixed(1)}
                      </span>
                      {renderStars(avgRating, "sm")}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({reviews.length})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPurchased && !hasReviewed && (
                      <Button 
                        size="sm" 
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        Write Review
                      </Button>
                    )}
                    {reviews.length > 4 && (
                      <Button variant="outline" size="sm">View all</Button>
                    )}
                  </div>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <Card className="mb-4 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-700/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Write a Review</h4>
                      
                      {/* Star Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">Your Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  star <= reviewRating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-gray-300 hover:text-amber-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      <Textarea
                        placeholder="Share your experience with this product..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="mb-3 bg-white/80 dark:bg-gray-800/80"
                        rows={3}
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={submittingReview}
                          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                        >
                          {submittingReview ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Submit Review
                        </Button>
                        <Button variant="ghost" onClick={() => setShowReviewForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {reviews.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {reviews.slice(0, 4).map((review) => (
                      <Card key={review.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/50 dark:border-gray-700/50 shadow hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-8 h-8 ring-1 ring-white dark:ring-gray-700">
                              <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                                {review.reviewer?.display_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {review.reviewer?.display_name || review.reviewer?.username || "User"}
                              </p>
                              {renderStars(review.rating, "sm")}
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {review.review_text}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-muted/50 rounded-xl text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                    {hasPurchased && !hasReviewed && (
                      <Button 
                        size="sm" 
                        variant="link" 
                        onClick={() => setShowReviewForm(true)}
                        className="mt-1"
                      >
                        Be the first to review!
                      </Button>
                    )}
                  </div>
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
                <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/50 dark:border-gray-700/50 shadow-2xl">
                  {product.thumbnail_url && (
                    <div className="relative">
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="w-full aspect-video object-cover"
                      />
                      {product.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-6">
                    {/* Rating - Always show */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
                      {renderStars(avgRating, "lg")}
                      <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                    </div>

                    <h3 className="font-bold text-lg mb-3">{product.short_description || product.category}</h3>

                    {/* Price */}
                    <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatPrice(product.price, product.product_type, product.subscription_interval)}
                      </div>
                      {product.product_type === "subscription" && (
                        <span className="text-sm font-normal text-muted-foreground">
                          +1 option
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    {hasPurchased ? (
                      <Link to={`/member/${product.slug || product.id}`}>
                        <Button className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                          <Check className="w-5 h-5 mr-2" />
                          Access Content
                        </Button>
                      </Link>
                    ) : product.seller_id === user?.id ? (
                      <Link to={`/marketplace/edit/${product.id}`}>
                        <Button className="w-full h-14 text-lg border-2 border-primary hover:bg-primary hover:text-white transition-all" variant="outline">
                          Edit Product
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                        disabled={purchasing}
                        onClick={() => {
                          if (!user) {
                            navigate("/auth");
                            return;
                          }
                          if (product.price === 0 || product.product_type === "free") {
                            handlePurchase();
                          } else {
                            setShowPurchaseModal(true);
                          }
                        }}
                      >
                        {purchasing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : product.price === 0 || product.product_type === "free" ? (
                          "Join for Free"
                        ) : (
                          `Buy for $${product.price.toLocaleString()}`
                        )}
                      </Button>
                    )}

                    {/* FAQs */}
                    {product.faqs && product.faqs.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <Accordion type="single" collapsible>
                          {product.faqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`faq-${idx}`} className="border-muted/50">
                              <AccordionTrigger className="text-left text-sm hover:text-primary">
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
      <Dialog open={showPurchaseModal} onOpenChange={(open) => {
        setShowPurchaseModal(open);
        if (!open) {
          setAppliedDiscount(null);
          setDiscountCode("");
          setDiscountError("");
        }
      }}>
        <DialogContent className="max-w-md">
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
              <div className="flex-1">
                <p className="font-medium">{product.title}</p>
                {appliedDiscount ? (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-green-600">
                      ${getDiscountedPrice().toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-through">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-bold">
                    {formatPrice(product.price, product.product_type, product.subscription_interval)}
                  </p>
                )}
              </div>
            </div>

            {/* Discount Code Input */}
            <div className="mb-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Have a discount code?</span>
              </div>
              
              {appliedDiscount ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {appliedDiscount.code}
                    </span>
                    <Badge variant="secondary" className="text-green-600">
                      {appliedDiscount.discount_type === "percentage" 
                        ? `-${appliedDiscount.discount_value}%`
                        : `-$${appliedDiscount.discount_value}`}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setAppliedDiscount(null);
                      setDiscountCode("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountError("");
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={applyDiscountCode}
                    disabled={!discountCode.trim() || applyingDiscount}
                    variant="secondary"
                  >
                    {applyingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              
              {discountError && (
                <p className="text-sm text-destructive mt-2">{discountError}</p>
              )}
            </div>

            {/* Price Summary */}
            {appliedDiscount && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price</span>
                  <span>${product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-${getDiscountAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total</span>
                  <span>${getDiscountedPrice().toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Balance Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="font-medium">Your Balance</span>
              </div>
              <span className="text-lg font-bold">${userBalance.toLocaleString()}</span>
            </div>

            {/* Insufficient Balance Warning */}
            {userBalance < getDiscountedPrice() && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm text-destructive font-medium mb-2">
                  Insufficient balance. You need ${(getDiscountedPrice() - userBalance).toLocaleString()} more.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    navigate("/balance");
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Add Funds to Balance
                </Button>
              </div>
            )}

            {/* Purchase Button */}
            <Button
              className="w-full h-14"
              onClick={handlePurchase}
              disabled={purchasing || userBalance < getDiscountedPrice()}
            >
              {purchasing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Wallet className="w-5 h-5 mr-2" />
              )}
              {purchasing ? "Processing..." : `Pay $${getDiscountedPrice().toLocaleString()} with Balance`}
            </Button>
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

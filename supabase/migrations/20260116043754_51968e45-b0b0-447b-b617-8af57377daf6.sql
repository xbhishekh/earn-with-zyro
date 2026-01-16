
-- =============================================
-- MARKETPLACE PRODUCTS TABLE
-- =============================================
CREATE TABLE marketplace_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL, -- 'courses', 'memberships', 'software', 'tools', 'services', 'coaching', 'communities', 'templates', 'ebooks'
  product_type TEXT NOT NULL DEFAULT 'one_time', -- 'one_time', 'subscription', 'free'
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  subscription_interval TEXT, -- 'month', 'year', 'week' (for subscription products)
  thumbnail_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}', -- What's included
  faqs JSONB DEFAULT '[]'::jsonb, -- Product-specific FAQs
  members_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON marketplace_products 
  FOR SELECT USING (is_active = true OR seller_id = auth.uid() OR is_admin(auth.uid()));

-- Sellers can insert their own products
CREATE POLICY "Sellers can insert own products" ON marketplace_products 
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products" ON marketplace_products 
  FOR UPDATE USING (auth.uid() = seller_id OR is_admin(auth.uid()));

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products" ON marketplace_products 
  FOR DELETE USING (auth.uid() = seller_id OR is_admin(auth.uid()));

-- =============================================
-- PRODUCT PURCHASES TABLE
-- =============================================
CREATE TABLE product_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'balance', 'external'
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'refunded', 'cancelled'
  subscription_ends_at TIMESTAMPTZ, -- For subscription products
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, buyer_id) -- One purchase per user per product
);

-- Enable RLS
ALTER TABLE product_purchases ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own purchases
CREATE POLICY "Buyers can view own purchases" ON product_purchases 
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin(auth.uid()));

-- Buyers can insert purchases
CREATE POLICY "Buyers can insert purchases" ON product_purchases 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Only admins can update purchases
CREATE POLICY "Admins can update purchases" ON product_purchases 
  FOR UPDATE USING (is_admin(auth.uid()));

-- =============================================
-- PRODUCT REVIEWS TABLE
-- =============================================
CREATE TABLE product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, reviewer_id) -- One review per user per product
);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON product_reviews 
  FOR SELECT USING (true);

-- Only purchasers can insert reviews
CREATE POLICY "Purchasers can insert reviews" ON product_reviews 
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND 
    EXISTS (SELECT 1 FROM product_purchases WHERE product_id = product_reviews.product_id AND buyer_id = auth.uid() AND status = 'completed')
  );

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews" ON product_reviews 
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Reviewers can delete their own reviews
CREATE POLICY "Reviewers can delete own reviews" ON product_reviews 
  FOR DELETE USING (auth.uid() = reviewer_id OR is_admin(auth.uid()));

-- =============================================
-- TRIGGER: Update product stats on purchase
-- =============================================
CREATE OR REPLACE FUNCTION update_product_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_products 
    SET members_count = members_count + 1 
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_products 
    SET members_count = GREATEST(members_count - 1, 0) 
    WHERE id = OLD.product_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_purchase_change
  AFTER INSERT OR DELETE ON product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_product_members_count();

-- =============================================
-- TRIGGER: Create seller transaction on purchase
-- =============================================
CREATE OR REPLACE FUNCTION process_product_purchase()
RETURNS TRIGGER AS $$
DECLARE
  platform_fee NUMERIC;
  seller_amount NUMERIC;
BEGIN
  -- 10% platform fee
  platform_fee := NEW.amount * 0.10;
  seller_amount := NEW.amount - platform_fee;
  
  -- Add earnings to seller's balance
  INSERT INTO balance_transactions (user_id, amount, type, status, notes, release_date)
  VALUES (
    NEW.seller_id,
    seller_amount,
    'product_sale',
    'available',
    'Product sale: ' || (SELECT title FROM marketplace_products WHERE id = NEW.product_id),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_purchased
  AFTER INSERT ON product_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION process_product_purchase();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
ALTER PUBLICATION supabase_realtime ADD TABLE product_reviews;

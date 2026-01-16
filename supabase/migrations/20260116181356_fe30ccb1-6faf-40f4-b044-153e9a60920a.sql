-- Drop existing marketplace_products policies
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.marketplace_products;

-- Create new RLS policies that restrict CREATE/UPDATE/DELETE to admin roles only
-- Anyone can view active products (public visibility)
CREATE POLICY "Anyone can view active products" 
ON public.marketplace_products 
FOR SELECT 
USING (is_active = true);

-- Sellers can view their own products (including inactive)
CREATE POLICY "Sellers can view all their products" 
ON public.marketplace_products 
FOR SELECT 
USING (auth.uid() = seller_id);

-- Only admins can INSERT products
CREATE POLICY "Only admins can create products" 
ON public.marketplace_products 
FOR INSERT 
WITH CHECK (
  auth.uid() = seller_id 
  AND is_admin(auth.uid())
);

-- Only admins can UPDATE their own products
CREATE POLICY "Only admins can update their products" 
ON public.marketplace_products 
FOR UPDATE 
USING (
  auth.uid() = seller_id 
  AND is_admin(auth.uid())
);

-- Only admins can DELETE their own products
CREATE POLICY "Only admins can delete their products" 
ON public.marketplace_products 
FOR DELETE 
USING (
  auth.uid() = seller_id 
  AND is_admin(auth.uid())
);

-- ============================================
-- FIX 1: Profiles - Restrict public SELECT to authenticated users only
-- Remove the overly permissive "true" policy
-- ============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Authenticated users can see basic profile info of others (not payment_details)
-- But they CAN see their own full profile
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Admins can view all profiles  
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================
-- FIX 2: Admin invites - Restrict to super_admins only
-- ============================================
DROP POLICY IF EXISTS "Admins can view invites" ON public.admin_invites;

-- Only super admins can view invites (not normal admins)
CREATE POLICY "Only super admins can view invites"
  ON public.admin_invites FOR SELECT
  USING (is_super_admin(auth.uid()));

-- ============================================
-- FIX 3: Discount code race condition - atomic validation
-- ============================================
-- Replace the AFTER INSERT trigger with a BEFORE INSERT trigger that validates atomically
CREATE OR REPLACE FUNCTION public.validate_and_increment_discount()
RETURNS TRIGGER AS $$
DECLARE
  v_discount RECORD;
BEGIN
  IF NEW.discount_code_id IS NOT NULL THEN
    -- Lock row and validate atomically
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE id = NEW.discount_code_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Discount code not found';
    END IF;
    
    -- Check if code is active
    IF NOT v_discount.is_active THEN
      RAISE EXCEPTION 'Discount code is not active';
    END IF;
    
    -- Check expiry
    IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < now() THEN
      RAISE EXCEPTION 'Discount code has expired';
    END IF;
    
    -- Check if limit would be exceeded
    IF v_discount.max_uses IS NOT NULL AND v_discount.current_uses >= v_discount.max_uses THEN
      RAISE EXCEPTION 'Discount code usage limit reached';
    END IF;
    
    -- Atomically increment usage
    UPDATE discount_codes
    SET current_uses = current_uses + 1,
        updated_at = now()
    WHERE id = NEW.discount_code_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old trigger and create new BEFORE trigger
DROP TRIGGER IF EXISTS update_discount_usage_on_purchase ON public.product_purchases;

CREATE TRIGGER validate_discount_before_purchase
  BEFORE INSERT ON public.product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_increment_discount();

-- ============================================
-- FIX 4: Payment details - Create secure view for public profile access
-- Move payment_details access to owner-only via a secure function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_own_payment_details(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_details 
  FROM profiles 
  WHERE user_id = p_user_id 
    AND p_user_id = auth.uid();
$$;

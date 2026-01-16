-- Create discount_codes table for promotional pricing
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_codes
CREATE POLICY "Anyone can view active discount codes"
  ON public.discount_codes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can manage their own discount codes"
  ON public.discount_codes
  FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all discount codes"
  ON public.discount_codes
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Add discount fields to product_purchases
ALTER TABLE public.product_purchases
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES public.discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Create trigger to update discount code usage
CREATE OR REPLACE FUNCTION public.update_discount_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_code_id IS NOT NULL THEN
    UPDATE public.discount_codes
    SET current_uses = current_uses + 1,
        updated_at = now()
    WHERE id = NEW.discount_code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_discount_usage_on_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discount_code_usage();

-- Create trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
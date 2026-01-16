
-- Fix function search path for update_product_members_count
CREATE OR REPLACE FUNCTION update_product_members_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Fix function search path for process_product_purchase
CREATE OR REPLACE FUNCTION process_product_purchase()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

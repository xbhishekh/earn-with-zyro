-- Update the default currency from INR to USD
ALTER TABLE public.marketplace_products 
ALTER COLUMN currency SET DEFAULT 'USD';

-- Update any existing products with INR currency to USD
UPDATE public.marketplace_products 
SET currency = 'USD' 
WHERE currency = 'INR' OR currency IS NULL;
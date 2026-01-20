-- Fix balance_transactions type check to include product_sale
ALTER TABLE public.balance_transactions 
DROP CONSTRAINT IF EXISTS balance_transactions_type_check;

ALTER TABLE public.balance_transactions 
ADD CONSTRAINT balance_transactions_type_check 
CHECK (type IN ('pending_payout', 'deposit', 'withdrawal', 'deduction', 'affiliate_commission', 'referral_bonus', 'product_purchase', 'seller_payout', 'product_sale'));
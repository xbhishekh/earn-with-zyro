-- Drop the whop_oauth_states table
DROP TABLE IF EXISTS public.whop_oauth_states;

-- Remove Whop-specific columns from social_accounts
ALTER TABLE public.social_accounts 
DROP COLUMN IF EXISTS whop_user_id,
DROP COLUMN IF EXISTS whop_access_token,
DROP COLUMN IF EXISTS oauth_verified_at;

-- Drop the cleanup function
DROP FUNCTION IF EXISTS public.cleanup_expired_oauth_states();
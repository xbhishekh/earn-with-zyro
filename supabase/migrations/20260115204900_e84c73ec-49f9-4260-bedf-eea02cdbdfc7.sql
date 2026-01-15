-- Add 'pending_verification' to the social_account_status enum
ALTER TYPE public.social_account_status ADD VALUE IF NOT EXISTS 'pending_verification';
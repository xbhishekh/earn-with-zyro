-- Add new privacy columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_owned_products BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_joined_products BOOLEAN DEFAULT false;
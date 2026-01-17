-- Add OAuth fields to social_accounts table
ALTER TABLE public.social_accounts 
ADD COLUMN IF NOT EXISTS whop_user_id TEXT,
ADD COLUMN IF NOT EXISTS whop_access_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_verified_at TIMESTAMPTZ;

-- Create whop_oauth_states table for secure OAuth flow
CREATE TABLE IF NOT EXISTS public.whop_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Enable RLS
ALTER TABLE public.whop_oauth_states ENABLE ROW LEVEL SECURITY;

-- Users can only see their own OAuth states
CREATE POLICY "Users can view own oauth states"
ON public.whop_oauth_states FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own OAuth states
CREATE POLICY "Users can create own oauth states"
ON public.whop_oauth_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own OAuth states
CREATE POLICY "Users can delete own oauth states"
ON public.whop_oauth_states FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster state lookups
CREATE INDEX IF NOT EXISTS idx_whop_oauth_states_state ON public.whop_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_whop_oauth_states_expires ON public.whop_oauth_states(expires_at);

-- Function to cleanup expired states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.whop_oauth_states WHERE expires_at < NOW();
END;
$$;
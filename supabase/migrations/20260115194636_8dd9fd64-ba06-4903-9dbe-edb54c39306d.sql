-- Create campaign_waitlist_requests table for waitlist functionality
CREATE TABLE public.campaign_waitlist_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  answers TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.campaign_waitlist_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own waitlist requests"
  ON public.campaign_waitlist_requests
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Users can insert their own requests
CREATE POLICY "Users can insert own waitlist requests"
  ON public.campaign_waitlist_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update waitlist requests"
  ON public.campaign_waitlist_requests
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete requests
CREATE POLICY "Admins can delete waitlist requests"
  ON public.campaign_waitlist_requests
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_waitlist_requests_updated_at
  BEFORE UPDATE ON public.campaign_waitlist_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
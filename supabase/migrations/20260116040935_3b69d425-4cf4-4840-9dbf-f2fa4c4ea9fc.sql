-- Add campaign assignments for normal admins
-- This table links normal admins to specific campaigns they can manage
CREATE TABLE IF NOT EXISTS public.admin_campaign_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_user_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.admin_campaign_assignments ENABLE ROW LEVEL SECURITY;

-- Super admins/owners can manage all assignments
CREATE POLICY "Super admins can manage assignments"
ON public.admin_campaign_assignments
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Admins can view their own assignments
CREATE POLICY "Admins can view own assignments"
ON public.admin_campaign_assignments
FOR SELECT
USING (admin_user_id = auth.uid());

-- Add index for performance
CREATE INDEX idx_admin_campaign_assignments_admin ON public.admin_campaign_assignments(admin_user_id);
CREATE INDEX idx_admin_campaign_assignments_campaign ON public.admin_campaign_assignments(campaign_id);
-- Create campaign_assets table for storing downloadable files and links
CREATE TABLE public.campaign_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'image', 'file', 'link')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add video_url column to campaigns for preview video
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Enable RLS
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can view assets of active campaigns
CREATE POLICY "Anyone can view campaign assets" 
ON public.campaign_assets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_assets.campaign_id 
    AND (campaigns.status = 'active' OR is_admin(auth.uid()))
  )
);

-- Only admins can manage assets
CREATE POLICY "Admins can insert campaign assets" 
ON public.campaign_assets 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update campaign assets" 
ON public.campaign_assets 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete campaign assets" 
ON public.campaign_assets 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_campaign_assets_campaign_id ON public.campaign_assets(campaign_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_assets_updated_at
BEFORE UPDATE ON public.campaign_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
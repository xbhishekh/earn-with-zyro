-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for campaign assets storage
CREATE POLICY "Anyone can view campaign assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'campaign-assets');

CREATE POLICY "Admins can upload campaign assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'campaign-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update campaign assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'campaign-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete campaign assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'campaign-assets' AND is_admin(auth.uid()));
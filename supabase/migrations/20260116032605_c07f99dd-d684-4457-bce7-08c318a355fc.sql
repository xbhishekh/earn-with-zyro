-- Create storage bucket for campaign thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-thumbnails', 'campaign-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view campaign thumbnails (public bucket)
CREATE POLICY "Campaign thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-thumbnails');

-- Allow admins to upload campaign thumbnails
CREATE POLICY "Admins can upload campaign thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-thumbnails' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to update campaign thumbnails
CREATE POLICY "Admins can update campaign thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-thumbnails' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to delete campaign thumbnails
CREATE POLICY "Admins can delete campaign thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-thumbnails' 
  AND public.is_admin(auth.uid())
);
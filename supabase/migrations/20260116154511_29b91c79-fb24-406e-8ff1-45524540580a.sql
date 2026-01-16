-- Create submissions storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('submissions', 'submissions', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for submissions bucket
CREATE POLICY "Users can upload submission videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view submission videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

CREATE POLICY "Users can delete own submission videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[2]);
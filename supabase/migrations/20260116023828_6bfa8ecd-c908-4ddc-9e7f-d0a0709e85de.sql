-- Add RLS policy to allow public viewing of approved submissions
CREATE POLICY "Anyone can view approved submissions"
ON public.submissions
FOR SELECT
USING (status IN ('approved', 'paid'));

-- Enable realtime for submissions (for admin live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
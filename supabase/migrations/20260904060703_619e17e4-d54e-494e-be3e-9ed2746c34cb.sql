CREATE TABLE public.business_inquiry_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id uuid NOT NULL REFERENCES public.business_inquiries(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.business_inquiry_replies TO authenticated;
GRANT ALL ON public.business_inquiry_replies TO service_role;

ALTER TABLE public.business_inquiry_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view business inquiry replies"
ON public.business_inquiry_replies FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can add business inquiry replies"
ON public.business_inquiry_replies FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

CREATE INDEX idx_business_inquiry_replies_inquiry ON public.business_inquiry_replies(inquiry_id);
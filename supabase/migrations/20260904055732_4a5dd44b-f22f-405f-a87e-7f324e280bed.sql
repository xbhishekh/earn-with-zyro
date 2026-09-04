CREATE TABLE public.business_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  website text,
  budget_range text,
  campaign_goal text,
  preferred_call_time text,
  message text,
  status text not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT INSERT ON public.business_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_inquiries TO authenticated;
GRANT ALL ON public.business_inquiries TO service_role;

ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a business inquiry"
ON public.business_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view business inquiries"
ON public.business_inquiries FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'normal_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'founder')
);

CREATE POLICY "Admins can update business inquiries"
ON public.business_inquiries FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'founder')
);

CREATE POLICY "Admins can delete business inquiries"
ON public.business_inquiries FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'founder')
);

CREATE TRIGGER update_business_inquiries_updated_at
BEFORE UPDATE ON public.business_inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'clipper';
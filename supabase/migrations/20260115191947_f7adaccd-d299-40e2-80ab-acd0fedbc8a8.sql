
-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert announcements" ON public.announcements
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements" ON public.announcements
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements" ON public.announcements
  FOR DELETE USING (is_admin(auth.uid()));

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- =============================================
-- SOCIAL ACCOUNTS TABLE
-- =============================================
CREATE TYPE public.social_account_status AS ENUM ('pending_link', 'awaiting_code', 'verified', 'rejected');

CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  username TEXT,
  profile_url TEXT,
  verification_code TEXT,
  admin_code TEXT,
  status public.social_account_status DEFAULT 'pending_link',
  is_verified BOOLEAN DEFAULT false,
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social accounts" ON public.social_accounts
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert own social accounts" ON public.social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts" ON public.social_accounts
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete social accounts" ON public.social_accounts
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- AFFILIATE LINKS TABLE
-- =============================================
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate links" ON public.affiliate_links
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert own affiliate links" ON public.affiliate_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate links" ON public.affiliate_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete affiliate links" ON public.affiliate_links
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- SUPPORT CHATS TABLE
-- =============================================
CREATE TABLE public.support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  priority TEXT DEFAULT 'general' CHECK (priority IN ('general', 'urgent')),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  admin_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support chats" ON public.support_chats
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert own support chats" ON public.support_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can update support chats" ON public.support_chats
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- =============================================
-- SUPPORT MESSAGES TABLE
-- =============================================
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Function to check support chat access
CREATE OR REPLACE FUNCTION public.can_access_support_chat(chat_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_chats
    WHERE id = chat_id AND (user_id = auth.uid() OR is_admin(auth.uid()))
  )
$$;

CREATE POLICY "Users can view messages in their chats" ON public.support_messages
  FOR SELECT USING (can_access_support_chat(chat_id));

CREATE POLICY "Users can insert messages in their chats" ON public.support_messages
  FOR INSERT WITH CHECK (can_access_support_chat(chat_id) AND auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.support_messages
  FOR UPDATE USING (can_access_support_chat(chat_id));

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- =============================================
-- ADMIN INVITES TABLE
-- =============================================
CREATE TABLE public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invite_type public.app_role NOT NULL DEFAULT 'normal_admin',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.admin_invites
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert invites" ON public.admin_invites
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Super admins can update invites" ON public.admin_invites
  FOR UPDATE USING (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Super admins can delete invites" ON public.admin_invites
  FOR DELETE USING (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'owner')
  );

-- =============================================
-- ADMIN ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  action_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only owners can view activity logs" ON public.admin_activity_logs
  FOR SELECT USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- =============================================
-- FAQS TABLE
-- =============================================
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs" ON public.faqs
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert FAQs" ON public.faqs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update FAQs" ON public.faqs
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete FAQs" ON public.faqs
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- LEGAL PAGES TABLE
-- =============================================
CREATE TABLE public.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT UNIQUE NOT NULL CHECK (page_type IN ('privacy', 'terms')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view legal pages" ON public.legal_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert legal pages" ON public.legal_pages
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update legal pages" ON public.legal_pages
  FOR UPDATE USING (is_admin(auth.uid()));

-- Insert default legal pages
INSERT INTO public.legal_pages (page_type, title, content) VALUES
  ('privacy', 'Privacy Policy', '# Privacy Policy\n\nYour privacy is important to us.'),
  ('terms', 'Terms of Service', '# Terms of Service\n\nBy using our platform, you agree to these terms.');

-- =============================================
-- COMPANY PAGES TABLE
-- =============================================
CREATE TABLE public.company_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT UNIQUE NOT NULL CHECK (page_type IN ('about', 'contact', 'careers')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  last_updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published company pages" ON public.company_pages
  FOR SELECT USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert company pages" ON public.company_pages
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update company pages" ON public.company_pages
  FOR UPDATE USING (is_admin(auth.uid()));

-- Insert default company pages
INSERT INTO public.company_pages (page_type, title, content, meta_description) VALUES
  ('about', 'About Zyrozo', '# About Us\n\nZyrozo is India''s #1 Creator Rewards Platform.', 'Learn about Zyrozo - the leading creator rewards platform'),
  ('contact', 'Contact Us', '# Contact\n\nReach out to us for any queries.', 'Get in touch with the Zyrozo team'),
  ('careers', 'Careers at Zyrozo', '# Join Our Team\n\nWe''re always looking for talented individuals.', 'Explore career opportunities at Zyrozo');

-- =============================================
-- FOOTER SETTINGS TABLE (Single row)
-- =============================================
CREATE TABLE public.footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT DEFAULT 'Your Content, Your Earnings - India''s #1 Creator Rewards Platform',
  logo_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  terms_url TEXT DEFAULT '/terms',
  privacy_url TEXT DEFAULT '/privacy',
  about_url TEXT DEFAULT '/about',
  contact_url TEXT DEFAULT '/contact',
  careers_url TEXT DEFAULT '/careers',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view footer settings" ON public.footer_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update footer settings" ON public.footer_settings
  FOR UPDATE USING (is_admin(auth.uid()));

-- Insert default footer settings
INSERT INTO public.footer_settings (id) VALUES (gen_random_uuid());

-- =============================================
-- SUPPORT CONFIG TABLE (Single row)
-- =============================================
CREATE TABLE public.support_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_message TEXT DEFAULT 'Hi! How can we help you today?',
  offline_message TEXT DEFAULT 'We''re currently offline. Leave a message and we''ll get back to you.',
  auto_replies JSONB DEFAULT '[]',
  active_hours_start TIME DEFAULT '09:00',
  active_hours_end TIME DEFAULT '18:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view support config" ON public.support_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can update support config" ON public.support_config
  FOR UPDATE USING (is_admin(auth.uid()));

-- Insert default support config
INSERT INTO public.support_config (id) VALUES (gen_random_uuid());

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_chats_updated_at
  BEFORE UPDATE ON public.support_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_pages_updated_at
  BEFORE UPDATE ON public.company_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_footer_settings_updated_at
  BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_config_updated_at
  BEFORE UPDATE ON public.support_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

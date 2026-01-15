
-- Create campaign_members table
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'joined',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON public.campaign_members
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can join campaigns" ON public.campaign_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave campaigns" ON public.campaign_members
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_id UUID REFERENCES submissions(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can request withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create user_suspensions table (ban system)
CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  reason TEXT,
  suspended_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suspensions" ON public.user_suspensions
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert suspensions" ON public.user_suspensions
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update suspensions" ON public.user_suspensions
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  amount NUMERIC DEFAULT 2.00,
  campaign_id UUID REFERENCES campaigns(id),
  status TEXT DEFAULT 'pending',
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral rewards" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id OR is_admin(auth.uid()));

CREATE POLICY "System can insert referral rewards" ON public.referral_rewards
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() = referrer_id);

CREATE POLICY "Admins can update referral rewards" ON public.referral_rewards
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat rooms" ON public.chat_rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create dm_participants table
CREATE TABLE IF NOT EXISTS public.dm_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DM rooms" ON public.dm_participants
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can join DM rooms" ON public.dm_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-remove user from campaign when banned trigger
CREATE OR REPLACE FUNCTION public.auto_leave_campaign_on_ban()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL AND NEW.is_active = true THEN
    DELETE FROM campaign_members WHERE user_id = NEW.user_id AND campaign_id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_campaign_ban ON public.user_suspensions;
CREATE TRIGGER on_campaign_ban
  AFTER INSERT ON public.user_suspensions
  FOR EACH ROW EXECUTE FUNCTION public.auto_leave_campaign_on_ban();

-- Increment affiliate clicks function
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(link_code TEXT)
RETURNS void AS $$
  UPDATE affiliate_links SET clicks = clicks + 1, updated_at = now() WHERE code = link_code;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Is super admin function (without founder for now)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('owner', 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

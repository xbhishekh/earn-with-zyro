-- Create function to check and process admin invite on signup
CREATE OR REPLACE FUNCTION public.process_admin_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  new_role app_role;
BEGIN
  -- Check if user email has a pending invite
  SELECT * INTO invite_record
  FROM public.admin_invites
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Update the invite status to accepted
    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = invite_record.id;

    -- Update user role to the invited role (overwrite default creator role)
    UPDATE public.user_roles
    SET role = invite_record.invite_type
    WHERE user_id = NEW.id;

    -- Log activity
    INSERT INTO public.admin_activity_logs (admin_id, action_type, target_type, target_id, action_details)
    VALUES (
      invite_record.invited_by,
      'admin_invite_accepted',
      'user',
      NEW.id::text,
      jsonb_build_object(
        'email', NEW.email,
        'role', invite_record.invite_type,
        'invite_code', invite_record.invite_code
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created_process_invite ON auth.users;
CREATE TRIGGER on_auth_user_created_process_invite
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.process_admin_invite();

-- Ensure admin_invites has proper RLS policies
DROP POLICY IF EXISTS "Super admins can manage invites" ON admin_invites;
CREATE POLICY "Super admins can manage invites" ON admin_invites
  FOR ALL USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view invites they created" ON admin_invites;
CREATE POLICY "Admins can view invites they created" ON admin_invites
  FOR SELECT USING (invited_by = auth.uid() OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create invites" ON admin_invites;
CREATE POLICY "Admins can create invites" ON admin_invites
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete their invites" ON admin_invites;
CREATE POLICY "Admins can delete invites" ON admin_invites
  FOR DELETE USING (is_super_admin(auth.uid()));
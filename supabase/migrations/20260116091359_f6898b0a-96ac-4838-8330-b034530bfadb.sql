-- Create a function that automatically assigns admin role when a user signs up with an invited email
CREATE OR REPLACE FUNCTION public.handle_admin_invite_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if this email has a pending admin invite
  SELECT * INTO invite_record
  FROM public.admin_invites
  WHERE email = NEW.email
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invite found, assign the role
  IF invite_record.id IS NOT NULL THEN
    -- Update user role (upsert to handle existing role)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invite_record.invite_type)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role;

    -- Mark invite as accepted
    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invite_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_admin_check ON auth.users;

-- Create trigger to check admin invites on user creation
CREATE TRIGGER on_auth_user_created_admin_check
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_invite_on_signup();

-- Also create a function to immediately assign role if user already exists
CREATE OR REPLACE FUNCTION public.assign_admin_role_if_user_exists(invite_email TEXT, invite_type TEXT, invited_by_user UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user_id UUID;
  result JSONB;
BEGIN
  -- Find existing user with this email
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = invite_email;

  IF existing_user_id IS NOT NULL THEN
    -- User exists, assign role immediately
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, invite_type::app_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role;

    -- If normal_admin, we need to handle campaign assignments separately
    
    result := jsonb_build_object(
      'success', true,
      'user_exists', true,
      'user_id', existing_user_id,
      'message', 'Role assigned immediately'
    );
  ELSE
    -- User doesn't exist, they'll get role on signup
    result := jsonb_build_object(
      'success', true,
      'user_exists', false,
      'user_id', null,
      'message', 'User will get role on signup'
    );
  END IF;

  RETURN result;
END;
$$;
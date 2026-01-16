-- Add unique constraint on user_id in user_roles table
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Update the assign_admin_role_if_user_exists function
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
    -- User exists, check if they already have a role
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = existing_user_id) THEN
      -- Update existing role
      UPDATE public.user_roles 
      SET role = invite_type::app_role 
      WHERE user_id = existing_user_id;
    ELSE
      -- Insert new role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (existing_user_id, invite_type::app_role);
    END IF;
    
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

-- Also update handle_admin_invite_on_signup to use same logic
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
    -- Update user role (check if exists first)
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      UPDATE public.user_roles 
      SET role = invite_record.invite_type 
      WHERE user_id = NEW.id;
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, invite_record.invite_type);
    END IF;

    -- Mark invite as accepted
    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invite_record.id;
  END IF;

  RETURN NEW;
END;
$$;
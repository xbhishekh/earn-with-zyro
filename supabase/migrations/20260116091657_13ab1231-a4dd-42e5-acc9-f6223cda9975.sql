-- Update the handle_new_user function to remove hardcoded emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'displayName'
  );

  -- Create default 'creator' role for all new users
  -- Admin roles are now assigned via admin_invites table, not hardcoded emails
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'creator')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Remove the protect_owner_role function and trigger that uses hardcoded emails
DROP TRIGGER IF EXISTS protect_owner_role_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.protect_owner_role();

-- Create a new protection based on current role, not email
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent deleting or demoting owner role
  IF OLD.role = 'owner' THEN
    RAISE EXCEPTION 'Owner role cannot be modified or deleted';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for role protection
CREATE TRIGGER protect_owner_role_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_owner_role();
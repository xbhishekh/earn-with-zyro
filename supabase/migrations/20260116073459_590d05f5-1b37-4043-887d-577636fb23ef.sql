-- Update the handle_new_user function to include CEO email as owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  founder_emails TEXT[] := ARRAY['xbhishekh@gmail.com', 'just4abhii@gmail.com'];
  assigned_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.raw_user_meta_data->>'display_name', 'New Creator')
  );
  
  -- Determine role based on email
  IF NEW.email = ANY(founder_emails) THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'creator';
  END IF;
  
  -- Create role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;

-- Update the protect_owner_role function to protect both founder emails
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  protected_emails TEXT[] := ARRAY['xbhishekh@gmail.com', 'just4abhii@gmail.com'];
  user_email TEXT;
BEGIN
  -- Get the email of the user whose role is being modified
  SELECT email INTO user_email FROM auth.users WHERE id = OLD.user_id;
  
  -- If this is a protected email and trying to change from owner, block it
  IF user_email = ANY(protected_emails) AND OLD.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot modify owner role for protected admin';
  END IF;
  
  RETURN NEW;
END;
$$;
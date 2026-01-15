-- Update handle_new_user function with actual founder email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  founder_emails TEXT[] := ARRAY['xbhishekh@gmail.com'];
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
$function$;
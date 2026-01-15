-- Create function to protect owner role from being changed
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  protected_emails TEXT[] := ARRAY['xbhishekh@gmail.com'];
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
$function$;

-- Create trigger to prevent owner role modification
DROP TRIGGER IF EXISTS protect_owner_role_trigger ON public.user_roles;
CREATE TRIGGER protect_owner_role_trigger
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_owner_role();

-- Also protect from deletion via RLS (additional layer)
DROP POLICY IF EXISTS "Prevent owner role deletion" ON public.user_roles;
CREATE POLICY "Prevent owner role deletion"
  ON public.user_roles
  FOR DELETE
  USING (false); -- No one can delete roles via RLS
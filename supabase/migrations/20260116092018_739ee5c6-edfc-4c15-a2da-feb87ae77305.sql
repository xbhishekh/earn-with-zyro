-- Temporarily disable the protect_owner_role trigger to allow role updates
DROP TRIGGER IF EXISTS protect_owner_role_trigger ON public.user_roles;

-- Fix the user's role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'aae8e9f3-8526-49fd-8d6a-3d33570b8fd8';

-- Recreate protection trigger but only for owner role modifications
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only protect if trying to change FROM owner to something else, or delete owner
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    RAISE EXCEPTION 'Owner role cannot be deleted';
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Owner role cannot be demoted';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger
CREATE TRIGGER protect_owner_role_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_owner_role();
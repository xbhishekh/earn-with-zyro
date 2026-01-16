
-- Create function to check if user is founder (using text cast)
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role::text = 'founder'
  );
$function$;

-- Create function to check if user is owner (using text cast)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role::text = 'owner'
  );
$function$;

-- Update protect_owner_role function to also protect founder
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Protect owner and founder from deletion
  IF TG_OP = 'DELETE' AND OLD.role::text IN ('owner', 'founder') THEN
    RAISE EXCEPTION 'Owner and Founder roles cannot be deleted';
  END IF;
  
  -- Protect owner and founder from demotion
  IF TG_OP = 'UPDATE' AND OLD.role::text IN ('owner', 'founder') AND NEW.role::text NOT IN ('owner', 'founder') THEN
    RAISE EXCEPTION 'Owner and Founder roles cannot be demoted';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create function to check if user can manage roles (for removing admins)
CREATE OR REPLACE FUNCTION public.can_manage_role(_manager_id uuid, _target_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  manager_role text;
BEGIN
  -- Get manager's role
  SELECT role::text INTO manager_role FROM public.user_roles WHERE user_id = _manager_id;
  
  -- Founder and Owner can manage everyone except each other
  IF manager_role = 'founder' AND _target_role != 'owner' THEN
    RETURN true;
  END IF;
  
  IF manager_role = 'owner' AND _target_role != 'founder' THEN
    RETURN true;
  END IF;
  
  -- Super Admin can only manage normal_admin and admin
  IF manager_role = 'super_admin' AND _target_role IN ('normal_admin', 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Update is_super_admin to include founder and owner
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role::text IN ('owner', 'super_admin', 'founder')
  );
$function$;

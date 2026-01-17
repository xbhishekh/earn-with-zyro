
-- Temporarily drop the protection trigger
DROP TRIGGER IF EXISTS protect_owner_role_trigger ON user_roles;

-- Remove founder role from other users (demote to creator)
UPDATE user_roles 
SET role = 'creator' 
WHERE user_id IN (
  'a1229e3e-54f9-49c8-b736-1e4b835a7588',  -- just4abhii@gmail.com
  'aae8e9f3-8526-49fd-8d6a-3d33570b8fd8',  -- coderrrabhi@gmail.com
  '12a9e581-f524-41e7-a4c1-b3270ed0582b'   -- xbhishekh@gmail.com (owner)
);

-- Re-create the protection trigger
CREATE TRIGGER protect_owner_role_trigger
  BEFORE UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION protect_owner_role();

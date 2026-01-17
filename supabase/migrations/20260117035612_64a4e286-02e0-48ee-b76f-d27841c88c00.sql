-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view participants in their DM rooms" ON public.dm_participants;

-- Create a simpler, non-recursive policy
-- Users can see their own participant records
CREATE POLICY "Users can view own participant records"
ON public.dm_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Users can see other participants in rooms they belong to using a direct room_id check
-- This uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_dm_participant(room_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dm_participants 
    WHERE room_id = room_id_param AND user_id = auth.uid()
  );
$$;

-- Policy for seeing other participants in same room (using function to avoid recursion)
CREATE POLICY "Users can view other participants in shared rooms"
ON public.dm_participants
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.user_is_dm_participant(room_id)
  OR is_admin(auth.uid())
);
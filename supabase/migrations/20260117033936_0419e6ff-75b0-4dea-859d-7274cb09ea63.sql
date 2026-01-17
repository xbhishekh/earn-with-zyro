-- Drop existing SELECT policy on dm_participants
DROP POLICY IF EXISTS "Users can view own DM rooms" ON public.dm_participants;

-- Create new policy that allows users to see all participants in rooms they belong to
CREATE POLICY "Users can view participants in their DM rooms"
ON public.dm_participants
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_admin(auth.uid())
  OR room_id IN (
    SELECT room_id FROM public.dm_participants WHERE user_id = auth.uid()
  )
);
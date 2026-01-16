-- Fix: Allow authenticated users to create DM chat rooms
CREATE POLICY "Users can create DM rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (type = 'dm' AND campaign_id IS NULL);

-- Also add policy for users to add other participants to DM rooms they just created
CREATE POLICY "Users can add participants to DM rooms"
ON public.dm_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = room_id AND cr.type = 'dm'
  )
);
-- Drop existing policies for chat_messages that may be too restrictive for DMs
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON chat_messages;

-- Create comprehensive policy for viewing chat messages (includes DMs)
CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      LEFT JOIN campaign_members cm ON cr.campaign_id = cm.campaign_id AND cm.user_id = auth.uid()
      LEFT JOIN dm_participants dp ON cr.id = dp.room_id AND dp.user_id = auth.uid()
      WHERE cr.id = chat_messages.room_id 
      AND (
        cm.user_id IS NOT NULL 
        OR dp.user_id IS NOT NULL 
        OR cr.type = 'support' 
        OR is_admin(auth.uid())
      )
    )
  );

-- Ensure users can send messages to DM rooms they're part of
DROP POLICY IF EXISTS "Users can send messages to DM rooms" ON chat_messages;
CREATE POLICY "Users can send messages to DM rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM dm_participants dp
      WHERE dp.room_id = chat_messages.room_id
      AND dp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN campaign_members cm ON cr.campaign_id = cm.campaign_id
      WHERE cr.id = chat_messages.room_id
      AND cm.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

-- Allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Enable realtime for chat_messages if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;
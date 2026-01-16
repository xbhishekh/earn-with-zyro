-- Add read_at column to chat_messages for read receipts
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster unread queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON public.chat_messages(room_id, read_at) WHERE read_at IS NULL;

-- Allow users to update read_at for messages they received
DROP POLICY IF EXISTS "Users can mark messages as read" ON chat_messages;
CREATE POLICY "Users can mark messages as read" ON chat_messages
  FOR UPDATE USING (
    -- User can update messages in DM rooms they're part of (to mark as read)
    EXISTS (
      SELECT 1 FROM dm_participants dp
      WHERE dp.room_id = chat_messages.room_id
      AND dp.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dm_participants dp
      WHERE dp.room_id = chat_messages.room_id
      AND dp.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );
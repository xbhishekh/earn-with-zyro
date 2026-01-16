-- Drop existing policies to recreate with better ones
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Admins can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;

-- =============================================
-- CHAT ROOMS - Updated Policies
-- =============================================

-- Anyone can view chat rooms (for listing)
CREATE POLICY "Anyone can view chat rooms" ON chat_rooms 
  FOR SELECT USING (true);

-- Admins can manage chat rooms (insert, update, delete)
CREATE POLICY "Admins can insert chat rooms" ON chat_rooms 
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update chat rooms" ON chat_rooms 
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete chat rooms" ON chat_rooms 
  FOR DELETE USING (is_admin(auth.uid()));

-- Campaign members can also create chat rooms for their campaigns
CREATE POLICY "Members can insert campaign chat rooms" ON chat_rooms 
  FOR INSERT WITH CHECK (
    campaign_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM campaign_members WHERE user_id = auth.uid() AND campaign_id = chat_rooms.campaign_id)
  );

-- =============================================
-- CHAT MESSAGES - Updated Policies
-- =============================================

-- Users can view messages in rooms they have access to
CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      LEFT JOIN campaign_members cm ON cr.campaign_id = cm.campaign_id AND cm.user_id = auth.uid()
      WHERE cr.id = chat_messages.room_id 
      AND (cm.user_id IS NOT NULL OR cr.type = 'support' OR is_admin(auth.uid()))
    )
  );

-- Logged in users can send messages
CREATE POLICY "Logged in users can send messages" ON chat_messages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON chat_messages 
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any message" ON chat_messages 
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- ANNOUNCEMENTS - Updated Policies
-- =============================================

-- Anyone can read announcements
CREATE POLICY "Anyone can read announcements" ON announcements 
  FOR SELECT USING (true);

-- Admins can manage announcements
CREATE POLICY "Admins can insert announcements" ON announcements 
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements" ON announcements 
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements" ON announcements 
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- ENABLE REALTIME
-- =============================================

-- Set replica identity for realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE announcements REPLICA IDENTITY FULL;

-- Add tables to realtime publication (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;
END $$;
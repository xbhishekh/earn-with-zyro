-- Create trigger function to update support chat on new message
CREATE OR REPLACE FUNCTION update_support_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_chats
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = now(),
    -- If admin sent, increment user's unread
    unread_count = CASE WHEN NEW.sender_type = 'admin' THEN COALESCE(unread_count, 0) + 1 ELSE unread_count END,
    -- If user sent, increment admin's unread
    admin_unread_count = CASE WHEN NEW.sender_type = 'user' THEN COALESCE(admin_unread_count, 0) + 1 ELSE admin_unread_count END
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_support_message_insert ON support_messages;

-- Create trigger for auto-updating chat on new message
CREATE TRIGGER on_support_message_insert
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_support_chat_on_message();